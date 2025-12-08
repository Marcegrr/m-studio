import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export default function GalleryPage(){
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const imgs = snap.docs.map(d => d.data());
        setImages(imgs);
      } catch (err) {
        console.error('Error loading gallery:', err);
      } finally {
        setLoading(false);
      }
    };
    loadImages();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-inter">
      {/* Modal de imagen completa */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="Imagen completa" 
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header con logo y título */}
      <div className="bg-[#0A0A0A] py-2 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/Logo.png" alt="M studio" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
            <h1 className="text-base sm:text-xl font-bold">MALDAOSO BARBER</h1>
          </div>
          <Link to="/" className="px-2 py-1 sm:px-3 sm:py-1 bg-red-600 text-white rounded text-xs sm:text-sm font-semibold hover:bg-red-700">Volver</Link>
        </div>
      </div>

      {/* Galería de imágenes */}
      <div className="flex flex-col items-center bg-[#0A0A0A] px-2 sm:px-0">
        {/* Banner principal */}
        <div className="w-full max-w-[768px] p-[2px]">
          <img 
            src="/baner barberia.webp" 
            alt="Banner Maldaoso Barber" 
            className="w-full h-auto object-cover cursor-pointer"
            onClick={() => setSelectedImage('/baner barberia.webp')}
          />
        </div>
        
        {/* Grid de imágenes - 2 columnas móvil, 3 columnas desktop */}
        <div className="w-full max-w-[768px] grid grid-cols-2 sm:grid-cols-3 gap-[2px]">
          {loading ? (
            <div className="col-span-full text-gray-400 py-8 text-center">Cargando imágenes...</div>
          ) : images.length > 0 ? (
            images.map((img, i) => (
              <div key={`img-${i}`} className="p-[2px] overflow-hidden">
                <img 
                  src={img.imageUrl} 
                  alt={img.filename || `Imagen ${i+1}`}
                  className="w-full h-auto aspect-[384/259.656] object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => setSelectedImage(img.imageUrl)}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400 py-12">
              <p>No hay imágenes en la galería.</p>
              <p className="text-sm mt-2">El administrador puede agregar imágenes desde el panel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
