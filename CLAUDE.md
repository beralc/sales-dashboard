# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sales analytics dashboard for Edelvives, an educational publisher. A FastAPI backend serves aggregates computed with pandas from an Excel export of the ERP; a React frontend renders them. Two views share one app: **Ventas** (`/`, product-centric) and **Congregaciones** (`/congregaciones`, congregation-centric, built for a specific stakeholder who works at that level).

Live at https://dashboard.bernardomorales.com — auto-deployed from `main`.

## Commands

```bash
# Frontend
cd frontend && npm run dev          # dev server (expects API at VITE_API_URL, default :8000)
cd frontend && npm run build        # must pass before committing
cd frontend && npx eslint src       # see "Known lint baseline" below

# Backend
cd backend && python main.py        # serves on :8000

# Deploy: push to main; GitHub Actions does the rest
git push origin main
gh run watch $(gh run list --repo beralc/sales-dashboard --limit 1 --json databaseId --jq '.[0].databaseId') --repo beralc/sales-dashboard
```

There are **no tests**. Verification is done by running the real endpoints against the real export — see "Verifying changes".

### Known lint baseline

`npx eslint src` reports **2 errors and 3 warnings that pre-date current work** (`App.jsx` "Cannot access variable before it is declared"; `AuthContext.jsx` react-refresh). Do not treat these as regressions; do confirm you have not added new ones.

### requirements.txt is incomplete

It omits `PyJWT[crypto]` (used by `auth.py`) and `pyarrow` (used for the Parquet cache). The server works because they were installed by hand. A fresh venv built from the file alone will not import.

## Data pipeline

`load_data()` in `backend/main.py` composes four stages into the module-level global `df`, which every endpoint reads:

1. **Load the active export.** `config.json` names it. A `.parquet` sibling is used when newer than the `.xlsx`, and written on first Excel read — loading Excel takes ~30s, Parquet ~1s.
2. **Merge the archive.** The ERP export only reaches back a few years. `data/archive.parquet` holds finished years (built by `build_archive.py`) and supplies any year the active export does not contain. The active export always wins for years it does cover.
3. **Normalise `Colegio`.** The ERP writes `"."` for sales with no school attached. Left alone it ranked as the single largest "school". It becomes null, which removes it from every school-based figure because they all drop nulls.
4. **Expose to endpoints.** No caching layer beyond this; a read-mostly global is the right shape here and should not be replaced with a database.

### Excel column quirks

Column names carry embedded newlines — `"Fecha Factura\nY-M"`, `"Proyección neta\n con atrasos 2026"`. `df.columns.str.strip()` does not remove those. Invoice dates have **no day component**, only `YYYY/MM`; this constrains period comparison (below).

## The three composable filters

Every panel must apply all three the same way, or figures stop reconciling across the screen. This has broken twice.

| Filter | Helper | Notes |
|---|---|---|
| Product | `filter_by_product(df, product)` | Accepts a comma-separated list (`"ta-tum,dispositivos"`), so multi-select works on endpoints that only ever took one product. A single slug also honours the per-product `asesor_filter` a list cannot express. |
| Congregación | `filter_by_congregation(df, congregacion)` | `"__SIN__"` selects schools with none — ~47% of rows, a real category. |
| Period | `clamp_to_period(df, comparison_cutoff(y1, y2))` | See below. |

When adding an endpoint that reports a period total, apply all three. When adding a *panel*, pass all three from `Dashboard.jsx`.

## Period comparison

The current year is always partial. Comparing it against a full prior year measured a quiet half against a busy one — the business is heavily back-loaded (Aug–Dec 2025 was 3.5× Jan–Jul), which reported the largest product at −79.9% when the like-for-like figure was positive.

Both sides of a comparison are therefore clamped to the same month range. Two **closed** years are still compared in full.

The cutoff is derived, never configured: the ERP names each export `Crea_tu_propio_informe_YYYYMMDD_HHMMSS.xlsx`, and `get_export_date()` parses that (falling back to mtime). The cutoff is the **latest month with revenue**, including the month in progress.

