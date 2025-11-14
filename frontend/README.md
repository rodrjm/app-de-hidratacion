# 💧 HydroTracker Frontend

![Frontend CI](https://github.com/OWNER/REPO/actions/workflows/frontend-ci.yml/badge.svg)

Frontend moderno para la aplicación de seguimiento de hidratación HydroTracker, construido con React, TypeScript, Vite y Tailwind CSS.

## 🚀 Características

- **⚡ Vite** - Build tool ultra rápido
- **⚛️ React 18** - Biblioteca de UI moderna
- **📘 TypeScript** - Tipado estático
- **🎨 Tailwind CSS** - Framework de CSS utilitario
- **📱 Mobile-First** - Diseño responsive optimizado
- **🔄 Zustand** - Gestión de estado ligera
- **🌐 PWA** - Aplicación web progresiva
- **♿ Accesible** - Cumple estándares de accesibilidad
- **🎯 Optimizado** - Performance y SEO optimizados

## 🛠️ Tecnologías

### Core
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **React Router** - Enrutamiento

### Styling
- **Tailwind CSS** - Framework de CSS
- **Lucide React** - Iconos
- **CSS Variables** - Temas personalizables

### State Management
- **Zustand** - Store ligero
- **React Query** - Cache de servidor
- **React Hook Form** - Formularios

### UI/UX
- **Mobile-First Design** - Responsive design
- **Dark Mode** - Soporte para tema oscuro
- **Animations** - Transiciones suaves
- **PWA** - Instalable como app

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Backend HydroTracker ejecutándose

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd hydrotracker-frontend
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno**
```bash
cp env.example .env.local
```

4. **Configurar .env.local**
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=HydroTracker
VITE_ENABLE_PWA=true
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
# o
yarn dev
```

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/            # Componentes base (Button, Card, etc.)
│   ├── hydration/     # Componentes de hidratación
│   └── auth/          # Componentes de autenticación
├── pages/             # Páginas de la aplicación
├── hooks/             # Custom hooks
├── services/          # Servicios de API
├── store/             # Estado global (Zustand)
├── types/             # Definiciones de TypeScript
├── utils/             # Utilidades
├── assets/            # Recursos estáticos
└── styles/            # Estilos globales
```

## 🎨 Sistema de Diseño

### Colores
- **Primary**: Verde (#4CAF50) - Hidratación y salud
- **Secondary**: Azul (#2196F3) - Información y confianza
- **Accent**: Naranja (#FF9800) - Energía y motivación
- **Success**: Verde (#4CAF50) - Éxito y completado
- **Warning**: Amarillo (#FF9800) - Advertencias
- **Error**: Rojo (#F44336) - Errores

### Tipografía
- **Display**: Poppins - Títulos y encabezados
- **Body**: Inter - Texto general
- **Monospace**: JetBrains Mono - Código

### Espaciado
- **Base**: 4px (0.25rem)
- **Escala**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

## 📱 Componentes Principales

### UI Components
- **Button** - Botones con variantes y estados
- **Card** - Contenedores de contenido
- **Input** - Campos de formulario
- **ProgressBar** - Barras de progreso
- **LoadingSpinner** - Indicadores de carga

### Hydration Components
- **WaterIntakeButton** - Botón de registro rápido
- **HydrationProgress** - Progreso de hidratación
- **QuickIntakeButtons** - Botones de ingesta rápida

### Pages
- **Dashboard** - Página principal
- **Login/Register** - Autenticación
- **Profile** - Perfil de usuario
- **Statistics** - Estadísticas detalladas
- **Settings** - Configuración

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linter
npm run type-check   # Verificación de tipos
npm run lint:fix     # Correcciones automáticas del linter
```

## 🌐 API Integration

### Endpoints Principales
- **Autenticación**: `/auth/login/`, `/auth/register/`
- **Consumos**: `/consumos/`, `/consumos/stats/`
- **Bebidas**: `/bebidas/`, `/premium/beverages/`
- **Recipientes**: `/recipientes/`
- **Estadísticas**: `/consumos/trends/`, `/consumos/insights/`

### Servicios
- **AuthService** - Autenticación y perfil
- **ConsumosService** - Gestión de consumos
- **BebidasService** - Catálogo de bebidas
- **RecipientesService** - Gestión de recipientes

## 📊 Estado Global

### AuthStore
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

### ConsumosStore
```typescript
interface ConsumosState {
  consumos: Consumo[];
  bebidas: Bebida[];
  recipientes: Recipiente[];
  estadisticas: EstadisticasDiarias | null;
  // ... más estado
}
```

## 🎯 Funcionalidades

### Para Usuarios Gratuitos
- ✅ Registro de consumos básicos
- ✅ Progreso diario de hidratación
- ✅ Estadísticas básicas
- ✅ Recordatorios limitados (3)
- ✅ Bebidas estándar

### Para Usuarios Premium
- ✅ Todas las funciones gratuitas
- ✅ Estadísticas avanzadas
- ✅ Recordatorios ilimitados
- ✅ Bebidas premium
- ✅ Insights personalizados
- ✅ Meta personalizada
- ✅ Sin anuncios

## 📱 PWA Features

- **Instalable** - Se puede instalar como app nativa
- **Offline** - Funciona sin conexión
- **Notificaciones** - Recordatorios push
- **Background Sync** - Sincronización en segundo plano
- **App Shell** - Carga instantánea

## 🚀 Deployment

### Build de Producción
```bash
npm run build
```

### Variables de Entorno de Producción
```env
VITE_API_URL=https://api.hydrotracker.app
VITE_APP_NAME=HydroTracker
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
```

### Servidores Recomendados
- **Vercel** - Deploy automático
- **Netlify** - CDN global
- **AWS S3 + CloudFront** - Escalabilidad
- **Firebase Hosting** - Google Cloud

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📈 Performance

### Optimizaciones Implementadas
- **Code Splitting** - Carga lazy de componentes
- **Tree Shaking** - Eliminación de código no usado
- **Image Optimization** - Compresión automática
- **Bundle Analysis** - Análisis de tamaño
- **Caching** - Estrategias de caché

### Métricas Objetivo
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTI**: < 3.5s

## 🔒 Seguridad

- **HTTPS** - Conexiones seguras
- **CSP** - Content Security Policy
- **XSS Protection** - Prevención de ataques
- **CSRF Protection** - Tokens de seguridad
- **Input Validation** - Validación de datos

## 🌍 Internacionalización

- **i18n Ready** - Preparado para múltiples idiomas
- **RTL Support** - Soporte para idiomas de derecha a izquierda
- **Date/Time** - Formateo localizado
- **Numbers** - Formateo de números

## 📚 Documentación

- **Storybook** - Componentes documentados
- **JSDoc** - Documentación de código
- **API Docs** - Documentación de API
- **Guías** - Guías de desarrollo

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

- **Issues** - [GitHub Issues](https://github.com/hydrotracker/frontend/issues)
- **Discussions** - [GitHub Discussions](https://github.com/hydrotracker/frontend/discussions)
- **Email** - support@hydrotracker.app

---

**¡Construido con ❤️ para mantenerte hidratado! 💧**
