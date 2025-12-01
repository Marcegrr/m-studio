import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
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

    return () => { unsub(); };
  }, []);
  
  useEffect(() => {
    // fetch generated public-images.json
    const fetchPublic = async () => {
      try {
        const indexUrl = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/public-images.json` : '/public-images.json';
        const res = await fetch(indexUrl);
        if (!res.ok) return setPublicImages([]);
        const data = await res.json();
        // filter out internal assets we don't want shown in the editable public list
        const excluded = ['Logo.png', 'Mapa.png', 'vite.svg'];
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

  const addService = async () => {
    const title = prompt('Nombre servicio');
    if (!title) return;
    const duration = prompt('Duración');
    const price = prompt('Precio');
    try {
      const docRef = await addDoc(collection(db, 'services'), { title, duration, price, createdAt: serverTimestamp() });
      console.debug('[AdminPanel] added service id=', docRef.id);
    } catch (err) {
      alert('Error añadiendo servicio: ' + err.message);
    }
  };

  const editService = async (s) => {
    const title = prompt('Nombre servicio', s.title);
    if (!title) return;
    const duration = prompt('Duración', s.duration);
    const price = prompt('Precio', s.price);
    try {
      await updateDoc(doc(db, 'services', s.id), { title, duration, price });
      console.debug('[AdminPanel] updated service id=', s.id);
    } catch (err) {
      alert('Error editando servicio: ' + err.message);
    }
  };

  const removeService = async (s) => {
    if (!confirm('¿Eliminar servicio?')) return;
    try {
      await deleteDoc(doc(db, 'services', s.id));
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
          <h2 className="font-semibold mb-2">Servicios</h2>
          <ul className="space-y-2">
            {services.map((s) => (
              <li key={s.id} className="flex justify-between items-center p-2 bg-gray-900 rounded">
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm text-gray-400">{s.duration} · {s.price}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editService(s)} className="px-3 py-1 border rounded">Editar</button>
                  <button onClick={() => removeService(s)} className="px-3 py-1 bg-red-600 rounded">Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <div className="flex gap-2">
              <button onClick={addService} className="px-4 py-2 bg-red-600 rounded">Añadir servicio</button>
              <button onClick={async () => {
                const confirmSeed = confirm('Crear servicios predeterminados (sin imágenes) en Firestore?');
                if (!confirmSeed) return;
                try {
                  // check if there are already services
                  const snap = await (await import('firebase/firestore')).getDocs((await import('firebase/firestore')).collection(db, 'services'));
                  if (!snap.empty) {
                    if (!confirm('Ya existen servicios. ¿Deseas añadir los predeterminados de todas formas?')) return;
                  }
                  const examples = [
                    { title: 'Corte de pelo', duration: '1h', price: '15.000 $' },
                    { title: 'Corte de pelo + barba', duration: '1h 30min', price: '17.000 $' },
                    { title: 'Arreglo de barba', duration: '30min', price: '7.000 $' }
                  ];
                  for (const s of examples) {
                    await addDoc(collection(db, 'services'), { ...s, createdAt: serverTimestamp() });
                  }
                  alert('Servicios predeterminados creados. Recarga la página si no aparecen.');
                } catch (err) {
                  alert('Error creando servicios predeterminados: ' + err.message);
                }
              }} className="px-4 py-2 border rounded">Servicios predeterminados</button>
            </div>
          </div>
        </div>

        <div className="bg-[#0f0f0f] p-4 rounded">
          <h2 className="font-semibold mb-2">Galería</h2>
          <div className="mt-3">
            <input ref={fileInputRef} onChange={onFileChange} type="file" accept="image/*" multiple className="text-sm" />
            <p className="text-xs text-gray-500 mt-2">Puedes seleccionar múltiples imágenes a la vez</p>
          </div>
        </div>

        {localGallery.length > 0 && (
          <div className="bg-[#0f0f0f] p-4 rounded mt-6">
            <h2 className="font-semibold mb-2">Imágenes guardadas localmente</h2>
            <p className="text-sm text-gray-400">Estas imágenes están guardadas en tu navegador y no se han subido al servidor.</p>
            <div className="mt-3 flex items-center gap-3">
              <button onClick={async () => {
                if (!confirm('Subir todas las imágenes locales al servidor?')) return;
                for (const item of localGallery.slice()) {
                  // upload sequentially
                  // eslint-disable-next-line no-await-in-loop
                  await uploadLocalToServer(item);
                }
                alert('Proceso de subida finalizado.');
              }} className="px-3 py-2 bg-red-600 rounded">Subir todas</button>
              <button onClick={async () => {
                try {
                  if (!window.JSZip) return alert('JSZip no cargado');
                  const zip = new window.JSZip();
                  for (const item of localGallery) {
                    const rec = await idbGet(item.id);
                    if (!rec) continue;
                    zip.file(rec.name, rec.blob);
                  }
                  const content = await zip.generateAsync({ type: 'blob' });
                  const url = URL.createObjectURL(content);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'mstudio-local-images.zip';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch (e) {
                  console.error('Error generando ZIP', e);
                  alert('Error generando ZIP: ' + e.message);
                }
              }} className="px-3 py-2 border rounded">Exportar ZIP</button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {localGallery.map(item => (
                <div key={item.id} className="bg-gray-900 p-3 rounded">
                  <img src={item.url} alt={item.name} className="w-full h-28 object-cover rounded" />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm text-gray-300 truncate">{item.name}</div>
                    <div className="flex gap-2">
                      <button onClick={() => uploadLocalToServer(item)} className="px-2 py-1 bg-red-600 rounded text-sm">Subir</button>
                      <button onClick={async () => { await idbDelete(item.id); setLocalGallery(prev => prev.filter(p => p.id !== item.id)); }} className="px-2 py-1 border rounded text-sm">Borrar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#0f0f0f] p-4 rounded mt-6">
          <h2 className="font-semibold mb-2">Imágenes públicas</h2>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicImages.length === 0 ? (
              <div className="text-sm text-gray-400">No se encontraron imágenes en `public/`. Ejecuta <code>npm run generate:public-images</code> desde el proyecto y recarga.</div>
            ) : (
              publicImages.map(img => {
                const id = encodeURIComponent(img.relPath);
                const noteDoc = publicNotes[id];
                // Solo permitir eliminar imágenes en /uploads (subidas por admin)
                const canDelete = img.relPath.startsWith('uploads/');
                return (
                  <div key={img.relPath} className="flex gap-3 items-start bg-gray-900 p-3 rounded">
                    <img src={img.url} alt={img.name} className="w-24 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-300 font-medium">{img.name}</div>
                      <div className="text-xs text-gray-500">Ruta: <code>/{img.relPath}</code></div>
                      {canDelete && <div className="text-xs text-gray-600 mt-1">Imagen subida por admin (puede eliminarse)</div>}
                      {!canDelete && <div className="text-xs text-gray-600 mt-1">Imagen estática del proyecto (no eliminable)</div>}
                      <div className="mt-2 flex gap-2">
                        <input defaultValue={noteDoc?.note || ''} id={`note-${id}`} className="flex-1 px-2 py-1 bg-gray-800 rounded text-sm" placeholder="Nota/ubicación (ej: hero banner, footer, tarjeta)" />
                        <button onClick={async () => {
                          const el = document.getElementById(`note-${id}`);
                          const note = el?.value ?? '';
                          try {
                            await setDoc(doc(db, 'public_images', id), { path: img.relPath, note, updatedAt: serverTimestamp() });
                            setPublicNotes(prev => ({ ...prev, [id]: { path: img.relPath, note } }));
                            alert('Nota guardada');
                          } catch (e) {
                            alert('Error guardando nota: ' + e.message);
                          }
                        }} className="px-3 py-1 bg-red-600 rounded">Guardar</button>
                        {canDelete && (
                          <button onClick={async () => {
                            if (!confirm(`¿Eliminar ${img.name}?`)) return;
                            try {
                              const filename = img.name;
                              const res = await fetch(`${BACKEND_BASE}/upload/${filename}`, { method: 'DELETE' });
                              if (!res.ok) {
                                const errorData = await res.json().catch(() => ({}));
                                throw new Error(errorData.error || 'Error eliminando imagen');
                              }
                              alert('Imagen eliminada. Recarga la página.');
                              window.location.reload();
                            } catch (e) {
                              console.error('Delete error:', e);
                              alert('Error eliminando imagen: ' + e.message);
                            }
                          }} className="px-3 py-1 border border-red-600 rounded">Eliminar</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={logout} className="px-4 py-2 border rounded">Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}
