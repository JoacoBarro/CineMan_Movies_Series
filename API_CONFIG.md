# Configuración de la API de TMDB

## Cómo obtener tu API Key gratuita

1. **Regístrate en TMDB**:
   - Ve a https://www.themoviedb.org/
   - Crea una cuenta gratuita o inicia sesión

2. **Obtén tu API Key**:
   - Ve a https://www.themoviedb.org/settings/api
   - Haz clic en "Request an API Key"
   - Selecciona "Developer" como tipo de uso
   - Completa el formulario con:
     - Tipo de aplicación: "Web"
     - URL de la aplicación: (puedes usar tu URL local o dejar en blanco)
     - Descripción: "Aplicación web para mostrar películas populares"
   - Acepta los términos y condiciones
   - Copia tu API Key

3. **Configura tu API Key**:
   - Abre el archivo `app.js`
   - En la línea 2, reemplaza `'tu_api_key_aqui'` con tu API key:
   ```javascript
   const API_KEY = '0f7e246b6ca1a95091588be0482572c6';
   ```

## Características de la API

- ✅ **Gratuita**: No requiere pago
- ✅ **Sin límites estrictos**: 40 solicitudes cada 10 segundos por IP
- ✅ **Datos actualizados**: Películas populares actualizadas diariamente
- ✅ **Pósters de alta calidad**: Imágenes oficiales de las películas
- ✅ **Información completa**: Títulos, fechas, calificaciones, sinopsis, etc.

## Nota

Si no configuras una API key, la aplicación usará datos de ejemplo con placeholders para los pósters.

