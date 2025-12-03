# NOTAS DEL PROYECTO M STUDIO

## 🎯 Información General
- **Nombre del proyecto:** M Studio - Barbería Premium
- **URL producción:** https://m-studio-web.netlify.app/
- **Repositorio GitHub:** https://github.com/Marcegrr/m-studio
- **Fecha de desarrollo:** Diciembre 2025

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.2.0** - Framework principal de UI
- **Vite 7.2.4** - Build tool y dev server (ultra rápido)
- **React Router DOM 7.9.6** - Navegación entre páginas (/, /servicios, /productos, /galeria, /admin)
- **Tailwind CSS 4.1.17** - Framework de estilos utility-first
- **@emailjs/browser 4.4.1** - Envío de emails desde frontend

### Backend / Servicios
- **Firebase 12.6.0:**
  - Firebase Authentication - Sistema de login
  - Cloud Firestore - Base de datos NoSQL en tiempo real
  - Firebase Storage - Almacenamiento de imágenes
- **EmailJS** - Servicio de notificaciones por email
  - Service ID: `service_6sj9iag`
  - Template Cliente: `template_ahdxing`
  - Template Admin: `template_j4gxbpd`
  - Public Key: `3OvPjrYqWYFAdpOYH`

### Servidor local (desarrollo)
- **Express 4.18.2** - Servidor HTTP para upload de imágenes
- **Multer 1.4.5-lts.1** - Middleware para subir archivos
- **CORS 2.8.5** - Control de acceso entre orígenes

### Hosting & Deploy
- **Netlify** - Hosting estático con CI/CD automático
  - Deploy automático desde GitHub (branch main)
  - Build command: `npm run build`
  - Publish directory: `dist`

---

## 📂 Estructura del Proyecto

```
m-studio/
├── src/
│   ├── components/
│   │   ├── AdminPanel.jsx       # Panel de administración (productos, servicios, pedidos)
│   │   ├── Cart.jsx             # Carrito de compras y checkout
│   │   ├── Gallery.jsx          # Galería de imágenes
│   │   ├── MStudioClient.jsx    # Vista de servicios
│   │   ├── ProductsPage.jsx     # Catálogo de productos
│   │   └── SiteHeader.jsx       # Header con navegación y carrito
│   ├── context/
│   │   ├── AuthContext.jsx      # Context de autenticación y roles
│   │   └── CartContext.jsx      # Context del carrito (estado global)
│   ├── firebase/
│   │   └── firebaseConfig.js    # Configuración de Firebase
│   ├── App.jsx                  # Componente principal con rutas
│   └── main.jsx                 # Entry point de React
├── public/                      # Archivos estáticos
├── server/
│   └── upload-server.cjs        # Servidor Express para subir imágenes (dev)
├── package.json                 # Dependencias del proyecto
├── vite.config.js              # Configuración de Vite
├── tailwind.config.js          # Configuración de Tailwind
└── netlify.toml                # Configuración de Netlify
```

---

## 🔐 Credenciales y Configuración

### Firebase Project
- **Project ID:** `mstudio-e846d`
- **Auth Domain:** `mstudio-e846d.firebaseapp.com`
- **Storage Bucket:** `mstudio-e846d.appspot.com`
- **Firestore Database:** `(default)` - Region: `nam5`

### Reglas de Firestore (Seguridad)
```javascript
// Productos: lectura pública, escritura solo admin, actualización permitida (stock)
// Órdenes: creación pública (checkout), lectura solo admin
// Usuarios: solo el propio usuario puede leer
// Servicios/Galería: lectura pública
```

### Usuario Admin
- Email: `edupalmabozo@gmail.com`
- Rol: `admin` (configurado en Firestore `users` collection)

---

## 📦 Colecciones de Firestore

### `users`
```javascript
{
  uid: string,
  email: string,
  role: 'admin' | 'client' | 'guest',
  createdAt: timestamp
}
```

### `services`
```javascript
{
  name: string,
  description: string,
  imageUrl: string,
  createdAt: timestamp
}
```

### `products`
```javascript
{
  name: string,
  description: string,
  price: number,
  stock: number,
  category: string,
  imageUrl: string,
  createdAt: timestamp
}
```

### `orders`
```javascript
{
  orderCode: string,           // Ej: MS-ABC123-XYZ45
  customer: {
    name: string,
    email: string,
    phone: string,
    address: string,
    notes: string
  },
  items: [{
    productId: string,
    name: string,
    price: number,
    quantity: number,
    imageUrl: string
  }],
  totalAmount: number,
  status: 'pending' | 'ready' | 'completed' | 'cancelled',
  pickupDate: Date,
  createdAt: timestamp,
  picked: boolean
}
```

### `gallery`
```javascript
{
  imageUrl: string,
  description: string,
  createdAt: timestamp
}
```

---

## 🚀 Comandos Importantes

