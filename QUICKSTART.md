# Quick Start Guide

Follow these steps to run your Sales Dashboard:

## Step 1: Start the Backend

Open a terminal in this directory and run:

```bash
cd backend
python3 main.py
```

You should see output like:
```
Data loaded: 36014 records
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Leave this terminal running.

## Step 2: Start the Frontend

Open a **NEW** terminal in this directory and run:

```bash
cd frontend
npm run dev
```

You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

## Step 3: Open the Dashboard

Open your web browser and go to:
```
http://localhost:5173
```

## Features You Can Use

### Filter Controls
- **Primary Year**: Select the main year to view
- **Comparison Year**: Select a second year to compare

### Summary Cards
- Total revenue for the selected year
- Number of unique colegios (schools)
- Number of unique asesores (sales reps)
- Total number of transactions

### Top Colegios
- View the top performing schools by revenue
- See which congregation each school belongs to
- Adjust the number of results (Top 5, 10, 20, or 50)

### Top Asesores
- View the top performing sales representatives
- See their total sales for the selected year
- Adjust the number of results

### Monthly Comparison Chart
- Compare sales month-by-month between two years
- Switch between line chart and bar chart views
- Hover over data points to see exact values and differences

## Troubleshooting

### Backend won't start
- Make sure you installed dependencies: `pip3 install -r backend/requirements.txt`
- Check that the Excel file exists in the main directory

### Frontend won't start
- Make sure you installed dependencies: `cd frontend && npm install`
- Check that you're in the frontend directory

### "Failed to fetch" error in browser
- Make sure the backend is running on port 8000
- Check that both servers are running simultaneously

## Stopping the Servers

- Press `Ctrl+C` in each terminal to stop the servers
