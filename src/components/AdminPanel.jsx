import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import GalleryAdmin from './GalleryAdmin';
import { db } from '../firebase/firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
// Removed Firebase Storage usage for images per local-only directive

export default function AdminPanel() {
  const { user, role, logout } = useAuth();
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  // Removed cloud gallery state
  const [publicImages, setPublicImages] = useState([]);
  const [publicNotes, setPublicNotes] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dirHandle, setDirHandle] = useState(null); // File System Access API directory handle
  // local (browser) gallery state
  const [saveLocally, setSaveLocally] = useState(true);
  const [localGallery, setLocalGallery] = useState([]);
  const fileInputRef = useRef(null);
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [newService, setNewService] = useState({
    title: '',
    duration: '',
    price: ''
  });
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingServiceData, setEditingServiceData] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    imageUrl: ''
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProductData, setEditingProductData] = useState(null);
  const [showNewProductForm, setShowNewProductForm] = useState(false);

  // --- simple IndexedDB helpers (no dependency) ---
  const DB_NAME = 'mstudio-local';
  const STORE = 'localGallery';

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbAdd(obj) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.add(obj);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbGetAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbGet(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbDelete(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Try to upload a local item to a local server first (http://localhost:4000/upload).
  // If the local server is not available, fall back to Firebase upload.
  const LOCAL_UPLOAD_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/upload';
  const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || (import.meta.env.VITE_BACKEND_URL ? new URL(import.meta.env.VITE_BACKEND_URL).origin : '');
  const BACKEND_BASE = BACKEND_ORIGIN || 'http://localhost:4000';
  async function uploadLocalToServer(localItem) {
    try {
      const rec = await idbGet(localItem.id);
      if (!rec) throw new Error('Registro local no encontrado');

      // Try local server
      try {
        const form = new FormData();
        form.append('file', rec.blob, rec.name);
        const res = await fetch(LOCAL_UPLOAD_URL, { method: 'POST', body: form });
        if (res.ok) {
          const data = await res.json();
          await idbDelete(localItem.id);
          setLocalGallery(prev => prev.filter(p => p.id !== localItem.id));
          alert('Subido al servidor local: ' + data.url);
          return;
        }
      } catch (e) {
        console.warn('Local upload failed, falling back to Firebase', e);
      }

      // Fallback: upload to Firebase (existing flow)
      const recFresh = await idbGet(localItem.id);
      if (!recFresh) throw new Error('Registro local no encontrado (2)');
      const file = new File([recFresh.blob], recFresh.name, { type: recFresh.blob.type || 'image/*' });
      await handleUpload(file);
      await idbDelete(localItem.id);
      setLocalGallery(prev => prev.filter(p => p.id !== localItem.id));
    } catch (e) {
      console.error('Failed to upload local to server', e);
      alert('Error subiendo local al servidor: ' + e.message);
    }
  }

  // load local gallery from IDB on mount
  useEffect(() => {
    (async () => {
      try {
        const all = await idbGetAll();
        // add object URLs for previews
        const mapped = all.map(item => ({ ...item, url: URL.createObjectURL(item.blob) }));
        setLocalGallery(mapped);
      } catch (e) {
        console.error('Failed to load local gallery', e);
      }
    })();
  }, []);

  useEffect(() => {
    // subscribe to services and gallery without relying on createdAt ordering
    const q = query(collection(db, 'services'));
    const unsub = onSnapshot(q, (snap) => {
      console.debug('[AdminPanel] services snapshot size:', snap.size);
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('services snapshot error', err));

    // subscribe to products
    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      console.debug('[AdminPanel] products snapshot size:', snap.size);
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('products snapshot error', err));

    // subscribe to orders
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      console.debug('[AdminPanel] orders snapshot size:', snap.size);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('orders snapshot error', err));

    return () => { 
      unsub();
      unsubProducts();
      unsubOrders();
    };
  }, []);
  
  useEffect(() => {
    // fetch generated public-images.json
    const fetchPublic = async () => {
      try {
        const indexUrl = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/public-images.json` : '/public-images.json';
        const res = await fetch(indexUrl);
        if (!res.ok) return setPublicImages([]);
        const data = await res.json();
        // filter out internal assets and broken images
        const excluded = ['Logo.png', 'Mapa.png', 'vite.svg', 'baner barberia.webp', 'IMG1.webp', 'IMG2.webp', 'IMG3.webp', 'IMG4.webp'];
        const filtered = data.filter(x => !excluded.includes(x.name)).map(x => ({
          ...x,
          url: BACKEND_ORIGIN ? `${BACKEND_ORIGIN}${x.url}` : x.url
        }));
        setPublicImages(filtered);
      } catch (e) {
        console.error('Failed to fetch public-images.json', e);
      }
    };
    fetchPublic();

    // load any saved notes from Firestore
    const loadNotes = async () => {
      try {
        const snap = await getDocs(collection(db, 'public_images'));
        const notes = {};
        snap.forEach(d => {
          notes[d.id] = d.data();
        });
        setPublicNotes(notes);
      } catch (e) {
        console.error('Failed to load public image notes', e);
      }
    };
    loadNotes();
  }, []);

  const addService = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newService.title.trim()) {
      alert('El servicio debe tener un nombre');
      return;
    }
    try {
      const payload = {
        title: newService.title.trim(),
        duration: newService.duration.trim(),
        price: newService.price.trim(),
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'services'), payload);
      setNewService({ title: '', duration: '', price: '' });
      setShowNewServiceForm(false);
      alert('Servicio agregado correctamente');
    } catch (err) {
      alert('Error añadiendo servicio: ' + err.message);
    }
  };

  const startEditService = (service) => {
    setEditingServiceId(service.id);
    setEditingServiceData({
      title: service.title || '',
      duration: service.duration || '',
      price: service.price || ''
    });
  };

  const saveEditService = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingServiceId || !editingServiceData) return;
    if (!editingServiceData.title.trim()) {
      alert('El servicio debe tener un nombre');
      return;
    }
    try {
      await updateDoc(doc(db, 'services', editingServiceId), {
        title: editingServiceData.title.trim(),
        duration: editingServiceData.duration.trim(),
        price: editingServiceData.price.trim()
      });
      setEditingServiceId(null);
      setEditingServiceData(null);
      alert('Servicio actualizado');
    } catch (err) {
      alert('Error editando servicio: ' + err.message);
    }
  };

  const removeService = async (s) => {
    if (!confirm('¿Eliminar servicio?')) return;
    try {
      await deleteDoc(doc(db, 'services', s.id));
      if (editingServiceId === s.id) {
        setEditingServiceId(null);
        setEditingServiceData(null);
      }
      console.debug('[AdminPanel] deleted service id=', s.id);
    } catch (err) {
      alert('Error eliminando servicio: ' + err.message);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml'];
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Usa JPEG, PNG, WEBP, GIF, AVIF o SVG.');
      return;
    }
    if (file.size > maxSize) {
      alert('Archivo demasiado grande. Máximo permitido: 5 MB.');
      return;
    }

    try {
      // If user chose a folder via File System Access API, write file directly to that folder
      if (dirHandle && dirHandle.kind === 'directory') {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const name = `${Date.now()}_${safeName}`;
        const fileHandle = await dirHandle.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
        alert('Imagen guardada en carpeta seleccionada. Ejecuta "npm run generate:public-images" y recarga.');
        return;
      }

      // Fallback: Save in IndexedDB for local management
      const blob = file.slice(0, file.size, file.type);
      await idbAdd({ name: file.name, blob });
      const all = await idbGetAll();
      const mapped = all.map(item => ({ ...item, url: URL.createObjectURL(item.blob) }));
      setLocalGallery(mapped);
      alert('Imagen guardada localmente en el navegador. Puedes exportar o subir más tarde.');
    } catch (err) {
      alert('Error guardando imagen: ' + err.message);
      console.error(err);
    }
  };

  // Removed cloud gallery delete. Local images are managed via IndexedDB and server.

  const onFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const allowedTypes = ['image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml'];
      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name}: Tipo de archivo no permitido. Usa JPEG, PNG, WEBP, GIF, AVIF o SVG.`);
        continue;
      }
      if (file.size > maxSize) {
        alert(`${file.name}: Archivo demasiado grande. Máximo permitido: 5 MB.`);
        continue;
      }

      try {
        const form = new FormData();
        form.append('file', file, file.name);
        const res = await fetch(LOCAL_UPLOAD_URL, { method: 'POST', body: form });
        if (!res.ok) throw new Error('Error subiendo al servidor');
        console.log(`${file.name} subido correctamente`);
      } catch (err) {
        console.error(`Error subiendo ${file.name}:`, err);
        alert(`Error subiendo ${file.name}: ${err.message}`);
      }
    }
    
    alert(`${files.length} imagen(es) subida(s). Recarga la página para verlas en la galería.`);
    e.target.value = null;
  };

  // --- Productos CRUD ---
  const addProduct = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const price = parseFloat(newProduct.price);
    const stock = parseInt(newProduct.stock, 10);
    if (isNaN(price) || isNaN(stock)) {
      return alert('Precio o stock inválido');
    }
    try {
      await addDoc(collection(db, 'products'), {
        name: newProduct.name,
        description: newProduct.description,
        price,
        stock,
        category: newProduct.category || 'general',
        imageUrl: newProduct.imageUrl || '',
        createdAt: serverTimestamp()
      });
      setNewProduct({ name: '', description: '', price: '', stock: '', category: '', imageUrl: '' });
      alert('Producto agregado correctamente');
    } catch (err) {
      alert('Error agregando producto: ' + err.message);
    }
  };

  const startEditProduct = (p) => {
    setEditingProductId(p.id);
    setEditingProductData({
      name: p.name || '',
      description: p.description || '',
      price: p.price?.toString() || '',
      stock: p.stock?.toString() || '',
      category: p.category || '',
      imageUrl: p.imageUrl || ''
    });
  };

  const saveEditProduct = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingProductId || !editingProductData) return;
    const price = parseFloat(editingProductData.price);
    const stock = parseInt(editingProductData.stock, 10);
    if (isNaN(price) || isNaN(stock)) {
      return alert('Precio o stock inválido');
    }
    try {
      await updateDoc(doc(db, 'products', editingProductId), {
        name: editingProductData.name,
        description: editingProductData.description,
        price,
        stock,
        category: editingProductData.category || 'general',
        imageUrl: editingProductData.imageUrl || ''
      });
      setEditingProductId(null);
      setEditingProductData(null);
      alert('Producto actualizado');
    } catch (err) {
      alert('Error editando producto: ' + err.message);
    }
  };

  const archiveOrder = async (order) => {
    const { id, ...data } = order;
    await addDoc(collection(db, 'orders_history'), {
      ...data,
      originalOrderId: id,
      archivedAt: serverTimestamp()
    });
  };

  const removeProduct = async (p) => {
    if (!confirm(`¿Eliminar ${p.name}?`)) return;
    try {
      await deleteDoc(doc(db, 'products', p.id));
      alert('Producto eliminado');
    } catch (err) {
      alert('Error eliminando producto: ' + err.message);
    }
  };

  const seedProducts = async () => {
    if (!confirm('¿Crear 12 productos de ejemplo con imágenes?')) return;
    const examples = [
      { name: 'Pomada Mate Strong', description: 'Fijación fuerte con acabado mate profesional', price: 12000, stock: 15, category: 'pomadas', imageUrl: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400' },
      { name: 'Cera Brillante Premium', description: 'Cera para peinado con brillo natural y fijación media', price: 10000, stock: 20, category: 'ceras', imageUrl: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=400' },
      { name: 'Shampoo Barba Deluxe', description: 'Shampoo especial para barba y bigote con aceites naturales', price: 8000, stock: 25, category: 'shampoo', imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400' },
      { name: 'Aceite Barba Hidratante', description: 'Aceite hidratante premium para barba suave y brillante', price: 15000, stock: 10, category: 'aceites', imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400' },
      { name: 'Peine Madera Natural', description: 'Peine artesanal de madera natural para barba', price: 5000, stock: 30, category: 'accesorios', imageUrl: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400' },
      { name: 'Pomada Clay Textura', description: 'Pomada tipo arcilla para textura y volumen natural', price: 13000, stock: 12, category: 'pomadas', imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400' },
      { name: 'Cera Modeladora Extra', description: 'Cera de modelado fuerte para estilos extremos', price: 11000, stock: 18, category: 'ceras', imageUrl: 'https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=400' },
      { name: 'Bálsamo Barba Premium', description: 'Bálsamo suavizante con manteca de karité', price: 9000, stock: 22, category: 'aceites', imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400' },
      { name: 'Kit Tijeras Profesional', description: 'Set de tijeras profesionales para barba y cabello', price: 25000, stock: 8, category: 'accesorios', imageUrl: 'https://images.unsplash.com/photo-1598128558393-70ff21433be0?w=400' },
      { name: 'Cepillo Barba Cerdas', description: 'Cepillo de cerdas naturales para barba', price: 6000, stock: 35, category: 'accesorios', imageUrl: 'https://images.unsplash.com/photo-1511511450040-677116ff389e?w=400' },
      { name: 'Gel Fijador Extra Strong', description: 'Gel de fijación extra fuerte resistente al agua', price: 7000, stock: 28, category: 'pomadas', imageUrl: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=400' },
      { name: 'Acondicionador Barba', description: 'Acondicionador suavizante para barba larga', price: 8500, stock: 20, category: 'shampoo', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400' }
    ];
    try {
      for (const prod of examples) {
        await addDoc(collection(db, 'products'), { ...prod, createdAt: serverTimestamp() });
      }
      alert('12 productos de ejemplo creados con imágenes');
    } catch (err) {
      alert('Error creando productos: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Panel Administrador</h1>
            <Link to="/" className="px-3 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700">Ver sitio</Link>
          </div>
          <div className="text-sm text-gray-400">{user?.email} · Rol: {role}</div>
        </div>

        <div className="bg-[#0f0f0f] p-4 rounded mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-semibold mb-0">Servicios</h2>
            <button
              type="button"
              onClick={() => setShowNewServiceForm(prev => !prev)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
            >
              {showNewServiceForm ? 'Cerrar formulario' : 'Añadir servicio'}
            </button>
          </div>

          {showNewServiceForm && (
            <form onSubmit={addService} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <input
                className="bg-gray-900 rounded px-2 py-1"
                placeholder="Nombre del servicio"
                value={newService.title}
                onChange={e => setNewService({ ...newService, title: e.target.value })}
                required
              />
              <input
                className="bg-gray-900 rounded px-2 py-1"
                placeholder="Duración"
                value={newService.duration}
                onChange={e => setNewService({ ...newService, duration: e.target.value })}
              />
              <input
                className="bg-gray-900 rounded px-2 py-1"
                placeholder="Precio"
                value={newService.price}
                onChange={e => setNewService({ ...newService, price: e.target.value })}
              />
              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
                >
                  Guardar servicio
                </button>
              </div>
            </form>
          )}

          <ul className="space-y-2">
            {services.map((s) => (
              <li key={s.id} className="p-2 bg-gray-900 rounded">
                {editingServiceId === s.id && editingServiceData ? (
                  <form onSubmit={saveEditService} className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                    <input
                      className="bg-gray-800 rounded px-2 py-1"
                      value={editingServiceData.title}
                      onChange={e => setEditingServiceData({ ...editingServiceData, title: e.target.value })}
                      required
                    />
                    <input
                      className="bg-gray-800 rounded px-2 py-1"
                      value={editingServiceData.duration}
                      onChange={e => setEditingServiceData({ ...editingServiceData, duration: e.target.value })}
                    />
                    <input
                      className="bg-gray-800 rounded px-2 py-1"
                      value={editingServiceData.price}
                      onChange={e => setEditingServiceData({ ...editingServiceData, price: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1 bg-green-600 rounded">Guardar</button>
                      <button
                        type="button"
                        onClick={() => { setEditingServiceId(null); setEditingServiceData(null); }}
                        className="px-3 py-1 border rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-sm text-gray-400">{s.duration} · {s.price}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => startEditService(s)} className="px-3 py-1 border rounded text-sm">Editar</button>
                      <button onClick={() => removeService(s)} className="px-3 py-1 bg-red-600 rounded text-sm">Eliminar</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#0f0f0f] p-4 rounded mt-6 mb-6">
          <h2 className="font-semibold mb-2">Productos</h2>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-300">Crear nuevo producto</h3>
            <button
              type="button"
              onClick={() => setShowNewProductForm(prev => !prev)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
            >
              {showNewProductForm ? 'Cerrar formulario' : 'Añadir producto'}
            </button>
          </div>

          {showNewProductForm && (
            <form onSubmit={addProduct} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <input
                className="bg-gray-900 rounded px-2 py-1"
                placeholder="Nombre"
                value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
              <input
                className="bg-gray-900 rounded px-2 py-1 md:col-span-2"
                placeholder="Descripción"
                value={newProduct.description}
                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
              />
              <input
                type="number"
                step="0.01"
                className="bg-gray-900 rounded px-2 py-1"
                placeholder="Precio"
                value={newProduct.price}
                onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                required
              />
              <input
                type="number"
                className="bg-gray-900 rounded px-2 py-1"
                placeholder="Stock"
                value={newProduct.stock}
                onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                required
              />
              <input
                className="bg-gray-900 rounded px-2 py-1"
                placeholder="Categoría"
                value={newProduct.category}
                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
              />
              <input
                className="bg-gray-900 rounded px-2 py-1 md:col-span-2"
                placeholder="URL imagen"
                value={newProduct.imageUrl}
                onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
              >
                Guardar producto
              </button>
            </form>
          )}

          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id} className="p-2 bg-gray-900 rounded">
                {editingProductId === p.id && editingProductData ? (
                  <form onSubmit={saveEditProduct} className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        className="bg-gray-800 rounded px-2 py-1"
                        value={editingProductData.name}
                        onChange={e => setEditingProductData({ ...editingProductData, name: e.target.value })}
                      />
                      <input
                        className="bg-gray-800 rounded px-2 py-1 md:col-span-2"
                        value={editingProductData.description}
                        onChange={e => setEditingProductData({ ...editingProductData, description: e.target.value })}
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="bg-gray-800 rounded px-2 py-1"
                        value={editingProductData.price}
                        onChange={e => setEditingProductData({ ...editingProductData, price: e.target.value })}
                      />
                      <input
                        type="number"
                        className="bg-gray-800 rounded px-2 py-1"
                        value={editingProductData.stock}
                        onChange={e => setEditingProductData({ ...editingProductData, stock: e.target.value })}
                      />
                      <input
                        className="bg-gray-800 rounded px-2 py-1"
                        value={editingProductData.category}
                        onChange={e => setEditingProductData({ ...editingProductData, category: e.target.value })}
                      />
                      <input
                        className="bg-gray-800 rounded px-2 py-1 md:col-span-2"
                        value={editingProductData.imageUrl}
                        onChange={e => setEditingProductData({ ...editingProductData, imageUrl: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button type="submit" className="px-3 py-1 bg-green-600 rounded">Guardar</button>
                      <button
                        type="button"
                        onClick={() => { setEditingProductId(null); setEditingProductData(null); }}
                        className="px-3 py-1 border rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex-1">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-gray-400">{p.description}</div>
                      <div className="text-sm mt-1">
                        <span className="text-red-500 font-medium">${p.price?.toLocaleString('es-CL')}</span>
                        <span className="text-gray-500 ml-3">Stock: {p.stock}</span>
                        {p.category && <span className="text-gray-600 ml-3">· {p.category}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => startEditProduct(p)} className="px-3 py-1 border rounded text-sm">Editar</button>
                      <button onClick={() => removeProduct(p)} className="px-3 py-1 bg-red-600 rounded text-sm">Eliminar</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#0f0f0f] p-4 rounded mt-6 mb-6">
          <h2 className="font-semibold mb-4">Pedidos de Productos</h2>
          {orders.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay pedidos aún</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const pickupDate = order.pickupDate?.toDate ? order.pickupDate.toDate() : new Date(order.pickupDate);
                const createdDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
                
                return (
                  <div key={order.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-[#E50914]">{order.orderCode}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                            order.status === 'ready' ? 'bg-green-900/30 text-green-400' :
                            order.status === 'completed' ? 'bg-blue-900/30 text-blue-400' :
                            'bg-gray-800 text-gray-400'
                          }`}>
                            {order.status === 'pending' ? 'Pendiente' :
                             order.status === 'ready' ? 'Listo' :
                             order.status === 'completed' ? 'Entregado' :
                             order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Pedido: {createdDate.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm text-gray-400">
                          Retiro: {pickupDate.toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${order.totalAmount?.toLocaleString('es-CL')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-300 mb-1">Cliente</p>
                        <p className="text-sm">{order.customer?.name}</p>
                        <p className="text-sm text-gray-400">{order.customer?.email}</p>
                        <p className="text-sm text-gray-400">{order.customer?.phone}</p>
                        {order.customer?.address && (
                          <p className="text-sm text-gray-400 mt-1">{order.customer.address}</p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-semibold text-gray-300 mb-1">Productos</p>
                        <ul className="space-y-1 text-sm">
                          {order.items?.map((item, idx) => (
                            <li key={idx} className="text-gray-300">
                              {item.name} <span className="text-gray-500">x{item.quantity}</span> - ${(item.price * item.quantity).toLocaleString('es-CL')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {order.customer?.notes && (
                      <div className="mb-3 p-2 bg-[#0A0A0A] rounded text-sm">
                        <p className="text-gray-400">Notas: <span className="text-gray-300">{order.customer.notes}</span></p>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {order.status === 'pending' && (
                        <button
                          onClick={async () => {
                            if (!confirm('¿Marcar pedido como listo para retirar?')) return;
                            try {
                              await updateDoc(doc(db, 'orders', order.id), { status: 'ready' });
                            } catch (e) {
                              alert('Error: ' + e.message);
                            }
                          }}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm transition"
                        >
                          Marcar como listo
                        </button>
                      )}
                      {(order.status === 'ready' || order.status === 'pending') && (
                        <button
                          onClick={async () => {
                            if (!confirm('¿Marcar pedido como entregado?')) return;
                            try {
                              await updateDoc(doc(db, 'orders', order.id), { 
                                status: 'completed',
                                picked: true,
                                completedAt: serverTimestamp()
                              });
                            } catch (e) {
                              alert('Error: ' + e.message);
                            }
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
                        >
                          Marcar como entregado
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) return;
                          try {
                            await archiveOrder(order);
                            await deleteDoc(doc(db, 'orders', order.id));
                          } catch (e) {
                            alert('Error: ' + e.message);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <GalleryAdmin />

        <div className="mt-6 flex gap-2">
          <button onClick={logout} className="px-4 py-2 border rounded">Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}

