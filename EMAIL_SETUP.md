# Sistema de Notificaciones por Email - M Studio

## Configuración Requerida

Para implementar las notificaciones por email necesitarás configurar un servicio de envío de correos. Opciones recomendadas:

## Prerrequisitos en Firebase/GCP

Antes de instalar la extensión "Trigger Email from Firestore", habilita en tu proyecto (plan Blaze):
- Secret Manager
- Cloud Functions
- Artifact Registry
- Compute Engine
- (Recomendado) Eventarc

Cómo habilitar rápidamente:
- En Firebase Console → Project Settings → Integrations, o en Google Cloud Console → APIs & Services → Enable APIs, busca y habilita cada servicio.
- Verifica que la facturación esté activa (plan Blaze) para el proyecto.

## Regiones y error común (INVALID_ARGUMENT)

Si al instalar ves el error:
`Database '(default)' does not exist in region 'us-central1'. Did you mean region 'nam5'?`

Significa que tu base de datos Firestore está creada en la región multi‑región `nam5` (nuevo default), y la extensión intentó validar en `us-central1`.

Solución:
- Reinstala la extensión con estos parámetros:
  - Cloud Functions location: `us-central1` (recomendado)
  - Firestore Instance ID: `(default)`
  - Firestore Instance Location: `nam5`
- Alternativa: Si tu Firestore está en otra región, selecciona exactamente esa región en el parámetro "Firestore Instance Location" al instalar la extensión.

Para confirmar tu región Firestore:
- En Google Cloud Console → Firestore → Databases, revisa el Location (`nam5`, `eur3`, etc.).
- O en terminal (gcloud):
```
gcloud firestore databases list --project <TU_PROJECT_ID>
```

Nota: La ubicación de Cloud Functions puede seguir siendo `us-central1`; lo importante es que el parámetro de "Firestore Instance Location" coincida con la región real de tu base de datos.

## Checklist de reinstalación (corrige INVALID_ARGUMENT)

### Paso 1: Verificar región de Firestore
```powershell
# En la consola Cloud: Firestore → Databases → (default) debe mostrar "nam5"
gcloud firestore databases list --project mstudio-e846d
```

### Paso 2: Habilitar servicios requeridos
- En Google Cloud Console → APIs & Services → Enable APIs:
  - Secret Manager
  - Cloud Functions
  - Artifact Registry
  - Compute Engine
  - Eventarc
- Verificar facturación activa (plan Blaze) en Firebase Console → Project Settings.

### Paso 3: Inicializar Firebase CLI (solo una vez)
```powershell
cd C:\MStudio\m-studio
firebase init
```

**Respuestas para firebase init:**
1. "Which Firebase features?" → Deselecciona todo o deja solo `Firestore` → `Enter`
2. "Please select an option" → `Use an existing project` → `Enter`
3. "Select a default Firebase project" → `mstudio-e846d` → `Enter`
4. Si pregunta por Firestore rules/indexes → Acepta defaults (Enter)
5. Si pregunta por Hosting → `dist` o Enter para default
6. "Configure as SPA?" → `N` (No) → `Enter`

Esto crea `.firebaserc` y `firebase.json` en tu proyecto.

### Paso 4: Desinstalar extensión errónea
```powershell
firebase ext:uninstall firestore-send-email --project mstudio-e846d
```

### Paso 5: Reinstalar extensión con región nam5
```powershell
firebase ext:install firebase/firestore-send-email --project mstudio-e846d
```

**Respuestas durante la instalación (IMPORTANTE):**
1. Cloud Functions location: `us-central1`
2. Firestore Instance ID: `(default)`
3. **Firestore Instance Location: `nam5`** ← CLAVE para resolver el error
4. Email documents collection: `mail`
5. Authentication Type: `Username & Password`
6. SMTP connection URI: `smtps://username@smtp.hostname.com:465`
7. SMTP password: `tu-contraseña-smtp`
8. Default FROM address: `noreply@mstudio.cl` (o tu email)
9. Otros campos opcionales: Enter para skip

### Paso 6: Verificar instalación
```powershell
# Ver estado de la extensión
firebase ext:list --project mstudio-e846d

# Ver logs de Cloud Functions
firebase functions:log --project mstudio-e846d

# Ver logs en tiempo real
gcloud logging tail "resource.type=cloud_function" --project=mstudio-e846d
```

**Estado esperado:** La extensión debe mostrar estado `ACTIVE` (no `ERRORED`).

### Opción 1: Firebase Extensions - Trigger Email
1. Instalar la extensión "Trigger Email from Firestore" en Firebase Console
2. Configurar SendGrid, Mailgun o SMTP
3. La extensión escuchará automáticamente la colección y enviará emails

### Opción 2: Cloud Functions + SendGrid
1. Crear una Cloud Function que se dispare cuando se crea un documento en `orders`
2. Usar SendGrid API para enviar los emails

### Opción 3: API Backend Custom
1. Crear un endpoint en tu servidor Express
2. Llamar al endpoint después de crear el pedido
3. Usar nodemailer o similar para enviar emails

