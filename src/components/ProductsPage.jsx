import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import SiteHeader from './SiteHeader';
import { useCart } from '../context/CartContext';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { addToCart } = useCart();

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(prods);
      setLoading(false);
    }, (err) => {
      console.error('Error loading products:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-inter">
      <SiteHeader />
      <div className="h-16" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Filtros por categoría */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Productos de Barbería</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Cargando productos...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>No hay productos disponibles en esta categoría.</p>
            <p className="text-sm mt-2">El administrador puede agregar productos desde el panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-[#0f0f0f] rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition">
                {/* Imagen del producto */}
                <div className="aspect-square bg-gray-800 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-600 text-4xl">📦</div>
                  )}
                </div>

                {/* Info del producto */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                    {product.category && (
                      <span className="text-xs bg-gray-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                        {product.category}
                      </span>
                    )}
                  </div>
                  
                  {product.description && (
                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">{product.description}</p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-bold text-red-500">${product.price?.toLocaleString('es-CL') || '0'}</p>
                      <p className="text-xs text-gray-500">
                        {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin stock'}
                      </p>
                    </div>
                    
                    {product.stock > 0 ? (
                      <button 
                        onClick={() => addToCart(product)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition"
                      >
                        Comprar
                      </button>
                    ) : (
                      <button disabled className="px-3 py-1.5 bg-gray-800 text-gray-500 rounded-md text-xs font-medium cursor-not-allowed">
                        Agotado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
