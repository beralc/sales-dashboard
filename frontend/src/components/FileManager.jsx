import { useState, useEffect } from 'react'
import axios from 'axios'
import './FileManager.css'

function FileManager({ apiUrl, onFileChange }) {
  const [files, setFiles] = useState([])
  const [config, setConfig] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [showManager, setShowManager] = useState(false)

  useEffect(() => {
    fetchFiles()
    fetchConfig()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/files`)
      setFiles(response.data.files)
    } catch (err) {
      console.error('Error fetching files:', err)
    }
  }

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/config`)
      setConfig(response.data)
    } catch (err) {
      console.error('Error fetching config:', err)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Solo se permiten archivos Excel (.xlsx, .xls)')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    setUploadProgress({ filename: file.name, status: 'uploading' })

    try {
      const response = await axios.post(`${apiUrl}/api/upload-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setUploadProgress({
        filename: file.name,
        status: 'success',
        records: response.data.records,
        products: response.data.products
      })

      // Refresh file list
      await fetchFiles()

      // Optionally set as active file
      const shouldActivate = window.confirm(
        `Archivo "${file.name}" subido exitosamente con ${response.data.records} registros.\n\n¿Deseas activar este archivo ahora?`
      )

      if (shouldActivate) {
        await setActiveFile(file.name)
      }

      // Clear upload progress after 5 seconds
      setTimeout(() => setUploadProgress(null), 5000)
    } catch (err) {
      console.error('Error uploading file:', err)
      setUploadProgress({ filename: file.name, status: 'error', message: err.response?.data?.detail || 'Error desconocido' })
    } finally {
      setUploading(false)
      event.target.value = '' // Reset file input
    }
  }

  const setActiveFile = async (filename) => {
    try {
      await axios.post(`${apiUrl}/api/set-active-file`, { filename })
      await fetchConfig()
      alert(`Archivo "${filename}" activado exitosamente. Recargando datos...`)
      if (onFileChange) {
        onFileChange()
      }
      window.location.reload() // Reload to refresh all data
    } catch (err) {
      console.error('Error setting active file:', err)
      alert('Error al activar el archivo')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('es-ES')
  }

  return (
    <div className="file-manager">
      <button
        className="toggle-manager-btn"
        onClick={() => setShowManager(!showManager)}
        title="Gestionar archivos Excel"
      >
        📁 Archivos
      </button>

      {showManager && (
        <div className="manager-modal">
          <div className="manager-content">
            <div className="manager-header">
              <h2>Gestión de Archivos Excel</h2>
              <button className="close-btn" onClick={() => setShowManager(false)}>✕</button>
            </div>

            <div className="manager-body">
              {/* Upload Section */}
              <div className="upload-section">
                <h3>Subir Nuevo Archivo</h3>
                <div className="upload-area">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="file-upload" className={`upload-label ${uploading ? 'disabled' : ''}`}>
                    {uploading ? '📤 Subiendo...' : '📁 Seleccionar Archivo Excel'}
                  </label>
                </div>

                {uploadProgress && (
                  <div className={`upload-progress ${uploadProgress.status}`}>
                    {uploadProgress.status === 'uploading' && <p>⏳ Subiendo {uploadProgress.filename}...</p>}
                    {uploadProgress.status === 'success' && (
                      <div>
                        <p>✅ {uploadProgress.filename} subido exitosamente</p>
                        <p className="small">Registros: {uploadProgress.records?.toLocaleString()}</p>
                      </div>
                    )}
                    {uploadProgress.status === 'error' && (
                      <p>❌ Error: {uploadProgress.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Files List */}
              <div className="files-section">
                <h3>Archivos Disponibles</h3>
                {config && config.active_file && (
                  <p className="active-file-info">
                    📌 Archivo Activo: <strong>{config.active_file}</strong>
                  </p>
                )}

                {files.length === 0 ? (
                  <p className="no-files">No hay archivos subidos aún.</p>
                ) : (
                  <div className="files-list">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className={`file-item ${config?.active_file === file.filename ? 'active' : ''}`}
                      >
                        <div className="file-info">
                          <div className="file-name">
                            {config?.active_file === file.filename && <span className="active-badge">●</span>}
                            {file.filename}
                          </div>
                          <div className="file-meta">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{formatDate(file.modified)}</span>
                          </div>
                        </div>
                        {config?.active_file !== file.filename && (
                          <button
                            className="activate-btn"
                            onClick={() => setActiveFile(file.filename)}
                          >
                            Activar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Mappings Info */}
              {config && (
                <div className="mappings-section">
                  <h3>Mapeo de Productos</h3>
                  <div className="mappings-grid">
                    {Object.entries(config.product_mappings || {}).map(([brand, mapping]) => {
                      const codes = Array.isArray(mapping) ? mapping : mapping.product_codes || []
                      return (
                        <div key={brand} className="mapping-item">
                          <div className="brand-name">{brand}</div>
                          <div className="mapped-codes">
                            {codes.map((code, idx) => (
                              <span key={idx} className="code-badge">{code}</span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileManager
