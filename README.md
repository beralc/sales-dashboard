# 📊 Sales Dashboard

Multi-product sales analytics dashboard with Excel data import, interactive visualizations, and automatic deployment to VPS.

## 🎯 Features

- **Multi-Product Support**: Ta-Tum, GoSteam, GoProject, GlobalEduca
- **File Upload Interface**: Upload Excel files via web UI
- **Product Filtering**: Filter all analytics by product brand
- **Year Comparison**: Compare sales data between years (with backward-prevention)
- **Retention Analytics**: Track customer retention, churn, and new acquisitions
- **Performance Metrics**: Asesor and colegio performance tracking
- **Interactive Charts**: Multi-year monthly revenue comparison
- **Lost/New Colegios**: Track customer acquisition and churn with asesor info
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Auto-Deployment**: Push to GitHub → Automatically deploys to VPS

## Project Structure

```
DASHBOARD/
├── backend/                 # FastAPI backend
│   ├── main.py             # API server
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Dashboard components
│   │   ├── App.jsx        # Main app component
│   │   └── index.css      # Global styles
│   ├── package.json
│   └── vite.config.js
├── Crea_tu_propio_informe_20251222_085353.xlsx  # Data source
├── README.md
└── QUICKSTART.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the FastAPI server:
```bash
python main.py
```

The backend will run at `http://localhost:8000`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm run dev
```

The frontend will run at `http://localhost:5173`

## Running the Application

1. Start the backend server (Terminal 1):
```bash
cd backend
python main.py
```

2. Start the frontend server (Terminal 2):
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## API Endpoints

- `GET /` - Health check and basic info
- `GET /api/years` - Get available years in the dataset
- `GET /api/top-colegios?year={year}&limit={limit}` - Get top schools by revenue
- `GET /api/top-asesores?year={year}&limit={limit}` - Get top sales reps by revenue
- `GET /api/monthly-comparison?year1={year1}&year2={year2}` - Compare monthly sales
- `GET /api/summary?year={year}` - Get summary statistics

## Technologies Used

### Backend
- FastAPI - Modern Python web framework
- pandas - Data processing and analysis
- openpyxl - Excel file reading
- uvicorn - ASGI server

### Frontend
- React - UI framework
- Vite - Build tool
- Recharts - Charting library
- Axios - HTTP client

## Data Source

The dashboard reads data from `Crea_tu_propio_informe_20251222_085353.xlsx` which contains:
- Sales data from 2017-2025
- School (colegio) information with congregation details
- Sales representative (asesor) information
- Invoice dates and amounts

## 🚀 Deployment

**Production URL:** http://72.61.103.174:8080

### GitHub Auto-Deployment

See **[GITHUB-SETUP.md](GITHUB-SETUP.md)** for complete automatic deployment setup.

Quick workflow after setup:
```bash
git add .
git commit -m "Your changes"
git push  # Automatically deploys!
```

### Manual Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for manual VPS deployment instructions.

## 📖 Documentation

- **[GITHUB-SETUP.md](GITHUB-SETUP.md)** - GitHub Actions auto-deployment guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Manual VPS deployment
- **[QUICKSTART-DEPLOY.md](QUICKSTART-DEPLOY.md)** - 5-minute quick deploy

## 🎨 Adding a New Product

1. **Add logo** to `frontend/public/` (e.g., `globaleducalogo.png`)
2. **Update** `frontend/src/productConfig.js`:
   ```javascript
   'globaleduca': {
     name: 'GlobalEduca',
     logo: '/globaleducalogo.png',
     colors: {
       primary: '#0066CC',
       secondary: '#00AAFF'
     }
   }
   ```
3. **Upload Excel file** via dashboard file manager or SCP to VPS
4. **Configure mappings** in dashboard settings or `backend/data/config.json`
5. **Deploy**: `git push`

## 📊 Excel File Format

Required columns:
- `Tipo Publicación` - Product type/code
- `Año Factura` - Invoice year
- `Fecha Factura\nY-M` - Invoice date (YYYY/MM format)
- `Colegio` - School name
- `Asesor` - Sales representative
- `Coordinador` - Coordinator
- `Total neto` - Net revenue
- `Congregación Envío` - Congregation name

## 🔄 Development Workflow

### Local Development
```bash
# Terminal 1: Backend
cd backend && python main.py

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Production Deployment
```bash
git add .
git commit -m "Feature description"
git push  # GitHub Actions handles the rest!
```

## 🔒 Security

- ✅ Excel data files are gitignored (.gitignore)
- ✅ SSH keys for deployment (no password auth)
- ✅ Backend on internal port (8000), proxied by Nginx
- ✅ Secrets stored in GitHub encrypted secrets
- ✅ File upload size limits (100MB)
