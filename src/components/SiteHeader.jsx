import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Cart from './Cart';

export default function SiteHeader() {
  const { role } = useAuth();
  const { getTotalItems } = useCart();
  const [showCart, setShowCart] = useState(false);

  const handleReserve = () => {
    const setmoreBtn = document.getElementById('Setmore_button_iframe');
    if (setmoreBtn) {
      setmoreBtn.click();
    } else {
      window.open('https://maldaosobarberstudio.setmore.com', '_blank');
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#242424] bg-[#121212]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/Logo.png" alt="M studio" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h1 className="text-lg md:text-xl font-semibold">M studio</h1>
              <p className="hidden sm:block text-xs text-[#C7C7C7]">Las Condes · 5.0 · 14 reseñas</p>
            </div>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link to="/#services" className="px-3 py-2 text-xs sm:text-sm text-[#F5F5F5] hover:text-[#FF1A27] transition-colors">Servicios</Link>
            <Link to="/products" className="px-3 py-2 text-xs sm:text-sm text-[#F5F5F5] hover:text-[#FF1A27] transition-colors">Productos</Link>
            <Link to="/#team" className="px-3 py-2 text-xs sm:text-sm text-[#F5F5F5] hover:text-[#FF1A27] transition-colors">Equipo</Link>
            <Link to="/#gallery" className="px-3 py-2 text-xs sm:text-sm text-[#F5F5F5] hover:text-[#FF1A27] transition-colors">Galería</Link>
            <Link to="/#reviews" className="px-3 py-2 text-xs sm:text-sm text-[#F5F5F5] hover:text-[#FF1A27] transition-colors">Reseñas</Link>
            <Link to="/#contact" className="px-3 py-2 text-xs sm:text-sm text-[#F5F5F5] hover:text-[#FF1A27] transition-colors">Contacto</Link>
            <button
              onClick={handleReserve}
              className="ml-2 inline-flex items-center justify-center rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border border-[#E50914] text-[#F5F5F5] hover:bg-[#E50914] transition-colors"
            >Reservar ahora</button>
            
            {/* Shopping cart */}
            <button
              onClick={() => setShowCart(!showCart)}
              className="ml-2 relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#242424] text-[#F5F5F5] hover:bg-[#1A1A1A] transition-colors"
              aria-label="Carrito de compras"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E50914] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {role === 'admin' ? (
              <a href="/admin" className="ml-2 px-3 py-2 rounded-full border border-[#242424] text-xs sm:text-sm text-[#F5F5F5] hover:bg-[#151515] transition-colors">Panel</a>
            ) : (
              <Link to="/admin" className="ml-2 px-3 py-2 rounded-full border border-[#242424] text-xs sm:text-sm text-[#F5F5F5] hover:bg-[#151515] transition-colors">Ingresar</Link>
            )}
          </nav>
        </div>
      </header>

      {/* Cart modal - rendered outside header to cover full screen */}
      {showCart && <Cart onClose={() => setShowCart(false)} />}
    </>
  );
}