### Desarrollo
```powershell
npm install                  # Instalar dependencias
npm run dev                  # Iniciar servidor de desarrollo (localhost:5173)
npm run upload-server        # Servidor de upload de imágenes (localhost:4000)
```

### Producción
```powershell
npm run build               # Compilar para producción (genera dist/)
npm run preview             # Preview del build localmente
```

### Git & Deploy
```powershell
git add .
git commit -m "mensaje"
git push                    # Push a GitHub → Netlify despliega automáticamente
```

---

## 🎨 Características Principales

### Sistema de Carrito
- ✅ Agregar/quitar productos
- ✅ Ver total en tiempo real
- ✅ Modal flotante con z-index optimizado
- ✅ Badge con contador de items
- ✅ Validación de stock

### Checkout Completo
- ✅ Formulario con validación
- ✅ Generación de código único de retiro (MS-XXXXX-XXXXX)
- ✅ Cálculo de fecha de retiro (+3 días hábiles)
- ✅ Creación de pedido en Firestore
- ✅ Actualización automática de stock
- ✅ Envío de 2 emails (cliente + admin)
- ✅ Pantalla de confirmación visual

### Sistema de Emails (EmailJS)
- ✅ Email al cliente: confirmación con código de retiro
- ✅ Email al admin: notificación de nuevo pedido
- ✅ Templates HTML personalizados
- ✅ Información completa del pedido
- ✅ No requiere backend propio

### Panel de Administración
- ✅ CRUD de servicios
- ✅ CRUD de productos
- ✅ Gestión de pedidos con cambio de estado
- ✅ Vista de todos los pedidos en tiempo real
- ✅ Protegido con autenticación

### Diseño UI/UX
- ✅ Tema rojo premium (#E50914)
- ✅ Header sticky siempre visible
- ✅ Botón flotante de Instagram
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Animaciones y transiciones suaves
- ✅ Grid de productos optimizado (3-4 columnas)

---

## 📝 Notas de Desarrollo

### Problemas Resueltos
1. **Modal del carrito oculto por header** → Movido fuera del header, z-index aumentado a 200
2. **Permisos de Firestore** → Reglas actualizadas para permitir crear pedidos públicamente
3. **EmailJS Service ID incorrecto** → Actualizado a `service_6sj9iag`
4. **Netlify no detectaba cambios** → Webhook configurado correctamente
5. **Modal muy grande** → Tamaño y padding reducidos para mejor UX

### Decisiones de Arquitectura
- **Context API** en lugar de Redux para estado global (más simple)
- **EmailJS** en lugar de Cloud Functions (evitar costos de Firebase)
- **Firestore** en lugar de SQL (mejor para tiempo real y escalabilidad)
- **Netlify** en lugar de Firebase Hosting (mejor para React con Vite)

---

## 📞 Contactos del Negocio
- **Dirección:** Sandro Botticelli 7889, Las Condes, Región Metropolitana, Chile
- **Email:** edupalmabozo@gmail.com
- **WhatsApp:** +56 9 3668 1862
- **Horario:** Lunes a Sábado, 10:00 - 19:00

---

## ✅ Checklist de Evaluación (Pauta académica)

1. ✅ Tecnologías según definiciones técnicas
2. ✅ Diseño original y personalizado
3. ✅ Cumple requerimientos funcionales y no funcionales
4. ✅ Fácil uso (baja carga cognitiva)
5. ✅ Autenticación y perfiles de usuario
6. ✅ Base de datos bien estructurada
7. ✅ Procesos de negocio implementados
8. ✅ Control de errores con mensajes informativos
9. ✅ Ejecución eficiente (tiempos de respuesta)
10. ✅ Validación de datos de usuarios

---

## 🔄 Flujo de Compra (Para demostración)

1. Usuario navega a "Productos"
2. Agrega productos al carrito (ícono carrito muestra badge)
3. Clic en carrito → Modal con resumen
4. Clic en "Proceder al Checkout"
5. Completa formulario (nombre, email, teléfono)
6. Clic en "Confirmar Pedido"
7. Sistema:
   - Crea pedido en Firestore
   - Genera código único (MS-XXXXX)
   - Actualiza stock de productos
   - Envía email al cliente
   - Envía email al admin
8. Pantalla de confirmación con código de retiro
9. Admin puede ver y gestionar el pedido en `/admin`

---

## 🎯 Próximos Pasos / Mejoras Futuras

- [ ] Integrar pasarela de pagos (Mercado Pago, Transbank)
- [ ] Sistema de reservas de horas para servicios
- [ ] Notificaciones push con Firebase Cloud Messaging
- [ ] Panel de estadísticas con gráficos
- [ ] Sistema de cupones y descuentos
- [ ] Integración con redes sociales (compartir productos)
- [ ] PWA (Progressive Web App) para instalación en móvil
- [ ] Modo dark/light theme

---

**Última actualización:** Diciembre 3, 2025
