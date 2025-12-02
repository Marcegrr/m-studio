import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_PUBLIC_KEY = '3OvPjrYqWYFAdpOYH';
const EMAILJS_SERVICE_ID = 'service_6sj9iag';
const EMAILJS_TEMPLATE_CUSTOMER = 'template_ahdxing';
const EMAILJS_TEMPLATE_ADMIN = 'template_j4gxbpd';

export default function Cart({ onClose }) {
  const { cart, addToCart, removeFromCart, deleteFromCart, getTotalPrice, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const generateOrderCode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `MS-${timestamp}-${random}`.toUpperCase();
  };

  const sendOrderEmails = async (orderData, orderId) => {
    try {
      // Initialize EmailJS
      emailjs.init(EMAILJS_PUBLIC_KEY);

      // Format items list for email
      const itemsList = orderData.items.map(item => 
        `${item.name} x${item.quantity} - $${(item.price * item.quantity).toLocaleString('es-CL')}`
      ).join('\n');

      // Format dates
      const createdAtFormatted = new Date().toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const pickupDateFormatted = orderData.pickupDate.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Email parameters for customer
      const customerParams = {
        customerName: orderData.customer.name,
        customerEmail: orderData.customer.email,
        orderCode: orderData.orderCode,
        createdAt: createdAtFormatted,
        pickupDate: pickupDateFormatted,
        itemsList: itemsList,
        totalAmount: orderData.totalAmount.toLocaleString('es-CL')
      };

      // Email parameters for admin
      const adminParams = {
        orderCode: orderData.orderCode,
        customerName: orderData.customer.name,
        customerEmail: orderData.customer.email,
        customerPhone: orderData.customer.phone,
        customerNotes: orderData.customer.notes || 'Sin notas',
        createdAt: createdAtFormatted,
        pickupDate: pickupDateFormatted,
        itemsList: itemsList,
        totalAmount: orderData.totalAmount.toLocaleString('es-CL')
      };

      // Send email to customer
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_CUSTOMER,
        customerParams
      );

      // Send email to admin
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ADMIN,
        adminParams
      );

      console.log('Emails sent successfully for order:', orderId);
    } catch (error) {
      console.error('Error sending emails:', error);
      // Don't throw error - order is already created, emails are secondary
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.phone) {
        setError('Por favor completa todos los campos obligatorios');
        setLoading(false);
        return;
      }

      // Generate unique order code
      const orderCode = generateOrderCode();
      
      // Calculate pickup date (3 days from now)
      const pickupDate = new Date();
      pickupDate.setDate(pickupDate.getDate() + 3);

      // Prepare order data
      const orderData = {
        orderCode,
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address || '',
          notes: formData.notes || ''
        },
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl || ''
        })),
        totalAmount: getTotalPrice(),
        status: 'pending', // pending, ready, completed, cancelled
        pickupDate: pickupDate,
        createdAt: serverTimestamp(),
        picked: false
      };

      // Create order in Firestore
      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Update stock for each product
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        await updateDoc(productRef, {
          stock: increment(-item.quantity)
        });
      }

      // Set confirmation data
      setOrderConfirmation({
        orderCode,
        orderId: orderRef.id,
        pickupDate: pickupDate.toLocaleDateString('es-CL', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        total: getTotalPrice(),
        email: formData.email
      });

      // Clear cart
      clearCart();

      // Send confirmation emails (async, non-blocking)
      sendOrderEmails(orderData, orderRef.id);

      // TODO: Send confirmation emails
      // - Customer: order confirmation with code and pickup date
      // - Admin: new order notification with details

    } catch (err) {
      console.error('Error creating order:', err);
      setError('Hubo un error al procesar tu pedido. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Order confirmation view
  if (orderConfirmation) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
        <div className="bg-[#121212] rounded-xl max-w-lg w-full p-6 border border-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">¡Pedido Confirmado!</h2>
            <p className="text-gray-400 mb-6">Tu pedido ha sido procesado exitosamente</p>

            <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6 border border-gray-800">
              <p className="text-sm text-gray-400 mb-2">Código de retiro</p>
              <p className="text-3xl font-bold text-[#E50914] mb-4 tracking-wider">{orderConfirmation.orderCode}</p>
              
              <p className="text-sm text-gray-400 mb-1">Fecha de retiro disponible</p>
              <p className="text-lg font-semibold mb-4">{orderConfirmation.pickupDate}</p>
              
              <p className="text-sm text-gray-400 mb-1">Total pagado</p>
              <p className="text-2xl font-bold">${orderConfirmation.total.toLocaleString('es-CL')}</p>
            </div>

            <div className="text-sm text-gray-400 mb-6 space-y-2">
              <p>✉️ Se ha enviado una confirmación a <span className="text-white">{orderConfirmation.email}</span></p>
              <p>📍 Retira tu pedido en: <span className="text-white">Sandro Botticelli 7889, Las Condes</span></p>
              <p>⏰ Horario: <span className="text-white">Lunes a Sábado, 10:00 - 19:00</span></p>
              <p className="text-yellow-500">⚠️ Presenta tu código de retiro al recoger</p>
            </div>

            <button
              onClick={() => {
                setOrderConfirmation(null);
                onClose();
              }}
              className="w-full px-6 py-3 bg-[#E50914] text-white rounded-lg font-semibold hover:bg-[#FF1A27] transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Checkout form view
  if (showCheckout) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#121212] rounded-xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 border border-gray-800 my-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Finalizar Pedido</h2>
            <button
              onClick={() => setShowCheckout(false)}
              className="text-gray-400 hover:text-white transition"
              aria-label="Volver al carrito"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitOrder} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre completo *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-[#1A1A1A] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#E50914]"
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-[#1A1A1A] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#E50914]"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Teléfono *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-[#1A1A1A] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#E50914]"
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dirección (opcional)</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#1A1A1A] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#E50914]"
                placeholder="Calle 123, Comuna"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notas adicionales (opcional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 bg-[#1A1A1A] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#E50914]"
                placeholder="Alguna indicación especial..."
              />
            </div>

            <div className="bg-[#1A1A1A] rounded-lg p-4 border border-gray-800">
              <h3 className="font-semibold mb-3">Resumen del pedido</h3>
              <div className="space-y-2 text-sm">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-gray-400">{item.name} x{item.quantity}</span>
                    <span>${(item.price * item.quantity).toLocaleString('es-CL')}</span>
                  </div>
                ))}
                <div className="border-t border-gray-800 pt-2 mt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-[#E50914]">${getTotalPrice().toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 text-sm text-blue-300">
              <p className="font-semibold mb-2">ℹ️ Información importante:</p>
              <ul className="space-y-1 text-xs">
                <li>• Tu pedido estará disponible para retiro en <strong>3 días hábiles</strong></li>
                <li>• Retiro en tienda: Sandro Botticelli 7889, Las Condes</li>
                <li>• Recibirás un código único para retirar tu pedido</li>
                <li>• El stock se descontará al confirmar el pedido</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="flex-1 px-6 py-3 border border-gray-700 rounded-lg font-semibold hover:bg-[#1A1A1A] transition"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#E50914] text-white rounded-lg font-semibold hover:bg-[#FF1A27] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Cart view
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#121212] rounded-xl max-w-xl w-full max-h-[85vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-2xl font-bold">Carrito de Compras</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            aria-label="Cerrar carrito"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg">Tu carrito está vacío</p>
              <p className="text-sm mt-2">Agrega productos desde la tienda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3 bg-[#1A1A1A] rounded-lg p-3 border border-gray-800">
                  <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-sm text-gray-400">${item.price.toLocaleString('es-CL')} c/u</p>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-2 bg-[#0A0A0A] rounded-lg">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="px-3 py-1 hover:text-[#E50914] transition"
                        >
                          −
                        </button>
                        <span className="px-2 font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          disabled={item.quantity >= item.stock}
                          className="px-3 py-1 hover:text-[#E50914] transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        onClick={() => deleteFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 transition text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg">${(item.price * item.quantity).toLocaleString('es-CL')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-800 p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xl font-semibold">Total</span>
              <span className="text-2xl font-bold text-[#E50914]">${getTotalPrice().toLocaleString('es-CL')}</span>
            </div>
            
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full px-6 py-3 bg-[#E50914] text-white rounded-lg font-semibold hover:bg-[#FF1A27] transition"
            >
              Proceder al Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
