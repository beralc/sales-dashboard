from fastapi import FastAPI, Query, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import pandas as pd
from typing import List, Optional, Dict
from datetime import datetime
import os
import json
from pathlib import Path
import shutil

# Global variable to store the dataframe
df = None
script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, "data")
config_file = os.path.join(data_dir, "config.json")

# Ensure data directory exists
os.makedirs(data_dir, exist_ok=True)

def load_config():
    """Load configuration for product mappings and active file"""
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            return json.load(f)
    return {
        "active_file": None,
        "product_mappings": {
            "ta-tum": ["022: Tatum", "049: Tarifa Plana Ta-tum"],
            "gosteam": ["020: Robótica", "045: Tarifa Plana Steam", "042: Mobiliario Steam"],
            "goproject": ["041: GoProject y Otros"]
        }
    }

def save_config(config):
    """Save configuration"""
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)

def load_data():
    """Load and preprocess the Excel data"""
    global df
    config = load_config()

    # If no active file, return empty dataframe
    if not config.get("active_file"):
        df = pd.DataFrame()
        return df

    # Load the active file
    excel_file = os.path.join(data_dir, config["active_file"])

    if not os.path.exists(excel_file):
        # Fallback to old location for backwards compatibility
        excel_file = os.path.join(script_dir, "..", config["active_file"])
        if not os.path.exists(excel_file):
            df = pd.DataFrame()
            return df

    df = pd.read_excel(excel_file)

    # Clean column names (remove leading newlines)
    df.columns = df.columns.str.strip()

    # Extract month from fecha factura
    if 'Fecha Factura\nY-M' in df.columns:
        df['Month'] = df['Fecha Factura\nY-M'].str.extract(r'(\d{4}/\d{2})')[0]

    return df

