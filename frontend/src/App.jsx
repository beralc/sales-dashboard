import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import Dashboard from './components/Dashboard'
import FileManager from './components/FileManager'
import { getProductConfig } from './productConfig'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [years, setYears] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('ta-tum')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

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
      setError('Error al cargar los datos. Asegúrate de que el servidor backend esté ejecutándose.')
      setLoading(false)
      console.error('Error fetching initial data:', err)
    }
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
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
        </div>
      </header>
      <Dashboard years={years} apiUrl={API_URL} selectedProduct={selectedProduct} />
    </div>
  )
}

export default App
