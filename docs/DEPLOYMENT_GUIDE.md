# 🚀 Guía de Despliegue en Producción - HydroTracker

## 🎯 **Configuración Recomendada: Vercel + Railway**

### **Arquitectura de Despliegue**
```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │
│   (Vercel)      │◄──►│   (Railway)     │
│   React + TS    │    │   Django + API  │
│   Vite + Tailwind│   │   PostgreSQL    │
└─────────────────┘    │   Redis         │
                       └─────────────────┘
```

---

## 📋 **PREREQUISITOS**

### **Cuentas Necesarias**
- ✅ **GitHub**: Repositorio del proyecto
- ✅ **Vercel**: Cuenta gratuita (vercel.com)
- ✅ **Railway**: Cuenta gratuita (railway.app)

### **Configuración Local**
- ✅ **Node.js**: v18+ instalado
- ✅ **Python**: v3.8+ instalado
- ✅ **Git**: Configurado con repositorio

---

## 🔧 **FASE 1: PREPARACIÓN DEL PROYECTO**

### **1.1 Configurar Variables de Entorno**

#### **Backend (.env)**
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Django
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.railway.app,localhost

# CORS
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app

# Redis
REDIS_URL=redis://user:password@host:port

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
```

#### **Frontend (.env)**
```env
VITE_API_URL=https://your-backend.railway.app/api
VITE_APP_NAME=HydroTracker
VITE_APP_VERSION=1.0.0
```

### **1.2 Optimizar para Producción**

#### **Backend - settings.py**
```python
# Configuración de producción
DEBUG = False
ALLOWED_HOSTS = ['your-domain.railway.app', 'localhost']

# CORS
CORS_ALLOWED_ORIGINS = [
    "https://your-app.vercel.app",
]

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
    }
}

# Redis
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL'),
    }
}
```

#### **Frontend - vite.config.ts**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  }
})
```

---

## 🚂 **FASE 2: DEPLOY BACKEND (RAILWAY)**

### **2.1 Conectar Repositorio**
1. **Ir a Railway.app**
2. **Login con GitHub**
3. **"New Project" → "Deploy from GitHub repo"**
4. **Seleccionar repositorio HydroTracker**

### **2.2 Configurar Servicios**

#### **Servicio Django**
```yaml
# railway.toml (crear en raíz del proyecto)
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "python manage.py migrate && python manage.py runserver 0.0.0.0:$PORT"
healthcheckPath = "/api/health/"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
```

#### **Servicio PostgreSQL**
1. **"New Service" → "Database" → "PostgreSQL"**
2. **Configurar variables automáticamente**

#### **Servicio Redis**
1. **"New Service" → "Database" → "Redis"**
2. **Configurar variables automáticamente**

### **2.3 Variables de Entorno en Railway**
```env
# Django
SECRET_KEY=your-super-secret-key
DEBUG=False
ALLOWED_HOSTS=your-app.railway.app

# Database (auto-configurado por Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-configurado por Railway)
REDIS_URL=${{Redis.REDIS_URL}}

# CORS
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

### **2.4 Deploy Automático**
1. **Railway detecta automáticamente Django**
2. **Instala dependencias desde requirements.txt**
3. **Ejecuta migraciones automáticamente**
4. **Deploy en: https://your-app.railway.app**

---

## 🌐 **FASE 3: DEPLOY FRONTEND (VERCEL)**

### **3.1 Conectar Repositorio**
1. **Ir a Vercel.com**
2. **Login con GitHub**
3. **"New Project" → Import from GitHub**
4. **Seleccionar repositorio HydroTracker**
5. **Configurar Root Directory: `hydrotracker-frontend`**

### **3.2 Configurar Build Settings**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### **3.3 Variables de Entorno en Vercel**
```env
VITE_API_URL=https://your-backend.railway.app/api
VITE_APP_NAME=HydroTracker
VITE_APP_VERSION=1.0.0
```

### **3.4 Deploy Automático**
1. **Vercel detecta automáticamente Vite**
2. **Instala dependencias**
3. **Build optimizado para producción**
4. **Deploy en: https://your-app.vercel.app**

---

## 🔗 **FASE 4: CONFIGURACIÓN FINAL**

### **4.1 Configurar CORS en Django**
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://your-app.vercel.app",
    "https://your-custom-domain.com",
]

CORS_ALLOW_CREDENTIALS = True
```