def filter_by_product(data_df: pd.DataFrame, product: Optional[str]) -> pd.DataFrame:
    """Filter dataframe by product (Tipo Publicación) and optionally by Asesor"""
    if data_df.empty or not product or product.lower() == 'todos':
        return data_df

    if 'Tipo Publicación' not in data_df.columns:
        return data_df

    # Load product mappings from config
    config = load_config()
    product_mappings = config.get("product_mappings", {})

    # Normalize product name
    product_lower = product.lower().strip()

    # Get the mapping for this brand
    mapping = product_mappings.get(product_lower)

    if not mapping:
        return data_df

    # Support both list format and dict format
    if isinstance(mapping, list):
        # Old format: just product codes
        product_codes = mapping
        asesor_filter = None
    elif isinstance(mapping, dict):
        # New format: with optional asesor filter
        product_codes = mapping.get("product_codes", [])
        asesor_filter = mapping.get("asesor_filter")
    else:
        return data_df

    if not product_codes:
        return data_df

    # Filter by product codes
    mask = data_df['Tipo Publicación'].isin(product_codes)
    filtered_df = data_df[mask]

    # Additionally filter by asesor if specified
    if asesor_filter and 'Asesor' in filtered_df.columns:
        filtered_df = filtered_df[filtered_df['Asesor'] == asesor_filter]

    return filtered_df

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load data when the API starts"""
    load_data()
    print(f"Data loaded: {len(df)} records")
    print(f"Columns: {df.columns.tolist()}")
    yield
    # Cleanup (if needed) when shutting down
    print("Shutting down...")

app = FastAPI(title="Sales Dashboard API", lifespan=lifespan)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "records": len(df) if df is not None else 0,
        "years": sorted([int(y) for y in df['Año Factura'].dropna().unique() if y > 0]) if df is not None else []
    }

@app.get("/api/years")
async def get_years():
    """Get available years in the dataset"""
    years = sorted([int(y) for y in df['Año Factura'].dropna().unique() if y > 0])
    return {"years": years}

@app.get("/api/products")
async def get_products():
    """Get available brands based on configuration"""
    config = load_config()
    product_mappings = config.get("product_mappings", {})

    # Return only brands that have mappings and data
    available_brands = []
    if df.empty or 'Tipo Publicación' not in df.columns:
        return {"products": []}

    all_products_in_data = df['Tipo Publicación'].dropna().unique().tolist()

    for brand, mapping in product_mappings.items():
        # Handle both list and dict formats
        if isinstance(mapping, list):
            mapped_codes = mapping
        elif isinstance(mapping, dict):
            mapped_codes = mapping.get("product_codes", [])
        else:
            continue

        # Check if any of the mapped codes exist in the data
        if any(code in all_products_in_data for code in mapped_codes):
            available_brands.append(brand)

    return {"products": sorted(available_brands)}

@app.get("/api/top-colegios")
async def get_top_colegios(
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[str] = Query(None, description="Filter by month (YYYY/MM)"),
    product: Optional[str] = Query(None, description="Filter by product (ta-tum, gosteam, goproject)"),
    limit: int = Query(10, description="Number of top colegios to return")
):
    """Get top colegios by total neto"""
    filtered_df = df.copy()

    # Apply product filter
    filtered_df = filter_by_product(filtered_df, product)

    # Apply filters
    if year:
        filtered_df = filtered_df[filtered_df['Año Factura'] == year]

    if month:
        filtered_df = filtered_df[filtered_df['Month'] == month]

    # Group by colegio and sum total neto
    top_colegios = (
        filtered_df.groupby(['Colegio', 'Congregación Envío'])['Total neto']
        .sum()
        .reset_index()
        .sort_values('Total neto', ascending=False)
        .head(limit)
    )

    result = []
    for _, row in top_colegios.iterrows():
        result.append({
            "colegio": row['Colegio'],
            "congregacion": row['Congregación Envío'],
            "total_neto": float(row['Total neto'])
        })

    return {"data": result}

@app.get("/api/top-asesores")
async def get_top_asesores(
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[str] = Query(None, description="Filter by month (YYYY/MM)"),
    product: Optional[str] = Query(None, description="Filter by product (ta-tum, gosteam, goproject)"),
    limit: int = Query(10, description="Number of top asesores to return")
):
    """Get top asesores (sales reps) by total neto"""
    filtered_df = df.copy()

    # Apply product filter
    filtered_df = filter_by_product(filtered_df, product)

    # Apply filters
    if year:
        filtered_df = filtered_df[filtered_df['Año Factura'] == year]

    if month:
        filtered_df = filtered_df[filtered_df['Month'] == month]

    # Group by asesor and sum total neto
    top_asesores = (
        filtered_df.groupby('Asesor')['Total neto']
        .sum()
        .reset_index()
        .sort_values('Total neto', ascending=False)
        .head(limit)
    )

    result = []
    for _, row in top_asesores.iterrows():
        result.append({
            "asesor": row['Asesor'],
            "total_neto": float(row['Total neto'])
        })

    return {"data": result}

@app.get("/api/monthly-comparison")
async def get_monthly_comparison(
    year1: int = Query(..., description="First year to compare"),
    year2: int = Query(..., description="Second year to compare")
):
    """Compare monthly sales between two years"""

    # Filter data for both years
    df_year1 = df[df['Año Factura'] == year1].copy()
    df_year2 = df[df['Año Factura'] == year2].copy()

    # Extract month number from Month column
    df_year1['MonthNum'] = df_year1['Month'].str.extract(r'/(\d{2})')[0]
    df_year2['MonthNum'] = df_year2['Month'].str.extract(r'/(\d{2})')[0]

    # Group by month
    monthly1 = df_year1.groupby('MonthNum')['Total neto'].sum().to_dict()
    monthly2 = df_year2.groupby('MonthNum')['Total neto'].sum().to_dict()

    # Create result with all 12 months
    months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    result = []
    for i, month in enumerate(months):
        result.append({
            "month": month_names[i],
            "monthNum": month,
            f"year{year1}": float(monthly1.get(month, 0)),
            f"year{year2}": float(monthly2.get(month, 0))
        })

    return {"data": result}

@app.get("/api/monthly-revenue")
async def get_monthly_revenue(
    year: int = Query(..., description="Year to get monthly revenue"),
    product: Optional[str] = Query(None, description="Filter by product (ta-tum, gosteam, goproject)")
):
    """Get monthly revenue for a single year"""

    # Filter data for the year
    df_year = df[df['Año Factura'] == year].copy()

    # Apply product filter
    df_year = filter_by_product(df_year, product)

    # Extract month number from Month column
    df_year['MonthNum'] = df_year['Month'].str.extract(r'/(\d{2})')[0]

    # Group by month
    monthly = df_year.groupby('MonthNum')['Total neto'].sum().to_dict()

    # Create result with all 12 months
    months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    month_names_es = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    result = []
    for i, month in enumerate(months):
        result.append({
            "month": month_names_es[i],
            "monthNum": month,
            "revenue": float(monthly.get(month, 0))
        })

    return {"data": result, "year": year}

@app.get("/api/summary")
async def get_summary(
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[str] = Query(None, description="Filter by month (YYYY/MM)"),
    product: Optional[str] = Query(None, description="Filter by product (ta-tum, gosteam, goproject)")
):
    """Get summary statistics"""
    filtered_df = df.copy()

    # Apply product filter
    filtered_df = filter_by_product(filtered_df, product)

    # Apply filters
    if year:
        filtered_df = filtered_df[filtered_df['Año Factura'] == year]

    if month:
        filtered_df = filtered_df[filtered_df['Month'] == month]

    total_revenue = float(filtered_df['Total neto'].sum())
    total_records = len(filtered_df)
    unique_colegios = filtered_df['Colegio'].nunique()
    unique_asesores = filtered_df['Asesor'].nunique()

    return {
        "total_revenue": total_revenue,
        "total_records": total_records,
        "unique_colegios": unique_colegios,
        "unique_asesores": unique_asesores
    }

@app.get("/api/lost-colegios")
async def get_lost_colegios(
    year1: int = Query(..., description="Previous year (had sales)"),
    year2: int = Query(..., description="Current year (lost sales)"),
    product: Optional[str] = Query(None, description="Filter by product (ta-tum, gosteam, goproject)")
):
    """Get colegios that had sales in year1 but not in year2"""

    # Get unique colegios for each year
    df_year1 = filter_by_product(df[df['Año Factura'] == year1].copy(), product)
    df_year2 = filter_by_product(df[df['Año Factura'] == year2].copy(), product)

    colegios_year1 = set(df_year1['Colegio'].dropna().unique())
    colegios_year2 = set(df_year2['Colegio'].dropna().unique())

    # Find colegios that were in year1 but not in year2
    lost_colegios_names = colegios_year1 - colegios_year2

    # Get details for lost colegios including their revenue in year1
    lost_colegios_data = []
    for colegio_name in lost_colegios_names:
        colegio_df = df_year1[df_year1['Colegio'] == colegio_name]
        total_revenue = float(colegio_df['Total neto'].sum())
        congregacion = colegio_df['Congregación Envío'].iloc[0] if len(colegio_df) > 0 else None
        # Get asesor and coordinador - use the most frequent one if there are multiple
        asesor = colegio_df['Asesor'].mode()[0] if len(colegio_df) > 0 and not colegio_df['Asesor'].isna().all() else None
        coordinador = colegio_df['Coordinador'].mode()[0] if len(colegio_df) > 0 and not colegio_df['Coordinador'].isna().all() else None

        lost_colegios_data.append({
            "colegio": colegio_name,
            "congregacion": congregacion,
            "revenue_in_previous_year": total_revenue,
            "asesor": asesor,
            "coordinador": coordinador
        })

    # Sort by revenue (descending)
    lost_colegios_data.sort(key=lambda x: x['revenue_in_previous_year'], reverse=True)

    return {
        "year1": year1,
        "year2": year2,
        "total_lost": len(lost_colegios_data),
        "total_revenue_lost": sum(c['revenue_in_previous_year'] for c in lost_colegios_data),
        "data": lost_colegios_data
    }

@app.get("/api/new-colegios")
async def get_new_colegios(
    year1: int = Query(..., description="Previous year (baseline)"),
    year2: int = Query(..., description="Current year (new sales)"),
    product: Optional[str] = Query(None, description="Filter by product (ta-tum, gosteam, goproject)")
):
    """Get colegios that have sales in year2 but not in year1 (new customers)"""

    # Get unique colegios for each year
    df_year1 = filter_by_product(df[df['Año Factura'] == year1].copy(), product)
    df_year2 = filter_by_product(df[df['Año Factura'] == year2].copy(), product)

    colegios_year1 = set(df_year1['Colegio'].dropna().unique())
    colegios_year2 = set(df_year2['Colegio'].dropna().unique())

    # Find colegios that are in year2 but not in year1
    new_colegios_names = colegios_year2 - colegios_year1

    # Get details for new colegios including their revenue in year2
    new_colegios_data = []
    for colegio_name in new_colegios_names:
        colegio_df = df_year2[df_year2['Colegio'] == colegio_name]
        total_revenue = float(colegio_df['Total neto'].sum())
        congregacion = colegio_df['Congregación Envío'].iloc[0] if len(colegio_df) > 0 else None
        # Get asesor and coordinador - use the most frequent one if there are multiple
        asesor = colegio_df['Asesor'].mode()[0] if len(colegio_df) > 0 and not colegio_df['Asesor'].isna().all() else None
        coordinador = colegio_df['Coordinador'].mode()[0] if len(colegio_df) > 0 and not colegio_df['Coordinador'].isna().all() else None

        new_colegios_data.append({
            "colegio": colegio_name,
            "congregacion": congregacion,
            "revenue_in_current_year": total_revenue,
            "asesor": asesor,
            "coordinador": coordinador
        })

    # Sort by revenue (descending)
    new_colegios_data.sort(key=lambda x: x['revenue_in_current_year'], reverse=True)

    return {
        "year1": year1,
        "year2": year2,
        "total_new": len(new_colegios_data),
        "total_revenue_new": sum(c['revenue_in_current_year'] for c in new_colegios_data),
        "data": new_colegios_data
    }

@app.get("/api/retention-metrics")
async def get_retention_metrics(
    year1: int = Query(..., description="Previous year"),
    year2: int = Query(..., description="Current year"),
    product: Optional[str] = Query(None, description="Filter by product (ta-tum, gosteam, goproject)")
):
    """Get retention metrics comparing two years"""

    # Get unique colegios for each year
    df_year1 = filter_by_product(df[df['Año Factura'] == year1].copy(), product)
    df_year2 = filter_by_product(df[df['Año Factura'] == year2].copy(), product)

    colegios_year1 = set(df_year1['Colegio'].dropna().unique())
    colegios_year2 = set(df_year2['Colegio'].dropna().unique())

    # Calculate retention metrics
    retained = colegios_year1 & colegios_year2  # Schools in both years
    lost = colegios_year1 - colegios_year2      # Schools in year1 but not year2
    new = colegios_year2 - colegios_year1       # Schools in year2 but not year1

    total_year1 = len(colegios_year1)
    total_year2 = len(colegios_year2)

    retention_rate = (len(retained) / total_year1 * 100) if total_year1 > 0 else 0
    churn_rate = (len(lost) / total_year1 * 100) if total_year1 > 0 else 0
    growth_rate = ((total_year2 - total_year1) / total_year1 * 100) if total_year1 > 0 else 0

    # Calculate revenue metrics
    revenue_year1 = float(df_year1['Total neto'].sum())
    revenue_year2 = float(df_year2['Total neto'].sum())

    # Revenue from retained customers
    retained_revenue_y1 = float(df_year1[df_year1['Colegio'].isin(retained)]['Total neto'].sum())
    retained_revenue_y2 = float(df_year2[df_year2['Colegio'].isin(retained)]['Total neto'].sum())

    # Revenue from lost customers (in year1)
    lost_revenue = float(df_year1[df_year1['Colegio'].isin(lost)]['Total neto'].sum())

    # Revenue from new customers (in year2)
    new_revenue = float(df_year2[df_year2['Colegio'].isin(new)]['Total neto'].sum())

    revenue_growth_rate = ((revenue_year2 - revenue_year1) / revenue_year1 * 100) if revenue_year1 > 0 else 0

    return {
        "year1": year1,
        "year2": year2,
        "schools": {
            "year1_total": total_year1,
            "year2_total": total_year2,
            "retained": len(retained),
            "lost": len(lost),
            "new": len(new),
            "retention_rate": round(retention_rate, 2),
            "churn_rate": round(churn_rate, 2),
            "growth_rate": round(growth_rate, 2)
        },
        "revenue": {
            "year1_total": revenue_year1,
            "year2_total": revenue_year2,
            "retained_year1": retained_revenue_y1,
            "retained_year2": retained_revenue_y2,
            "lost_revenue": lost_revenue,
            "new_revenue": new_revenue,
            "revenue_growth_rate": round(revenue_growth_rate, 2)
        }
    }

@app.get("/api/congregations")
async def get_congregations():
    """Get list of all unique congregations"""
    congregations = df['Congregación Envío'].dropna().unique().tolist()
    # Remove 'SIN CONGREGACION' and sort
    congregations = [c for c in congregations if c != 'SIN CONGREGACION']
    congregations.sort()
    return {"congregations": ['TODOS'] + congregations}

@app.get("/api/monthly-retention")
async def get_monthly_retention(
    year1: int = Query(..., description="Previous year"),
    year2: int = Query(..., description="Current year")
):
    """Get monthly retention metrics"""

    months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    month_names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    result = []
    for i, month in enumerate(months):
        # Get colegios for this month in both years
        df_y1_month = df[(df['Año Factura'] == year1) & (df['Month'].str.endswith(f'/{month}'))].copy()
        df_y2_month = df[(df['Año Factura'] == year2) & (df['Month'].str.endswith(f'/{month}'))].copy()

        colegios_y1 = set(df_y1_month['Colegio'].dropna().unique())
        colegios_y2 = set(df_y2_month['Colegio'].dropna().unique())

        retained = len(colegios_y1 & colegios_y2)
        lost = len(colegios_y1 - colegios_y2)
        new = len(colegios_y2 - colegios_y1)

        retention_rate = (retained / len(colegios_y1) * 100) if len(colegios_y1) > 0 else 0

        result.append({
            "month": month_names[i],
            "monthNum": month,
            "retained": retained,
            "lost": lost,
            "new": new,
            "retention_rate": round(retention_rate, 2),
            "total_y1": len(colegios_y1),
            "total_y2": len(colegios_y2)
        })

    return {"data": result}

@app.get("/api/asesores-performance")
async def get_asesores_performance(
    year1: int = Query(..., description="Previous year"),
    year2: int = Query(..., description="Current year"),
    product: Optional[str] = Query(None, description="Filter by product (ta-tum, gosteam, goproject)")
):
    """Get asesor performance metrics: retention, new, and lost colegios"""

    # Get unique colegios for each year
    df_year1 = filter_by_product(df[df['Año Factura'] == year1].copy(), product)
    df_year2 = filter_by_product(df[df['Año Factura'] == year2].copy(), product)

    # Get all asesores
    all_asesores = set(df_year1['Asesor'].dropna().unique()) | set(df_year2['Asesor'].dropna().unique())

    asesores_stats = []

    for asesor in all_asesores:
        # Get colegios managed by this asesor in each year
        colegios_y1 = set(df_year1[df_year1['Asesor'] == asesor]['Colegio'].dropna().unique())
        colegios_y2 = set(df_year2[df_year2['Asesor'] == asesor]['Colegio'].dropna().unique())

        retained = colegios_y1 & colegios_y2
        lost = colegios_y1 - colegios_y2
        new = colegios_y2 - colegios_y1

        # Calculate revenue for each category
        revenue_retained = float(df_year2[(df_year2['Asesor'] == asesor) & (df_year2['Colegio'].isin(retained))]['Total neto'].sum())
        revenue_new = float(df_year2[(df_year2['Asesor'] == asesor) & (df_year2['Colegio'].isin(new))]['Total neto'].sum())
        revenue_lost = float(df_year1[(df_year1['Asesor'] == asesor) & (df_year1['Colegio'].isin(lost))]['Total neto'].sum())

        retention_rate = (len(retained) / len(colegios_y1) * 100) if len(colegios_y1) > 0 else 0

        asesores_stats.append({
            "asesor": asesor,
            "retained_count": len(retained),
            "new_count": len(new),
            "lost_count": len(lost),
            "retention_rate": round(retention_rate, 2),
            "revenue_retained": revenue_retained,
            "revenue_new": revenue_new,
            "revenue_lost": revenue_lost,
            "total_y1": len(colegios_y1),
            "total_y2": len(colegios_y2)
        })

    # Sort by different metrics
    top_retention = sorted([a for a in asesores_stats if a['total_y1'] > 0],
                          key=lambda x: x['retention_rate'], reverse=True)[:10]
    top_new = sorted(asesores_stats, key=lambda x: x['new_count'], reverse=True)[:10]
    top_lost = sorted(asesores_stats, key=lambda x: x['lost_count'], reverse=True)[:10]

    return {
        "year1": year1,
        "year2": year2,
        "top_retention": top_retention,
        "top_new": top_new,
        "top_lost": top_lost,
        "all_asesores": asesores_stats
    }

# ============ FILE UPLOAD AND CONFIGURATION ENDPOINTS ============

@app.post("/api/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """Upload an Excel file"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files are allowed")

    # Save the uploaded file
    file_path = os.path.join(data_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Analyze the file to get available products
    try:
        temp_df = pd.read_excel(file_path)
        temp_df.columns = temp_df.columns.str.strip()

        products_in_file = []
        if 'Tipo Publicación' in temp_df.columns:
            products_in_file = sorted(temp_df['Tipo Publicación'].dropna().unique().tolist())

        return {
            "filename": file.filename,
            "size": os.path.getsize(file_path),
            "records": len(temp_df),
            "products": products_in_file
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

@app.get("/api/files")
async def list_files():
    """List all uploaded Excel files"""
    files = []
    for filename in os.listdir(data_dir):
        if filename.endswith(('.xlsx', '.xls')):
            file_path = os.path.join(data_dir, filename)
            files.append({
                "filename": filename,
                "size": os.path.getsize(file_path),
                "modified": os.path.getmtime(file_path)
            })
    return {"files": sorted(files, key=lambda x: x['modified'], reverse=True)}

@app.post("/api/set-active-file")
async def set_active_file(data: Dict):
    """Set the active Excel file to load"""
    filename = data.get("filename")
    if not filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    file_path = os.path.join(data_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Update config
    config = load_config()
    config["active_file"] = filename
    save_config(config)

    # Reload data
    load_data()

    return {"status": "success", "active_file": filename}

@app.get("/api/config")
async def get_config():
    """Get current configuration"""
    return load_config()

@app.post("/api/update-mappings")
async def update_mappings(data: Dict):
    """Update product mappings"""
    product_mappings = data.get("product_mappings")
    if not product_mappings:
        raise HTTPException(status_code=400, detail="product_mappings is required")

    config = load_config()
    config["product_mappings"] = product_mappings
    save_config(config)

    return {"status": "success", "product_mappings": product_mappings}

@app.get("/api/file-products")
async def get_file_products(filename: str):
    """Get all products from a specific file"""
    file_path = os.path.join(data_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        temp_df = pd.read_excel(file_path)
        temp_df.columns = temp_df.columns.str.strip()

        if 'Tipo Publicación' not in temp_df.columns:
            return {"products": []}

        products = temp_df['Tipo Publicación'].dropna().unique().tolist()
        product_counts = {}
        for p in products:
            product_counts[p] = len(temp_df[temp_df['Tipo Publicación'] == p])

        return {
            "products": sorted(products),
            "counts": product_counts
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
