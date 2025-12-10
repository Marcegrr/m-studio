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
- **Tailwind CSS 3.4.14** - Framework de estilos utility-first
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
- **Servidor local** (presentaciones / respaldo)
  - Compilar con `npm run build`
  - Servir con `npx serve -s dist` (requiere paquete `serve` global o local)
  - Acceso desde `http://localhost:3000`
  - Modo demo: si Firestore rechaza la creación de pedidos (por reglas en producción), el checkout guarda el pedido en `localStorage` (`mstudio_demo_orders`) y muestra la confirmación para presentaciones offline.

### Presentación local (notebook personal)
- Clonar o copiar el proyecto a la notebook y asegurarse de contar con Node.js 20+.
- Ejecutar `npm install` una sola vez para reconstruir `node_modules`.
- Confirmar que el archivo `.env` esté presente con las credenciales de Firebase y EmailJS (usar las mismas del proyecto).
- Lanzar la demo con `npm run dev` y abrir `http://localhost:5173/` en el navegador.
- Si el checkout muestra "Modo demostración activo", mencionar que el pedido quedó guardado en `localStorage` para la presentación.
- Al terminar, cerrar la terminal con `Ctrl + C` para detener Vite.

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

## 🧱 Modelo de Datos (Firestore)

| Colección | Campos clave | Descripción | Índices |
|-----------|--------------|-------------|---------|
| `users` | `uid`, `email`, `role`, `createdAt` | Persistencia de credenciales y roles. El documento se crea post registro para asignar `admin` o `client`. | Índice simple por `uid` (documento). |
| `services` | `title`, `duration`, `price`, `createdAt` | Catálogo de servicios mostrados en `/servicios` y administrados por el panel. | Índice compuesto `createdAt desc` para ordenar. |
| `products` | `name`, `description`, `price`, `stock`, `category`, `imageUrl`, `createdAt` | Catálogo de productos del e-commerce. El stock se actualiza al confirmar pedidos. | Índice compuesto `createdAt desc` (listado) y filtro por `category`. |
| `orders` | `orderCode`, `customer`, `items`, `totalAmount`, `status`, `pickupDate`, `createdAt`, `completedAt`, `picked` | Pedidos generados desde el checkout. Se conserva todo el historial dentro de la misma colección usando el campo `status`. | Índice `createdAt desc` para panel admin; campo `status` se usa en filtros. |
| `gallery` | `imageUrl`, `filename`, `description`, `createdAt` | Imágenes almacenadas en Firebase Storage y listadas en `/galeria`. | Índice `createdAt desc` para mostrar recientes. |

> **Nota:** Se evaluó crear una colección `orders_history`, pero finalmente se decidió mantener los pedidos históricos en la misma colección `orders`, marcando los entregados con `status: completed` y `completedAt`.

Relaciones principales:
- Los `orders.items` referencian documentos de `products` (por `productId`).
- Los roles de `users` determinan permisos para CRUD de `services`, `products` y `gallery`.
- Las URLs de `gallery` provienen de Firebase Storage (`gs://mstudio-e846d.appspot.com/gallery/...`).

---

## 🛡️ Seguridad y Reglas

