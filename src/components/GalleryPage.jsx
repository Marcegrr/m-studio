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
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="M studio" className="w-10 h-10 rounded-full object-cover" />
            <h1 className="text-xl font-bold">MALDAOSO BARBER</h1>
          </div>
          <Link to="/" className="px-3 py-1 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700">Volver al inicio</Link>
        </div>
      </div>

      {/* Galería de imágenes */}
      <div className="flex flex-col items-center bg-[#0A0A0A]">
        {/* Banner principal */}
        <div className="w-full flex justify-center p-[2px]">
          <img 
            src="/baner barberia.webp" 
            alt="Banner Maldaoso Barber" 
            className="object-cover cursor-pointer"
            style={{ width: '764px', height: '259.656px' }}
            onClick={() => setSelectedImage('/baner barberia.webp')}
          />
        </div>
        
        {/* Grid de imágenes - 2 columnas pegadas */}
        <div className="flex flex-wrap justify-center" style={{ width: '768px' }}>
          {loading ? (
            <div className="text-gray-400 py-8">Cargando imágenes...</div>
          ) : images && images.length > 0 ? (
            images.filter(p => !p.path.includes('baner barberia')).map((p, i) => (
              <div key={`pub-${p.path}-${i}`} className="p-[2px] overflow-hidden" style={{ width: '384px' }}>
                <img 
                  src={p.url} 
                  alt={p.path} 
                  className="object-cover cursor-pointer hover:scale-105 transition-transform duration-300 w-full"
                  style={{ height: '259.656px' }}
                  onClick={() => setSelectedImage(p.url)}
                />
              </div>
            ))
          ) : (
            <div className="text-gray-400 py-8">No hay imágenes disponibles. Sube algunas desde el panel de administrador.</div>
          )}
        </div>
      </div>
    </div>
  );
}
