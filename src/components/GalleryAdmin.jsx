import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export default function GalleryAdmin() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageDescription, setNewImageDescription] = useState('');

  // Cargar imágenes desde Firestore
  const loadImages = async () => {
    try {
      const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const imgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setImages(imgs);
    } catch (err) {
      console.error('Error cargando galería:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  // Agregar imagen por URL (como los productos)
  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!newImageUrl.trim()) {
      alert('Por favor ingresa una URL de imagen');
      return;
    }

    try {
      await addDoc(collection(db, 'gallery'), {
        imageUrl: newImageUrl.trim(),
        description: newImageDescription.trim() || '',
        createdAt: new Date()
      });
      alert('Imagen agregada con éxito');
      setNewImageUrl('');
      setNewImageDescription('');
      await loadImages();
    } catch (err) {
      console.error('Error agregando imagen:', err);
      alert('Error agregando imagen: ' + err.message);
    }
  };

  // Eliminar imagen
  const handleDelete = async (image) => {
    if (!confirm('¿Eliminar esta imagen de la galería?')) return;
    try {
      await deleteDoc(doc(db, 'gallery', image.id));
      await loadImages();
      alert('Imagen eliminada');
    } catch (err) {
      console.error('Error eliminando imagen:', err);
      alert('Error eliminando imagen: ' + err.message);
    }
  };

  return (
    <div className="bg-[#0f0f0f] p-4 rounded">
      <h2 className="font-semibold mb-4">Galería de Imágenes</h2>
      
      {/* Formulario para agregar imagen por URL */}
      <form onSubmit={handleAddImage} className="mb-4 space-y-3">
        <div>
          <label className="block text-sm mb-1">URL de la imagen:</label>
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Descripción (opcional):</label>
          <input
            type="text"
            value={newImageDescription}
            onChange={(e) => setNewImageDescription(e.target.value)}
            placeholder="Descripción de la imagen"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm"
          />
        </div>
        <button 
          type="submit"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold"
        >
          Agregar Imagen
        </button>
        <p className="text-xs text-gray-500">Las imágenes se agregan por URL (como los productos)</p>
      </form>

      {/* Lista de imágenes */}
      {loading ? (
        <div className="text-gray-400 text-sm">Cargando imágenes...</div>
      ) : images.length === 0 ? (
        <div className="text-gray-400 text-sm">No hay imágenes en la galería</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map(img => (
            <div key={img.id} className="bg-gray-900 rounded overflow-hidden">
              <img 
                src={img.imageUrl} 
                alt={img.description || 'Imagen de galería'} 
                className="w-full h-32 object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';
                }}
              />
              <div className="p-2">
                <div className="text-xs text-gray-400 truncate mb-1">
                  {img.description || 'Sin descripción'}
                </div>
                <a 
                  href={img.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 truncate block mb-2"
                >
                  Ver imagen
                </a>
                <button 
                  onClick={() => handleDelete(img)}
                  className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
