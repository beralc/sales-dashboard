"""
Build the archive of closed (finished) years.

The ERP export can only cover a limited range, so the dashboard keeps finished
years in `data/archive.parquet` and merges them with whatever current-year
export is active. Run this once per year, after a year closes, pointing it at
an export that still contains that year.

    python3 build_archive.py <source-export> <last-closed-year>

Example, after 2026 closes:
    python3 build_archive.py Crea_tu_propio_informe_20270115_090000.xlsx 2026
"""
import os
import sys

import pandas as pd

script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, "data")
archive_path = os.path.join(data_dir, "archive.parquet")


def load_any(name):
    """Load an export by name, preferring its Parquet cache when present."""
    base = os.path.join(data_dir, name.rsplit('.', 1)[0])
    if os.path.exists(base + ".parquet"):
        return pd.read_parquet(base + ".parquet")
    frame = pd.read_excel(os.path.join(data_dir, name))
    frame.columns = frame.columns.str.strip()
    return frame


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    source, last_closed = sys.argv[1], int(sys.argv[2])
    df = load_any(source)

    # Only fully finished years belong in the archive. Rows with no invoice
    # year (0/NaN) are open orders and always come from the live export.
    closed = df[df['Año Factura'].between(1, last_closed)]

    if os.path.exists(archive_path):
        existing = pd.read_parquet(archive_path)
        # Years supplied by the new source win; everything else is kept.
        keep = existing[~existing['Año Factura'].isin(closed['Año Factura'].unique())]
        closed = pd.concat([keep, closed], ignore_index=True)

    closed = closed.sort_values('Año Factura')
    closed.to_parquet(archive_path, index=False)

    counts = closed['Año Factura'].value_counts().sort_index()
    print(f"Archive written: {archive_path}")
    print(f"{len(closed):,} rows across {len(counts)} years")
    for year, n in counts.items():
        print(f"  {int(year)}  {n:>8,} rows")


if __name__ == "__main__":
    main()