### Reglas actuales de Firestore
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && (
        request.auth.token.email == 'edupalmabozo@gmail.com' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }

    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }

    match /services/{serviceId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /orders/{orderId} {
      allow create: if true;
      allow read, update: if isAdmin();
      allow delete: if false; // Se preservan pedidos históricos en la misma colección
    }

    match /gallery/{imageId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

### Controles adicionales
- Rutas protegidas en React: el panel `/admin` se exige `role === 'admin'`.
- Estado global de autenticación con `AuthContext` que corta acceso a visitantes.
- Llaves sensibles (Firebase API, EmailJS) se cargan desde variables de entorno en Netlify.
- Formularios con validación de datos (checkout requiere nombre, email y teléfono). |
- Emails enviados mediante EmailJS solo con llave pública; los templates ignoran información sensible.

---

## ⚙️ Configuración del Entorno (Paso a Paso)

1. **Clonar el repositorio**
   ```powershell
   git clone https://github.com/Marcegrr/m-studio.git
   cd m-studio
   ```
2. **Instalar dependencias**
   ```powershell
   npm install
   ```
3. **Crear archivo `.env` para Vite**
   ```ini
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=mstudio-e846d.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=mstudio-e846d
   VITE_FIREBASE_STORAGE_BUCKET=mstudio-e846d.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=507420190304
   VITE_FIREBASE_APP_ID=1:507420190304:web:8ab8dde18296a265608505
   VITE_EMAILJS_PUBLIC_KEY=3OvPjrYqWYFAdpOYH
   VITE_EMAILJS_SERVICE_ID=service_6sj9iag
   VITE_EMAILJS_TEMPLATE_CUSTOMER=template_ahdxing
   VITE_EMAILJS_TEMPLATE_ADMIN=template_j4gxbpd
   ```
4. **Firebase**
   - Crear proyecto o usar `mstudio-e846d`.
   - Habilitar Authentication (Email/Password) y crear el usuario admin.
   - Generar la base de datos Firestore (modo producción, región `nam5`).
   - Configurar Firebase Storage (región multirregión, reglas por defecto + enforcement de auth).
5. **EmailJS**
   - Crear servicio con ID `service_6sj9iag`.
   - Replica los templates `template_ahdxing` (cliente) y `template_j4gxbpd` (admin).
6. **Netlify**
  - Conectar repositorio y setear variables de entorno anteriores.
  - Build command `npm run build`, publish `dist`.
  - Como respaldo local, instalar `serve` (`npm install -g serve`) y ejecutar `serve -s dist` tras cada build.
7. **Ejecutar entorno local**
   ```powershell
   npm run dev
   ```
   Acceso en `http://localhost:5173`.
8. **Servidor opcional de uploads locales** (solo desarrollo)
   ```powershell
   npm run upload-server
   ```

---

## 🧩 Arquitectura y Flujos Clave

- **Capas**
  - UI con React y Tailwind (componentes en `src/components`).
  - Estado global mediante `AuthContext` y `CartContext`.
  - Persistencia en Firestore + Storage.
  - Notificaciones con EmailJS.
- **Flujo de Checkout**
  1. Usuario agrega productos al carrito (`CartContext`).
  2. Checkout valida datos y genera código `MS-{timestamp}-{random}`.
  3. Se crea documento `orders`, se descuenta stock con transacción.
  4. EmailJS envía correos al cliente y admin.
  5. Pantalla de confirmación muestra código y fecha estimada.
- **Panel Admin**
  - Formularios retráctiles para crear servicios/productos.
  - Edición inline con validaciones básicas.
  - Sección de pedidos con cambio de estado (`pending` → `ready` → `completed`).
  - Gestión de galería (subida a Storage + registro en `gallery`).

---

## ✅ Plan de Pruebas Manuales

| Caso | Descripción | Resultado Esperado | Resultado Obtenido (09/12/2025) | Estado | Observaciones |
|------|-------------|--------------------|---------------------------------|--------|---------------|
| Navegación básica | Recorrer Home → Servicios → Productos → Galería → Contacto | Todas las páginas cargan sin errores, diseño consistente | Flujo completo sin errores visuales ni 404; layout responsive se mantiene | OK | Tester: Marcela Guerrero. Browser: Chrome 130. |
| Añadir al carrito | Agregar producto desde `/productos` | Contador y modal muestran item, total actualizado | Item se agrega, badge refleja cantidad y modal persiste tras reload | OK | Se validó actualización de totales y persistencia en `localStorage`. |
| Checkout válido | Completar formulario y confirmar | Pedido en Firestore, stock decrementa, emails enviados | Pedido `MS-20251209-001` creado; stock del producto descuenta 1; correos recibidos en admin y cliente | OK | Pedido permanece en `orders` con `status: pending` inicial y código MS visible en UI. |
| Checkout inválido | Omitir campos obligatorios | Se muestran mensajes de validación y no se crea pedido | Al dejar email vacío, formulario bloquea submit y muestra tooltip rojo | OK | No se creó documento en Firestore (confirmado en consola). |
| CRUD servicios | Crear, editar y eliminar servicio desde `/admin` | Firestore se actualiza y UI refleja cambios | Servicio "Perfilado Premium" creado y borrado con actualización inmediata del listado | OK | Cambios visibles en `services` sin errores en consola. |
| CRUD productos | Crear, editar y eliminar producto desde `/admin` | Firestore se actualiza y UI refleja cambios | Producto "Pomada Mate" editado (precio 12.990 → 13.490) y eliminado sin inconsistencias | OK | Se comprobó stock después de actualización. |
| Cambiar estado pedido | Marcar pedido como listo/entregado | Campo `status` cambia y se registra `completedAt` | Pedido `MS-20251209-001` pasó `pending` → `ready` → `completed`; `completedAt` poblado | OK | El pedido se mantiene en `orders` mostrando `status: completed` y fecha de entrega. |
| Galería | Subir imagen y verificar en `/galeria` | Imagen en Storage, documento en `gallery`, vista actualizada | Imagen `fade-skin-09.jpg` subida; URL válida y vista pública actualizada tras 5 s | OK | Se eliminó imagen de prueba tras validación. |
| Seguridad rutas | Intentar abrir `/admin` sin rol admin | Redirección o bloqueo | Sesión anónima es redirigida a `/login` mostrando aviso "Acceso solo para administradores" | OK | Probado en ventana incógnito. |
| EmailJS | Revisar bandeja admin y cliente tras pedido | Se reciben dos correos con datos correctos | Correos llegan en <20 s; contenido incluye lista de productos y código de retiro | OK | Observación: en entorno local sin `.env` real no se envía correo. |

### Bitácora de pruebas (formato para Excel)

Datos generales:
- Aplicación: M Studio - Barbería Premium
- Fecha de ejecución: 08-09/12/2025
- Desarrollado por / Tester principal: Marcela Guerrero

| Item | Descripción (Módulo o Reporte) | Tipo de Prueba | Objetivo de la Ejecución | Testeado por | Fecha | Aprobado | Caso NO Aprob Nº |
|------|---------------------------------|---------------|--------------------------|--------------|-------|----------|-------------------|
| 1 | Recorrido de navegación principal | 2 | Validar que cada ruta pública carga correctamente | Marcela Guerrero | 09/12/2025 | Sí | |
| 2 | Flujo de carrito y totales | 3 | Confirmar actualización de contador y total en modal | Marcela Guerrero | 09/12/2025 | Sí | |
| 3 | Checkout con datos válidos | 3 | Generar pedido, descontar stock y disparar emails | Marcela Guerrero | 09/12/2025 | Sí | |
| 4 | Validaciones del checkout | 2 | Bloquear envío sin datos obligatorios | Marcela Guerrero | 09/12/2025 | Sí | |
| 5 | CRUD de productos en admin | 3 | Asegurar creación/edición/eliminación en Firestore | Marcela Guerrero | 09/12/2025 | Sí | |
| 6 | Protección de ruta `/admin` | 5 | Impedir acceso a usuarios sin rol admin | Marcela Guerrero | 09/12/2025 | Sí | |
| 7 | Archivado de pedidos (prueba inicial) | 3 | Validar creación de historial separado al eliminar | Marcela Guerrero | 08/12/2025 | No | 001 |
| 8 | Persistencia en `orders` (retest) | 3 | Confirmar que el historial se conserva en la misma colección `orders` con `status: completed` | Marcela Guerrero | 09/12/2025 | Sí | |

### Reporte de error Nº 001 (para Excel)
- Aplicación: M Studio - Barbería Premium
- Fecha de reporte: 08/12/2025
- Desarrollado por: Marcela Guerrero
- Nº Reporte: 001
- Severidad: 2 (Problema Grave)
- Módulo: Panel Admin – Gestión de pedidos
- Nº ítem en matriz de pruebas: 7
- Fecha de asignación: 08/12/2025
- Fecha de devolución: 09/12/2025
- Descripción del problema: El flujo de eliminación intentaba crear un documento en una colección `orders_history` inexistente, generando error y evitando completar la acción.
- Áreas impactadas: Gestión de pedidos desde el panel admin y trazabilidad del historial.
- Documentos adjuntos: Captura del error de Firestore informando ruta no autorizada + evidencia de que el pedido seguía visible.
- Pasos de reproducción:
  1. Ejecutar `npm run dev` y autenticarse como admin (`edupalmabozo@gmail.com`).
  2. Entrar a `/admin`, seleccionar un pedido de prueba y presionar “Eliminar”.
  3. Revisar la consola de Firebase/DevTools para el mensaje `Missing or insufficient permissions` y comprobar que el pedido permanece listado.
- Evidencia adicional: Captura `evidencias/reporte-001-firestore.png` (consola mostrando `missing or insufficient permissions`) y video corto `evidencias/reporte-001.mp4` almacenados en la carpeta compartida del proyecto.
- Nº Repetición Test: 1 (se reprobó la primera vez y se actualizó la estrategia).
- Reportado por: Marcela Guerrero
- Resolución aplicada: Se descartó la creación de la colección adicional y se documentó la política de conservar todos los pedidos en `orders`, limitando el uso del botón "Eliminar" a datos de prueba y enfatizando el cambio de `status` a `completed` como cierre oficial.

---

## 📊 Resultados y Validación

- Al ejecutar el plan se documentará cada resultado (obtenido vs esperado).
- En caso de fallas, se registrará la causa y la corrección aplicada.
- Confirmar manualmente la existencia del pedido en Firestore y los correos enviados.

---

## 💡 Recomendaciones y Mejora Continua

- Integrar pasarela de pago (Mercado Pago / Transbank) para completar el flujo de e-commerce.
- Habilitar notificaciones push (Firebase Cloud Messaging) para avisar estados de pedidos.
- Implementar panel analítico (ventas por periodo, productos más vendidos) con gráficas.
- Extender seguridad con verificación de email obligatorio y logging de auditoría.
- Convertir la app en PWA para uso offline y acceso rápido en móviles.

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

**Última actualización:** Diciembre 9, 2025
