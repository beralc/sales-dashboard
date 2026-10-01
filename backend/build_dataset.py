"""
Combine several ERP exports into the single dataset the dashboard serves.

Texto is exported separately because it is enormous — 755k rows and 92M, about
four times everything else put together — so the regular export does not
contain it. The dashboard loads one file, and combining at request time would
cost three and a half minutes on the Excel read and briefly double the frame in
memory. So the exports are merged once, offline, into a Parquet the backend
reads in about ten seconds.

    python3 build_dataset.py <salida.parquet> <export1.xlsx> [export2.xlsx ...]

Example:
    python3 build_dataset.py dataset_combinado.parquet \\
        Crea_tu_propio_informe_20261001_123416.xlsx \\
        Crea_tu_propio_informe_20261001_030758.xlsx

Then point "active_file" at the matching .xlsx name (which need not exist —
load_data falls back to the Parquet) and restart the backend.
"""
import os
import sys

import pandas as pd

script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, "data")


def load_export(name):
    """Load one export by name, preferring its Parquet cache when present."""
    path = name if os.path.isabs(name) else os.path.join(data_dir, name)
    base = path.rsplit('.', 1)[0]

    if os.path.exists(base + ".parquet"):
        print(f"  {os.path.basename(name)}: leyendo cache Parquet")
        return pd.read_parquet(base + ".parquet")

    print(f"  {os.path.basename(name)}: leyendo Excel (puede tardar varios minutos)")
    frame = pd.read_excel(path)
    frame.columns = frame.columns.str.strip()

    # Same derivation load_data performs, so a combined file behaves identically.
    if 'Fecha Factura\nY-M' in frame.columns:
        frame['Month'] = frame['Fecha Factura\nY-M'].astype(str).str.extract(r'(\d{4}/\d{2})')[0]

    frame.to_parquet(base + ".parquet", index=False)
    return frame


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    out_name, sources = sys.argv[1], sys.argv[2:]
    out_path = out_name if os.path.isabs(out_name) else os.path.join(data_dir, out_name)

    frames = []
    for name in sources:
        frame = load_export(name)
        print(f"    {len(frame):,} filas")
        frames.append(frame)

    # Refuse rather than silently produce a frame with holes: a column present
    # in one export and missing in another would read as all-null downstream.
    reference = list(frames[0].columns)
    for name, frame in zip(sources[1:], frames[1:]):
        if list(frame.columns) != reference:
            missing = set(reference) - set(frame.columns)
            extra = set(frame.columns) - set(reference)
            print(f"ERROR: {os.path.basename(name)} no tiene las mismas columnas")
            if missing:
                print(f"  faltan: {sorted(missing)}")
            if extra:
                print(f"  sobran: {sorted(extra)}")
            sys.exit(1)

    combined = pd.concat(frames, ignore_index=True)
    combined.to_parquet(out_path, index=False)

    print()
    print(f"Escrito {out_path}")
    print(f"{len(combined):,} filas | {os.path.getsize(out_path) / 1024**2:.0f} MB en disco")
    counts = combined['Año Factura'].value_counts().sort_index()
    for year, n in counts.items():
        if year:
            total = combined[combined['Año Factura'] == year]['Total neto'].sum()
            print(f"  {int(year)}  {n:>9,} filas  {total:>16,.0f}")


if __name__ == "__main__":
    main()
