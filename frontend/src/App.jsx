import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import Dashboard from './components/Dashboard'
import CongregacionesPage from './components/CongregacionesPage'
import FileManager from './components/FileManager'
import Login from './components/Login'
import { getProductConfig, getOnPrimaryColor } from './productConfig'
import { useAuth } from './contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const { user, loading: authLoading, logout, isAuthenticated } = useAuth()
  const [years, setYears] = useState([])
  const [products, setProducts] = useState([])
  // Several products can be shown at once; an empty list means all of them.
  const [selectedProducts, setSelectedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [path, setPath] = useState(window.location.pathname)

  // Two views, so a pathname check beats adding a router dependency.
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (to) => {
    window.history.pushState({}, '', to)
    setPath(to)
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    // Apply product colors to CSS variables
    // With more than one product on screen, no single brand colour is correct,
    // so fall back to the neutral theme rather than implying one of them.
    const themeKey = selectedProducts.length === 1 ? selectedProducts[0] : null
    const productConfig = getProductConfig(themeKey ?? 'dispositivos')
    document.documentElement.style.setProperty('--primary-color', productConfig.colors.primary)
    document.documentElement.style.setProperty('--secondary-color', productConfig.colors.secondary)
    document.documentElement.style.setProperty(
      '--on-primary-color', getOnPrimaryColor(themeKey ?? 'dispositivos'))
  }, [selectedProducts])

  const fetchInitialData = async () => {
    try {
      const [yearsRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/api/years`),
        axios.get(`${API_URL}/api/products`)
      ])

      setYears(yearsRes.data.years)
      setProducts(productsRes.data.products)

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

  const productConfig = selectedProducts.length === 1
    ? getProductConfig(selectedProducts[0])
    : null
  // The congregation view spans every product, so the product branding and
  // single-product selector would both misrepresent what is on screen.
  const isCongregaciones = path === '/congregaciones'

  return (
    <div className="app">
      <header className="app-header">
        {isCongregaciones ? (
          <span className="app-logo-text">Congregaciones</span>
        ) : productConfig?.logo ? (
          <img src={productConfig.logo} alt={`${productConfig.name} Logo`} className="app-logo" />
        ) : (
          <span className="app-logo-text">{productConfig?.name ?? 'Panel de Ventas'}</span>
        )}
        <div className="header-controls">
          <nav className="view-nav">
            <button
              className={path !== '/congregaciones' ? 'active' : ''}
              onClick={() => navigate('/')}
            >
              Ventas
            </button>
            <button
              className={path === '/congregaciones' ? 'active' : ''}
              onClick={() => navigate('/congregaciones')}
            >
              Congregaciones
            </button>
          </nav>
          <FileManager apiUrl={API_URL} onFileChange={fetchInitialData} />
          <div className="user-menu">
            <span className="user-email">{user?.email}</span>
            <button className="logout-btn" onClick={logout} title="Cerrar sesión">
              Salir
            </button>
          </div>
        </div>
      </header>
      {path === '/congregaciones' ? (
        <CongregacionesPage years={years} apiUrl={API_URL} />
      ) : (
        <Dashboard
          years={years}
          apiUrl={API_URL}
          products={products}
          selectedProducts={selectedProducts}
          onProductsChange={setSelectedProducts}
        />
      )}
    </div>
  )
}

export default App
