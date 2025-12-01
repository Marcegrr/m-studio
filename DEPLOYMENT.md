# Instrucciones de Deployment

## 1. Backend (Render.com)

### Opción A: Desde GitHub (recomendado)
1. Sube tu proyecto a GitHub si no lo has hecho
2. Ve a https://render.com y crea una cuenta
3. Click en "New +" → "Web Service"
4. Conecta tu repositorio de GitHub
5. Configura:
   - **Name**: mstudio-backend (o el que prefieras)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
6. Agrega variables de entorno:
   - Click "Environment" → "Add Environment Variable"
   - `FRONTEND_URL` = (lo agregarás después de desplegar frontend)
7. Click "Create Web Service"
8. Espera a que despliegue (5-10 min)
9. Copia la URL que te dan (ej: https://mstudio-backend.onrender.com)

### Opción B: Manual (si no quieres usar GitHub)
```powershell
# Instala Render CLI
npm install -g render-cli

# Despliega
render deploy
```

## 2. Frontend (Netlify)

### Paso 1: Build local
```powershell
npm run build
```

### Paso 2: Desplegar

#### Opción A: Netlify CLI (rápido)
```powershell
# Instala Netlify CLI si no la tienes
npm install -g netlify-cli

# Login
netlify login

# Despliega
netlify deploy --prod

# Cuando pregunte "Publish directory", escribe: dist
```

#### Opción B: Desde la web
1. Ve a https://netlify.com y crea cuenta
2. Click "Add new site" → "Deploy manually"
3. Arrastra la carpeta `dist` a la página
4. Espera a que despliegue
5. Copia la URL (ej: https://mstudio-xyz123.netlify.app)

### Paso 3: Conectar frontend y backend
1. En Render, ve a tu servicio backend
2. Environment → Edit `FRONTEND_URL`
3. Pega la URL de Netlify: `https://tu-sitio.netlify.app`
4. Guarda y espera a que redeploy

### Paso 4: Actualizar AdminPanel con URL del backend
En `src/components/AdminPanel.jsx`, línea ~99:
```javascript
const LOCAL_UPLOAD_URL = 'https://mstudio-backend.onrender.com/upload';
```

Luego reconstruye y redespliega:
```powershell
npm run build
netlify deploy --prod
```

## 3. Firebase (ya está configurado)

Tu Firebase ya está listo con:
- Authentication (usuarios)
- Firestore (servicios, notas de imágenes)

Solo asegúrate que las reglas de Firestore permitan lectura pública:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /services/{doc} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    match /public_images/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 4. Verificar

1. Abre tu sitio en Netlify (ej: https://tu-sitio.netlify.app)
2. Navega a `/admin` y loguéate
3. Prueba subir una imagen
4. Verifica que aparezca en `/gallery`

## Notas importantes

- **Backend gratis de Render**: se "duerme" después de 15 min sin uso. La primera request lo despierta (toma ~30 seg).
- **Imágenes en Render**: se guardan en disco temporal, se pierden al reiniciar. Para persistencia, considera migrar a Firebase Storage más adelante.
- **Custom domain**: En Netlify puedes agregar tu dominio propio gratis (Settings → Domain management).

## Troubleshooting

- **CORS error**: Verifica que `FRONTEND_URL` en Render coincida exactamente con tu URL de Netlify
- **Backend no responde**: Primera carga puede tardar ~30seg (backend gratis "despierta")
- **Imágenes no aparecen**: Ejecuta `npm run generate:public-images` localmente y redespliega el frontend