### **4.2 Configurar Dominios Personalizados**

#### **Vercel (Frontend)**
1. **Settings → Domains**
2. **Add domain: your-domain.com**
3. **Configurar DNS según instrucciones**

#### **Railway (Backend)**
1. **Settings → Domains**
2. **Add domain: api.your-domain.com**
3. **Configurar DNS según instrucciones**

### **4.3 Configurar Monitoreo**

#### **Railway Logs**
- **Logs en tiempo real disponibles**
- **Métricas de CPU, memoria, requests**
- **Alertas configurables**

#### **Vercel Analytics**
- **Analytics automático incluido**
- **Core Web Vitals**
- **Performance insights**

---

## 🧪 **FASE 5: TESTING EN PRODUCCIÓN**

### **5.1 Verificar Deploy**

#### **Backend Health Check**
```bash
curl https://your-backend.railway.app/api/health/
```

#### **Frontend Deploy**
```bash
curl https://your-app.vercel.app/
```

### **5.2 Testing de Integración**
1. **Registrar usuario en frontend**
2. **Verificar login/logout**
3. **Crear consumo de agua**
4. **Verificar estadísticas**
5. **Testing de todas las funcionalidades**

### **5.3 Performance Testing**
```bash
# Test de carga básico
curl -w "@curl-format.txt" -o /dev/null -s https://your-backend.railway.app/api/consumos/
```

---

## 📊 **MONITOREO Y MANTENIMIENTO**

### **Métricas Importantes**
- ✅ **Uptime**: 99.9%+ esperado
- ✅ **Response Time**: <200ms para API
- ✅ **Build Time**: <2min para deploys
- ✅ **Error Rate**: <1%

### **Logs y Debugging**
- ✅ **Railway**: Logs en tiempo real
- ✅ **Vercel**: Function logs
- ✅ **Database**: Query performance
- ✅ **Redis**: Cache hit rate

### **Backups**
- ✅ **Database**: Backups automáticos en Railway
- ✅ **Code**: Git como backup del código
- ✅ **Environment**: Variables guardadas en plataformas

---

## 🚨 **TROUBLESHOOTING COMÚN**

### **Problemas de CORS**
```python
# Verificar en Django settings
CORS_ALLOWED_ORIGINS = [
    "https://your-app.vercel.app",
]
```

### **Problemas de Database**
```bash
# Verificar conexión
python manage.py dbshell
```

### **Problemas de Build**
```bash
# Verificar logs en Vercel
# Revisar variables de entorno
# Verificar dependencias
```

---

## 💰 **COSTOS ESTIMADOS**

### **Desarrollo/Testing**
- **Vercel**: Gratis (100GB bandwidth)
- **Railway**: $5/mes (Developer plan)
- **Total**: $5/mes

### **Producción (Escalado)**
- **Vercel Pro**: $20/mes (1TB bandwidth)
- **Railway Pro**: $20/mes (más recursos)
- **Total**: $40/mes

---

## 🎉 **RESULTADO FINAL**

### **URLs de Producción**
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.railway.app
- **Admin**: https://your-backend.railway.app/admin/

### **Características Implementadas**
- ✅ **Deploy Automático**: Desde GitHub
- ✅ **SSL**: Certificados automáticos
- ✅ **CDN**: Contenido estático optimizado
- ✅ **Database**: PostgreSQL gestionado
- ✅ **Cache**: Redis incluido
- ✅ **Monitoring**: Logs y métricas
- ✅ **Scaling**: Auto-scaling incluido

**¡El proyecto HydroTracker estará desplegado y funcionando en producción!**