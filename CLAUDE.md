# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Educational sales analytics dashboard with multi-product support. Backend processes Excel files, frontend displays interactive analytics. Auto-deploys to VPS via GitHub Actions.

## Development Commands

### Local Development
```bash
# Backend (Terminal 1)
cd backend && python main.py

# Frontend (Terminal 2)
cd frontend && npm run dev
```

### Production Build
```bash
cd frontend && npm run build
```

### Deployment
```bash
git add . && git commit -m "message" && git push
# GitHub Actions auto-deploys to VPS
```

## Architecture

### Data Flow
1. **Excel Upload** → `backend/data/` directory
2. **Configuration** → `backend/data/config.json` maps product codes to brands
3. **Backend** loads active Excel file, filters by product mappings
4. **Frontend** fetches filtered data, displays with product-specific branding

### Product System
Products are defined in two places that must stay in sync:

1. **Frontend branding** (`frontend/src/productConfig.js`):
   - Logo paths, colors, display names
   - Each product needs: name, logo, colors (primary, secondary, gradient)

2. **Backend filtering** (`backend/data/config.json`):
   - Maps product slug to Excel "Tipo Publicación" codes
   - Example: `"ta-tum": ["022: Tatum", "049: Tarifa Plana Ta-tum"]`
   - Active file selection determines which Excel is loaded

### Key Backend Patterns

**Configuration-driven filtering:**
- `load_config()` reads `config.json` for active file and product mappings
- `filter_by_product()` uses mappings to filter by "Tipo Publicación" column
- All analytics endpoints accept optional `product` parameter

**Data loading:**
- Lifespan event loads Excel on startup
- Excel columns have embedded newlines (e.g., `"Fecha Factura\nY-M"`)
- Column names are stripped via `df.columns.str.strip()`

**API structure:**
- All endpoints in single `main.py` file
- CORS enabled for frontend requests
- File upload endpoints for Excel management

### Key Frontend Patterns

**Dynamic theming:**
- CSS custom properties (`--primary-color`, `--secondary-color`) updated when product changes
- `getProductConfig()` returns current product's colors/logo
- All components receive `selectedProduct` prop from App.jsx

**State management:**
- App.jsx manages global state (years, products, selectedProduct)
- Dashboard.jsx manages year comparison state
- Each visualization component fetches its own data via axios

**Year comparison logic:**
- year1 (selectedYear1) = "Año a Comparar (actual)" - the later/current year
- year2 (selectedYear2) = "Año Base (anterior)" - the earlier/previous year
- Backward selection prevented: year1 >= year2 enforced in dropdowns
- Retention metrics show: year2 → year1 (e.g., "2024 → 2025")

**Component architecture:**
- Dashboard.jsx orchestrates all child components
- Each visualization component is self-contained (fetches own data, manages own state)
- Components: TopColegios, TopAsesores, MonthlyComparison, RetentionMetrics, AsesoresPerformance, LostColegios, NewColegios, FileManager

### Excel File Requirements

Required columns (exact names, some with embedded newlines):
- `Tipo Publicación` - Product code for filtering
- `Año Factura` - Invoice year (integer)
- `Fecha Factura\nY-M` - Date in YYYY/MM format
- `Colegio` - School name
- `Asesor` - Sales rep name
- `Coordinador` - Coordinator name
- `Total neto` - Net revenue (numeric)
- `Congregación Envío` - Congregation name

## Adding a New Product

1. Add logo PNG/SVG to `frontend/public/`
2. Add entry to `frontend/src/productConfig.js` with name, logo path, colors
3. Upload Excel file via dashboard File Manager OR via SCP to VPS `backend/data/`
4. Update `backend/data/config.json`:
   - Add product slug to `product_mappings` with array of "Tipo Publicación" codes
   - Optionally update `active_file` to new Excel filename
5. Commit frontend changes and push (triggers auto-deploy)

## VPS Deployment Architecture

- **Nginx** on port 8080 serves frontend and proxies `/api` to backend
- **Backend** on port 8000 (internal only) runs as systemd service
- **Frontend** built static files in `/var/www/dashboard/frontend-dist/`
- **Data directory** `/var/www/dashboard/backend/data/` persists across deployments
- **GitHub Actions** workflow in `.github/workflows/deploy.yml` handles deployment
- **Secrets** stored in GitHub: VPS_HOST, VPS_USER, VPS_SSH_KEY

## Production URL

http://72.61.103.174:8080

## Important Notes

- Excel files and config.json are gitignored - they contain customer data
- Environment variable `VITE_API_URL` must match deployment location
- Product selector only shows products with data in active Excel file
- Backend must be restarted after config.json changes
- Frontend requires rebuild after productConfig.js changes
