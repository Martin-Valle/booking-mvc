# 🚀 Deploy en Netlify - Booking MVC

## ⚙️ Configuración de Build Settings

Usa esta configuración en el dashboard de Netlify:

```
Branch to deploy:      main
Base directory:        (dejar vacío)
Build command:         npm run build
Publish directory:     dist
```

## 📦 Deployment Automático

1. **Conecta tu repositorio Git con Netlify**
2. **Netlify detectará automáticamente** que es un proyecto Vite
3. **El archivo `netlify.toml`** ya tiene toda la configuración necesaria

## 🔧 Variables de Entorno (opcional)

Si necesitas configurar variables de entorno en producción:

1. Ve a **Site settings** → **Environment variables**
2. Agrega las variables necesarias:
   ```
   NODE_VERSION=20
   ```

## 🌐 Configuración Incluida

El proyecto ya incluye:
- ✅ `netlify.toml` - Configuración de build y redirects para SPA
- ✅ `.nvmrc` - Versión de Node.js (v20)
- ✅ Redirects para rutas del frontend (SPA)
- ✅ Headers de seguridad y cache
- ✅ Build optimizado con Vite

## 📝 Comandos Locales

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build de producción (para probar antes de deploy)
npm run build

# Preview del build
npm run preview
```

## ⚠️ Notas Importantes

1. **El directorio ESB no se incluye en el build** - Los servicios SOAP son para testing local
2. **Frontend usa mock data** - Los datos de prueba están en `src/services/adapters/mock.adapter.ts`
3. **Build warnings de SASS** - Son avisos de deprecación de Bootstrap, no afectan funcionalidad

## 🎯 Después del Deploy

Tu aplicación estará disponible en:
```
https://tu-proyecto.netlify.app
```

Puedes configurar un dominio personalizado en:
**Site settings** → **Domain management**

## 📊 Estado del Proyecto

- ✅ Frontend: Vite + TypeScript + Bootstrap
- ✅ ESB: 3 adaptadores SOAP implementados
- ✅ Build funcionando correctamente
- ⏳ Servicios SOAP: Esperando configuración de servidores externos
