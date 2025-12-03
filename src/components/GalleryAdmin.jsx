import React, { useState, useEffect } from 'react';
import { storage, db } from '../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export default function GalleryAdmin() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Subir imagen a Firebase Storage y guardar URL en Firestore
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        // Subir a Storage
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `gallery/${filename}`);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);

        // Guardar referencia en Firestore
        await addDoc(collection(db, 'gallery'), {
          imageUrl,
          filename,
          description: '',
          createdAt: new Date()
        });
      }
      alert(`${files.length} imagen(es) subida(s) con éxito`);
      await loadImages();
    } catch (err) {
      console.error('Error subiendo imágenes:', err);
      alert('Error subiendo imágenes: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // Limpiar input
    }
  };

  // Eliminar imagen
  const handleDelete = async (image) => {
    if (!confirm(`¿Eliminar ${image.filename}?`)) return;
    try {
      // Eliminar de Storage
      const storageRef = ref(storage, `gallery/${image.filename}`);
      await deleteObject(storageRef);
      
      // Eliminar de Firestore
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
      
      {/* Upload */}
      <div className="mb-4">
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          onChange={handleUpload}
          disabled={uploading}
          className="text-sm"
        />
        {uploading && <p className="text-xs text-yellow-500 mt-2">Subiendo imágenes...</p>}
        <p className="text-xs text-gray-500 mt-2">Las imágenes se suben a Firebase Storage y aparecerán en la galería pública</p>
      </div>

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
                alt={img.filename} 
                className="w-full h-32 object-cover"
              />
              <div className="p-2">
                <div className="text-xs text-gray-400 truncate">{img.filename}</div>
                <button 
                  onClick={() => handleDelete(img)}
                  className="mt-2 w-full px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
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
