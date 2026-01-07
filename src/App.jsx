import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import Dashboard from './components/Dashboard'

const API_URL = 'http://localhost:8000'

function App() {
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchYears()
  }, [])

  const fetchYears = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/years`)
      setYears(response.data.years)
      setLoading(false)
    } catch (err) {
      setError('Failed to fetch years. Make sure the backend is running.')
      setLoading(false)
      console.error('Error fetching years:', err)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <p>Please start the backend server:</p>
        <code>cd backend && pip install -r requirements.txt && python main.py</code>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sales Dashboard</h1>
        <p>Educational Sales Analytics</p>
      </header>
      <Dashboard years={years} apiUrl={API_URL} />
    </div>
  )
}

export default App