## Estructura de Emails

### Email al Cliente (Confirmación de Pedido)

**Asunto:** ✅ Pedido Confirmado #{orderCode} - M Studio

**Contenido:**
```
Hola {customerName},

¡Gracias por tu compra en M Studio!

CÓDIGO DE RETIRO: {orderCode}
(Presenta este código al retirar tu pedido)

Detalles del Pedido:
- Pedido #: {orderId}
- Fecha de compra: {createdAt}
- Fecha de retiro disponible: {pickupDate} (3 días hábiles)

Productos:
{items.map(item => `- ${item.name} x${item.quantity} - $${item.price * item.quantity}`)}

TOTAL: ${totalAmount}

📍 Punto de Retiro:
Sandro Botticelli 7889, Las Condes
Región Metropolitana, Chile

⏰ Horario de Atención:
Lunes a Sábado: 10:00 - 19:00

⚠️ Importante:
- Recuerda traer tu código de retiro: {orderCode}
- Tu pedido estará disponible a partir del {pickupDate}
- Si no puedes retirar en esa fecha, contáctanos

¿Necesitas ayuda?
📧 Email: edupalmabozo@gmail.com
📱 WhatsApp: +56 9 3668 1862

Gracias por confiar en M Studio
```

### Email al Admin (Nuevo Pedido)

**Asunto:** 🔔 Nuevo Pedido #{orderCode} - {customerName}

**Contenido:**
```
Nuevo pedido recibido en M Studio

INFORMACIÓN DEL PEDIDO
━━━━━━━━━━━━━━━━━━━━━━
Código: {orderCode}
ID: {orderId}
Fecha: {createdAt}
Retiro programado: {pickupDate}
Estado: Pendiente

CLIENTE
━━━━━━━━━━━━━━━━━━━━━━
Nombre: {customer.name}
Email: {customer.email}
Teléfono: {customer.phone}
Dirección: {customer.address || 'No proporcionada'}

PRODUCTOS
━━━━━━━━━━━━━━━━━━━━━━
{items.map(item => 
  `${item.name}
   Cantidad: ${item.quantity}
   Precio unitario: $${item.price}
   Subtotal: $${item.price * item.quantity}
   ID Producto: ${item.productId}
`)}

TOTAL: ${totalAmount}

NOTAS DEL CLIENTE:
{customer.notes || 'Sin notas adicionales'}

ACCIONES NECESARIAS:
1. Preparar los productos
2. Verificar disponibilidad de stock
3. Tener listo el pedido para el {pickupDate}
4. Al entregar, verificar código: {orderCode}

Ver en panel: https://tu-dominio.com/admin
```

## Implementación con Cloud Functions (Ejemplo)

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configurar transporter (ejemplo con Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tu-email@gmail.com',
    pass: 'tu-app-password'
  }
});

exports.sendOrderEmails = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;

    // Email al cliente
    const customerEmail = {
      from: 'M Studio <noreply@mstudio.cl>',
      to: order.customer.email,
      subject: `✅ Pedido Confirmado #${order.orderCode} - M Studio`,
      html: generateCustomerEmailHTML(order, orderId)
    };

    // Email al admin
    const adminEmail = {
      from: 'M Studio Sistema <noreply@mstudio.cl>',
      to: 'edupalmabozo@gmail.com',
      subject: `🔔 Nuevo Pedido #${order.orderCode} - ${order.customer.name}`,
      html: generateAdminEmailHTML(order, orderId)
    };

    try {
      await transporter.sendMail(customerEmail);
      await transporter.sendMail(adminEmail);
      console.log('Emails sent successfully for order:', orderId);
    } catch (error) {
      console.error('Error sending emails:', error);
    }
  });

function generateCustomerEmailHTML(order, orderId) {
  // Template HTML del email al cliente
  return `...`;
}

function generateAdminEmailHTML(order, orderId) {
  // Template HTML del email al admin
  return `...`;
}
```

## Pasos para Activar

1. **Elegir método de envío** (recomiendo Firebase Extensions para simplicidad)
2. **Configurar credenciales** del servicio de email
3. **Crear templates** de email (puedes usar los de arriba)
4. **Probar** con pedidos de prueba
5. **Monitorear** los logs para verificar envíos

## Variables Disponibles

En el código actual, cuando se crea un pedido tienes acceso a:
- `orderCode`: Código único del pedido
- `orderId`: ID del documento en Firestore
- `customer`: { name, email, phone, address, notes }
- `items`: Array de productos con { productId, name, price, quantity, imageUrl }
- `totalAmount`: Total del pedido
- `pickupDate`: Fecha de retiro (Date object)
- `createdAt`: Timestamp de creación
- `status`: Estado actual del pedido

## Siguiente Paso

Para activar el envío de emails, necesitas:
1. Ir a Firebase Console → Extensions → Trigger Email
2. O implementar Cloud Functions con el código de ejemplo
3. O crear un endpoint en tu backend Express y llamarlo desde `Cart.jsx` después de crear el pedido
