# API de Verificación de Estado Premium para Anuncios

Este documento contiene ejemplos detallados de cómo usar la API simple y rápida para verificar si un usuario debe ver anuncios en HydroTracker.

## Configuración Inicial

### 1. Autenticación
El endpoint requiere autenticación JWT.

```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tu_usuario",
    "password": "tu_password"
  }'
```

### 2. Headers de Autenticación
Incluye el token en todas las solicitudes:

```bash
Authorization: Bearer <tu_access_token>
```

## API de Verificación de Anuncios

### Base URL: `/api/monetization/no-ads/`

### 1. Verificar Estado Premium

**GET /api/monetization/no-ads/**

**Descripción:** Endpoint simple y rápido que devuelve únicamente el estado premium del usuario para lógica de anuncios.

**Headers requeridos:**
- `Authorization: Bearer <access_token>`

**Características:**
- **Minimalista**: Solo devuelve un campo booleano
- **Rápido**: Optimizado para consultas frecuentes
- **Seguro**: Requiere autenticación
- **Eficiente**: Sin datos innecesarios

**Ejemplo de solicitud:**
```bash
curl -X GET http://127.0.0.1:8000/api/monetization/no-ads/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta exitosa (200):**
```json
{
  "is_premium": true
}
```

**Respuesta para usuario gratuito (200):**
```json
{
  "is_premium": false
}
```

**Respuesta de error (401) - Sin autenticación:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Respuesta de error (401) - Token inválido:**
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid or expired"
    }
  ]
}
```

## Características Técnicas

### 1. Diseño Minimalista
- **Un solo campo**: `is_premium` (booleano)
- **Sin datos adicionales**: No incluye información del usuario
- **Respuesta ligera**: JSON mínimo para máxima eficiencia

### 2. Optimización de Rendimiento
- **Consultas simples**: Solo accede al campo `es_premium` del usuario
- **Sin joins**: No requiere consultas adicionales a la base de datos
- **Caché amigable**: Respuesta simple para facilitar el caché

### 3. Seguridad
- **Autenticación requerida**: Solo usuarios autenticados pueden acceder
- **Sin datos sensibles**: No expone información personal
- **Validación de token**: Verifica la validez del token JWT

## Ejemplos de Integración

### JavaScript/Fetch
```javascript
// Verificar si mostrar anuncios
async function shouldShowAds() {
  try {
    const response = await fetch('/api/monetization/no-ads/', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return !data.is_premium; // Mostrar anuncios si NO es premium
    } else {
      console.error('Error verificando estado premium:', response.status);
      return true; // Mostrar anuncios por defecto en caso de error
    }
  } catch (error) {
    console.error('Error:', error);
    return true; // Mostrar anuncios por defecto en caso de error
  }
}

// Usar en la aplicación
shouldShowAds().then(showAds => {
  if (showAds) {
    displayAd();
  } else {
    hideAd();
  }
});
```

### React/useEffect
```jsx
import { useState, useEffect } from 'react';

function AdComponent() {
  const [showAd, setShowAd] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdStatus = async () => {
      try {
        const response = await fetch('/api/monetization/no-ads/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setShowAd(!data.is_premium);
        } else {
          setShowAd(true); // Mostrar anuncios por defecto
        }
      } catch (error) {
        console.error('Error:', error);
        setShowAd(true); // Mostrar anuncios por defecto
      } finally {
        setLoading(false);
      }
    };

    checkAdStatus();
  }, []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      {showAd ? (
        <div className="ad-banner">
          <h3>Anuncio</h3>
          <p>Contenido publicitario aquí</p>
        </div>
      ) : (
        <div className="premium-content">
          <h3>Contenido Premium</h3>
          <p>Sin anuncios para usuarios premium</p>
        </div>
      )}
    </div>
  );
}
```

### Python/Requests
```python
import requests

def should_show_ads(token):
    """
    Verifica si el usuario debe ver anuncios.
    
    Args:
        token (str): Token de autenticación JWT
        
    Returns:
        bool: True si debe mostrar anuncios, False si no
    """
    try:
        response = requests.get(
            'http://127.0.0.1:8000/api/monetization/no-ads/',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if response.status_code == 200:
            data = response.json()
            return not data['is_premium']  # Mostrar anuncios si NO es premium
        else:
            print(f"Error verificando estado premium: {response.status_code}")
            return True  # Mostrar anuncios por defecto en caso de error
            
    except Exception as e:
        print(f"Error: {e}")
        return True  # Mostrar anuncios por defecto en caso de error

# Usar en la aplicación
token = "tu_token_aqui"
if should_show_ads(token):
    display_ad()
else:
    hide_ad()
```

### Vue.js/Composition API
```vue
<template>
  <div>
    <div v-if="loading">Cargando...</div>
    <div v-else-if="showAd" class="ad-banner">
      <h3>Anuncio</h3>
      <p>Contenido publicitario aquí</p>
    </div>
    <div v-else class="premium-content">
      <h3>Contenido Premium</h3>
      <p>Sin anuncios para usuarios premium</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const showAd = ref(true);
const loading = ref(true);

const checkAdStatus = async () => {
  try {
    const response = await fetch('/api/monetization/no-ads/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      showAd.value = !data.is_premium;
    } else {
      showAd.value = true; // Mostrar anuncios por defecto
    }
  } catch (error) {
    console.error('Error:', error);
    showAd.value = true; // Mostrar anuncios por defecto
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  checkAdStatus();
});
</script>
```

### Angular/Service
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdService {
  private apiUrl = 'http://127.0.0.1:8000/api/monetization/no-ads/';

  constructor(private http: HttpClient) {}

  shouldShowAds(): Observable<boolean> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<{is_premium: boolean}>(this.apiUrl, { headers })
      .pipe(
        map(response => !response.is_premium), // Mostrar anuncios si NO es premium
        catchError(error => {
          console.error('Error verificando estado premium:', error);
          return of(true); // Mostrar anuncios por defecto en caso de error
        })
      );
  }
}

// Usar en el componente
export class AdComponent implements OnInit {
  showAd = true;

  constructor(private adService: AdService) {}

  ngOnInit() {
    this.adService.shouldShowAds().subscribe(showAd => {
      this.showAd = showAd;
    });
  }
}
```

## Estrategias de Caché

### 1. Caché del Cliente
```javascript
class AdCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  async shouldShowAds() {
    const now = Date.now();
    const cached = this.cache.get('ad_status');
    
    if (cached && (now - cached.timestamp) < this.cacheTimeout) {
      return cached.value;
    }

    try {
      const response = await fetch('/api/monetization/no-ads/', {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const shouldShow = !data.is_premium;
        
        this.cache.set('ad_status', {
          value: shouldShow,
          timestamp: now
        });
        
        return shouldShow;
      }
    } catch (error) {
      console.error('Error:', error);
    }
    
    return true; // Mostrar anuncios por defecto
  }
}

const adCache = new AdCache();
```

### 2. Caché del Servidor
```python
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

@method_decorator(cache_page(300), name='get')  # Caché por 5 minutos
class NoAdsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        is_premium = request.user.es_premium
        return Response({'is_premium': is_premium})
```

## Monitoreo y Métricas

### 1. Logging
```python
import logging

logger = logging.getLogger(__name__)

class NoAdsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        is_premium = request.user.es_premium
        
        # Log para métricas
        logger.info(f"Ad check - User: {request.user.id}, Premium: {is_premium}")
        
        return Response({'is_premium': is_premium})
```

### 2. Métricas de Rendimiento
```javascript
// Medir tiempo de respuesta
const startTime = performance.now();

fetch('/api/monetization/no-ads/', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})
.then(response => response.json())
.then(data => {
  const endTime = performance.now();
  const responseTime = endTime - startTime;
  
  console.log(`Tiempo de respuesta: ${responseTime}ms`);
  
  // Enviar métrica a servicio de monitoreo
  sendMetric('ad_check_response_time', responseTime);
});
```

## Casos de Uso

### 1. Banner de Anuncios
```javascript
// Mostrar/ocultar banner de anuncios
async function toggleAdBanner() {
  const shouldShow = await shouldShowAds();
  const adBanner = document.getElementById('ad-banner');
  
  if (shouldShow) {
    adBanner.style.display = 'block';
  } else {
    adBanner.style.display = 'none';
  }
}
```

### 2. Contenido Premium
```javascript
// Mostrar contenido premium sin anuncios
async function renderContent() {
  const shouldShow = await shouldShowAds();
  
  if (shouldShow) {
    renderFreeContent();
  } else {
    renderPremiumContent();
  }
}
```

### 3. Interrupciones Publicitarias
```javascript
// Mostrar interrupciones publicitarias
async function showAdInterruption() {
  const shouldShow = await shouldShowAds();
  
  if (shouldShow) {
    showInterstitialAd();
  } else {
    continueToNextContent();
  }
}
```

## Mejores Prácticas

### 1. Manejo de Errores
- **Fallback seguro**: Mostrar anuncios por defecto en caso de error
- **Timeout**: Configurar timeout para evitar bloqueos
- **Retry**: Implementar reintentos para errores temporales

### 2. Optimización
- **Caché**: Implementar caché del lado del cliente
- **Lazy loading**: Verificar estado solo cuando sea necesario
- **Debouncing**: Evitar consultas excesivas

### 3. Seguridad
- **Validación de token**: Verificar validez del token JWT
- **Rate limiting**: Implementar límites de velocidad
- **Logging**: Registrar accesos para auditoría

## Notas Importantes

1. **Simplicidad**: Este endpoint está diseñado para ser simple y rápido
2. **Rendimiento**: Optimizado para consultas frecuentes del frontend
3. **Seguridad**: Requiere autenticación pero no verifica premium
4. **Fallback**: El frontend debe manejar errores mostrando anuncios por defecto
5. **Caché**: Ideal para implementar caché del lado del cliente
6. **Monitoreo**: Importante monitorear el rendimiento y uso
7. **Escalabilidad**: Diseño preparado para alto volumen de consultas
8. **Mantenimiento**: Endpoint simple que requiere poco mantenimiento
