import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePublicImages } from '../hooks/usePublicImages';

export default function GalleryPage(){
  const { images, loading } = usePublicImages();
  const [selectedImage, setSelectedImage] = useState(null);

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
        
        {/* Grid de imágenes - 1 columna móvil, 2 columnas desktop */}
        <div className="w-full max-w-[768px] grid grid-cols-1 sm:grid-cols-2 gap-[2px]">
          {loading ? (
            <div className="col-span-full text-gray-400 py-8 text-center">Cargando imágenes...</div>
          ) : images && images.length > 0 ? (
            images.filter(p => !p.path.includes('baner barberia')).map((p, i) => (
              <div key={`pub-${p.path}-${i}`} className="p-[2px] overflow-hidden">
                <img 
                  src={p.url} 
                  alt={p.path} 
                  className="w-full h-auto aspect-[384/259.656] object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => setSelectedImage(p.url)}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full text-gray-400 py-8 text-center px-4">No hay imágenes disponibles. Sube algunas desde el panel de administrador.</div>
          )}
        </div>
      </div>
    </div>
  );
}
