# Configuración EmailJS - Último Paso

## ⚠️ IMPORTANTE: Falta el Service ID

Para completar la integración de EmailJS, necesitas agregar tu **Service ID**.

### Cómo obtener tu Service ID:

1. Ve a tu dashboard de EmailJS: https://dashboard.emailjs.com/
2. En el menú lateral, clic en "Email Services"
3. Verás tu servicio conectado (Gmail, Outlook, etc.)
4. Copia el **Service ID** (ejemplo: `service_abc123`)

### Dónde agregarlo:

Abre el archivo `src/components/Cart.jsx` y busca la línea 8:

```javascript
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // ← REEMPLAZA ESTO
```

Reemplázalo con tu Service ID real:

```javascript
const EMAILJS_SERVICE_ID = 'service_abc123'; // Tu Service ID real
```

---

## ✅ Credenciales ya configuradas:

- **Public Key:** `3OvPjrYqWYFAdpOYH`
- **Template Cliente:** `template_ahdxing` (order_confirmation_customer)
- **Template Admin:** `template_j4gxbpd` (order_notification_admin)

---

## 🧪 Probar el sistema:

1. Agrega el Service ID en `Cart.jsx`
2. Reinicia el servidor de desarrollo: `npm run dev`
3. Ve a la página de productos
4. Agrega productos al carrito
5. Completa el checkout con tu email real
6. Verifica que lleguen 2 emails:
   - Uno a tu email (confirmación de pedido)
   - Otro a `edupalmabozo@gmail.com` (notificación admin)

---

## 🔧 Si los emails no llegan:

1. Revisa la consola del navegador (F12) para ver errores
2. Verifica que el Service ID sea correcto
3. En EmailJS Dashboard → "Email Services", asegúrate que tu servicio esté "Connected"
4. Revisa la pestaña "History" en EmailJS para ver intentos de envío

---

## 📧 Configuración de templates en EmailJS:

Asegúrate que tus templates en EmailJS tengan estas variables:

### Template Cliente (template_ahdxing):
- `{{customerName}}`
- `{{customerEmail}}`
- `{{orderCode}}`
- `{{createdAt}}`
- `{{pickupDate}}`
- `{{itemsList}}`
- `{{totalAmount}}`

### Template Admin (template_j4gxbpd):
- `{{orderCode}}`
- `{{customerName}}`
- `{{customerEmail}}`
- `{{customerPhone}}`
- `{{customerNotes}}`
- `{{createdAt}}`
- `{{pickupDate}}`
- `{{itemsList}}`
- `{{totalAmount}}`

---

Una vez agregues el Service ID, ¡el sistema de emails estará completo! 🎉
