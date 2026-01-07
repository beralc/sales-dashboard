# 🚀 Cómo Ejecutar el Dashboard Ta-Tum

Hay varias formas de iniciar el dashboard:

## Opción 1: Script de Terminal (Recomendado)

1. **Abre Terminal**
2. **Navega a la carpeta del dashboard:**
   ```bash
   cd ~/Desktop/DASHBOARD
   ```
3. **Ejecuta el script:**
   ```bash
   ./start-dashboard.sh
   ```

El script automáticamente:
- ✅ Inicia el servidor backend (Python)
- ✅ Inicia el servidor frontend (React)
- ✅ Abre el navegador en http://localhost:5173
- ✅ Muestra los logs en tiempo real

**Para detener:** Presiona `Ctrl+C` en la terminal

## Opción 2: Script de Detención

Si necesitas detener el dashboard manualmente:

```bash
./stop-dashboard.sh
```

## Opción 3: Doble Click en Finder

### Método A: Clic derecho en el script
1. En Finder, navega a `Desktop/DASHBOARD`
2. Haz **clic derecho** en `start-dashboard.sh`
3. Selecciona **"Abrir con" → "Terminal"**

### Método B: Crear una Aplicación (Más fácil)

1. Abre **Script Editor** (Aplicación de macOS)
2. Pega este código:
   ```applescript
   tell application "Terminal"
       activate
       do script "cd ~/Desktop/DASHBOARD && ./start-dashboard.sh"
   end tell
   ```
3. Ve a **Archivo → Exportar**
4. Nombre: `🚀 Iniciar Dashboard`
5. Formato: **Aplicación**
6. Guarda en `Desktop/DASHBOARD`

Ahora puedes hacer **doble click** en la aplicación para iniciar el dashboard.

## Opción 4: Manual (Si algo falla)

### Iniciar Backend:
```bash
cd ~/Desktop/DASHBOARD/backend
python3 main.py
```

### Iniciar Frontend (en otra terminal):
```bash
cd ~/Desktop/DASHBOARD/frontend
npm run dev
```

### Abrir Navegador:
```
http://localhost:5173
```

## 🔧 Solución de Problemas

### Error: "Puerto 8000 ya en uso"
```bash
./stop-dashboard.sh
```
Luego intenta iniciar de nuevo.

### Error: "python3: command not found"
Instala Python 3:
```bash
brew install python3
```

### Error: "npm: command not found"
Instala Node.js:
```bash
brew install node
```

### Ver logs si algo falla:
```bash
cat backend.log
cat frontend.log
```

## 📊 Acceso al Dashboard

Una vez iniciado, abre tu navegador en:
- **URL Principal:** http://localhost:5173
- **API Backend:** http://localhost:8000

## 🛑 Detener el Dashboard

- **Opción 1:** Presiona `Ctrl+C` en la terminal donde se ejecuta
- **Opción 2:** Ejecuta `./stop-dashboard.sh`
- **Opción 3:** Cierra la ventana de Terminal

---

**Tip:** Agrega el script a tu Dock para acceso rápido:
1. Arrastra `🚀 Iniciar Dashboard.app` al Dock
2. Haz click para iniciar cuando quieras usar el dashboard
