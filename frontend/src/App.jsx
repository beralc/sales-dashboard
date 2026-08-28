import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import Dashboard from './components/Dashboard'
import FileManager from './components/FileManager'
import Login from './components/Login'
import { getProductConfig } from './productConfig'
import { useAuth } from './contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const { user, loading: authLoading, logout, isAuthenticated } = useAuth()
  const [years, setYears] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('ta-tum')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    // Apply product colors to CSS variables
    const productConfig = getProductConfig(selectedProduct)
    document.documentElement.style.setProperty('--primary-color', productConfig.colors.primary)
    document.documentElement.style.setProperty('--secondary-color', productConfig.colors.secondary)
  }, [selectedProduct])

  const fetchInitialData = async () => {
    try {
      const [yearsRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/api/years`),
        axios.get(`${API_URL}/api/products`)
      ])

      setYears(yearsRes.data.years)
      setProducts(productsRes.data.products)

      // Set first available product as default
      if (productsRes.data.products.length > 0) {
        setSelectedProduct(productsRes.data.products[0])
      }

      setLoading(false)
    } catch (err) {
      // The API rejects the token itself, so a 401 here means the session
      // expired or the account is not allowed - not that the server is down.
      if (err.response?.status === 401) {
        setError('Tu sesión ha caducado o tu cuenta no tiene acceso. Cierra sesión y vuelve a entrar.')
      } else {
        setError('Error al cargar los datos. Asegúrate de que el servidor backend esté ejecutándose.')
      }
      setLoading(false)
      console.error('Error fetching initial data:', err)
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return <div className="loading">Cargando...</div>
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />
  }

  if (loading) {
    return <div className="loading">Cargando datos...</div>
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <p>Por favor inicia el servidor backend:</p>
        <code>cd backend && pip install -r requirements.txt && python main.py</code>
      </div>
    )
  }

  const productConfig = getProductConfig(selectedProduct)

  return (
    <div className="app">
      <header className="app-header">
        {productConfig.logo ? (
          <img src={productConfig.logo} alt={`${productConfig.name} Logo`} className="app-logo" />
        ) : (
          <span className="app-logo-text">{productConfig.name}</span>
        )}
        <div className="header-controls">
          <FileManager apiUrl={API_URL} onFileChange={fetchInitialData} />
          {products.length > 1 && (
            <div className="product-selector">
              <label htmlFor="product-select">Producto:</label>
              <select
                id="product-select"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="product-select"
              >
                {products.map(product => {
                  const config = getProductConfig(product)
                  return (
                    <option key={product} value={product}>
                      {config.name}
                    </option>
                  )
                })}
              </select>
            </div>
          )}
          <div className="user-menu">
            <span className="user-email">{user?.email}</span>
            <button className="logout-btn" onClick={logout} title="Cerrar sesión">
              Salir
            </button>
          </div>
        </div>
      </header>
      <Dashboard years={years} apiUrl={API_URL} selectedProduct={selectedProduct} />
    </div>
  )
}

export default App