That month is incomplete and cannot be trimmed on the base-year side, because invoice dates carry no day. The comparison for that month is therefore approximate, and `DataCoverage.jsx` says so in Spanish. This was a deliberate reversal: excluding the partial month was arithmetically cleaner but hid 3.4M of real invoiced revenue.

## Reconciliation invariant

The figures on one screen must add up, because users check them against each other:

```
retained + new + otros-clientes == summary total   (to the cent)
```

`otros-clientes` is revenue from customers that are **not schools** — publishers, distributors, export accounts. They have no `Colegio`, so retention cannot classify them; without that panel the summary card silently exceeded the breakdown below it.

Likewise `top-colegios` at a high limit should reconcile with `summary` minus the non-school rows. If a change breaks either, the numbers are wrong somewhere.

## Auth

- Every `/api/*` route requires a verified Firebase ID token. `/` stays public for monitoring.
- `auth.py` verifies against **Google's public keys** — no service-account credentials on the server, only the public project id. Any failure to verify, including failure to reach Google, denies.
- The allowed email domains live in **two** places that must agree: `auth.py` (what the API answers) and `AuthContext.jsx` (what the UI renders).
- The frontend attaches the token via an **axios interceptor** in `firebase.js`, so every component gets it without doing anything. Anything fetching outside axios will 401.
- **Admin gate**: `upload-file`, `set-active-file` and `update-mappings` additionally require the caller's email to be in `admin_emails` in `config.json`. If that key is absent the gate stays permissive (and logs a warning) so an install cannot lock its owner out.
- Client filenames go through `safe_data_path()`. The service runs as **root**, so a traversal here writes anywhere.

## Adding a product

Two places must stay in sync:

1. `frontend/src/productConfig.js` — display name, logo path, colors. Text colour on the primary card is **derived** by `getOnPrimaryColor()`, not configured; the palette spans bright yellow to dark slate and white is unreadable on several.
2. `config.json` on the server — `product_mappings`, slug to a list of `Tipo Publicación` codes.

Logos go in `frontend/public/`, which the deploy syncs. Only products with rows in the active export appear (`available_products()`).

## Deployment

GitHub Actions on push to `main`: scp `frontend/src`, `frontend/public` and `backend/*.py`, then `npm run build` and `systemctl restart dashboard-backend` on the VPS.

Nginx serves the built frontend and proxies `/api`, with `try_files … /index.html`, so client-side routes like `/congregaciones` work without extra config. A missing static file therefore returns `index.html` with a 200 — a "working" image request of a few hundred bytes means the file never deployed.

`config.json` and the Excel exports are **gitignored and live only on the server**. Changing `active_file` through the API reloads data; editing `config.json` by hand needs a restart.

## Verifying changes

There is no local dataset in the repo, and the backend cannot be meaningfully exercised without one. The reliable loop is to run the real functions against the real export on the VPS:

```bash
# main.py is importable; call endpoint functions directly with asyncio.run().
# Pass every parameter explicitly — unset ones default to FastAPI Query objects,
# not None, which silently produces wrong results.
scp backend/main.py root@72.61.103.174:/tmp/x_main.py
ssh root@72.61.103.174 'cp /tmp/x_main.py /var/www/dashboard/backend/ && cd /var/www/dashboard/backend && python3 check.py'
```

Check a real figure against a known value rather than only that the call returns. Several bugs this repo has shipped — a deleted helper, a filter never applied, a percentage against a near-zero base — passed lint and build and were caught only by comparing numbers.

An `~/.ssh/config` entry `dashboard-vps` multiplexes the connection; prefer it over repeated fresh connections.

## Percentages

Bases are often tiny or negative (credit notes), which turns a trivial movement into a four-digit percentage — an early build displayed −976.7%. `utils/format.js` `getChange()` returns "nuevo" for a non-positive base and euros for a base under €500. Use it rather than computing percentages inline.
