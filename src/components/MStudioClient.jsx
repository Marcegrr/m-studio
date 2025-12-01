import React, { useEffect, useState } from "react";
import { Link, BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Login from './Login';
import AdminPanel from './AdminPanel';
import ProtectedRoute from './ProtectedRoute';
import GalleryPage from './GalleryPage';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { usePublicImages } from '../hooks/usePublicImages';

export default function MStudioClientApp() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MStudioClient />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute requiredRole={'admin'}><AdminPanel /></ProtectedRoute>} />
          <Route path="/gallery" element={<GalleryPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function MStudioClient() {
  const pdfUrl = "/mnt/data/M studio _ Las Condes [ Reserva ahora ].pdf";

  const fallbackServices = [
    { title: "Corte de pelo", duration: "1h", price: "15.000 $" },
    { title: "Corte de pelo + barba", duration: "1h 30min", price: "17.000 $" },
    { title: "Arreglo de barba", duration: "30min", price: "7.000 $" },
  ];

  const [services, setServices] = useState(fallbackServices);
  const { images } = usePublicImages();

  useEffect(() => {
    // subscribe to services collection
    try {
      // Subscribe to the services collection without relying on createdAt ordering
      const q = query(collection(db, 'services'));
      const unsub = onSnapshot(q, (snap) => {
        console.debug('[MStudioClient] services snapshot size:', snap.size);
        if (snap.empty) {
          console.debug('[MStudioClient] services snapshot empty — using fallback');
          setServices(fallbackServices);
        } else {
          const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          console.debug('[MStudioClient] services snapshot:', arr);
          setServices(arr);
        }
      }, (err) => console.error('services snapshot error', err));

      return () => { unsub(); };
    } catch (e) {
      console.error('Error subscribing to Firestore collections', e);
    }
  }, []);

  const reviews = [
    { name: "Matias", text: "Excelente servicio 🙌🏼" },
    { name: "Lucas", text: "Muy atento y amable , nos preguntó y aconsejo y respondió nuestras dudas respecto al corte y tipo de cabello ." },
    { name: "Vicente Leclerc", text: "10/10!" },
    { name: "Michell", text: "Muy buen servicio, responsable con el horario" },
    { name: "Pablo ni", text: "Buen corte buena conversa buen momento del dia con bondaoso barber" },
    { name: "Pablo", text: "Muy buen servicio!" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-inter">
      <Header />

      <main className="max-w-6xl mx-auto p-6">
        {/* Hero */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold">M studio</h2>
            <p className="mt-4 text-gray-300">Nuestro Propósito es transformar la imagen de nuestros clientes con precisión, estilo y autenticidad, combinando tradición, innovación y las últimas tendencias urbanas.</p>

            <div className="mt-6 flex gap-4">
              <a href="#services" className="px-6 py-3 bg-red-600 text-white rounded-md font-semibold">Reservar</a>
            </div>

            <div className="mt-6 text-sm text-gray-400">
              <p><strong>Bueno saber</strong></p>
              <p>Política de reservas</p>
              <p className="mt-2">Bienvenido! Muchas gracias por tu preferencia, nos encontramos en Sandro botticelli 7889 , Las condes .</p>
              <p>Recuerda siempre cancelar tu cita con anticipación en caso de no asistir.</p>
            </div>
          </div>

          <div className="h-72 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
            <img 
              src="/baner barberia.webp"
              alt="Maldaoso Barber Studio"
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        {/* Services */}
        <section id="services" className="mb-12">
          <h3 className="text-2xl font-semibold mb-4">Servicios</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.id ?? s.title} className="bg-[#0f0f0f] rounded-xl p-6 border border-gray-800">
                <h4 className="text-xl font-semibold">{s.title}</h4>
                <p className="text-sm text-gray-400 mt-2">{s.duration} · · {s.price}</p>
                <div className="mt-4 flex gap-2">
                  <button className="px-4 py-2 border border-gray-700 rounded-md text-gray-300">Detalles</button>
                  <button 
                    onClick={() => document.getElementById('Setmore_button_iframe')?.click()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md cursor-pointer"
                  >
                    Reservar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Equipo */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-4">Equipo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0f0f0f] rounded-xl p-6 border border-gray-800 flex gap-4 items-center">
              <img src="/Logo.png" alt="maldaoso barber" className="w-20 h-20 rounded-full object-cover" />
              <div>
                <p className="font-semibold">maldaoso barber</p>
                <p className="text-sm text-gray-400">Barbero</p>
                <p className="mt-2 text-sm">Arreglo de barba · 30min · 7000 $</p>
                <div className="mt-3">
                  <button 
                    onClick={() => document.getElementById('Setmore_button_iframe')?.click()}
                    className="px-3 py-2 bg-red-600 text-white rounded-md cursor-pointer"
                  >
                    Reservar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="mb-12">
          <h3 className="text-2xl font-semibold mb-4">Reseñas</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-yellow-400 font-bold">5.0</div>
              <div className="text-sm text-gray-400">14 reseñas</div>
            </div>

            {reviews.map((r, i) => (
              <div key={i} className="bg-[#0f0f0f] rounded-xl p-4 border border-gray-800">
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm text-gray-300 mt-1">{r.text}</p>
              </div>
            ))}

          </div>
        </section>

        {/* Gallery */}
        <section id="gallery" className="mb-12">
          <h3 className="text-2xl font-semibold mb-4"><Link to="/gallery" className="hover:underline">Galería</Link></h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-2 md:col-span-4 text-center text-gray-400 py-4">Cargando galería...</div>
            ) : images && images.length > 0 ? (
              images.slice(0,4).map((p, i) => (
                <Link key={`pub-${p.path}-${i}`} to="/gallery" className="h-40 bg-gray-800 rounded-lg overflow-hidden block">
                  <img src={p.url} alt={p.path} className="w-full h-full object-cover" />
                </Link>
              ))
            ) : (
              <div className="col-span-2 md:col-span-4 text-center text-gray-400 py-4">
                <p>No hay imágenes en la galería aún.</p>
                <p className="text-sm mt-2">El administrador puede subir imágenes desde el panel.</p>
              </div>
            )}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mb-24">
          <h3 className="text-2xl font-semibold mb-4">Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0f0f0f] rounded-xl p-6 border border-gray-800">
              <p className="font-semibold">M studio</p>
              <p className="text-sm text-gray-400 mt-1">Nuestra política de reservas</p>
              <p className="mt-3 text-sm text-gray-300">Bienvenido! Muchas gracias por tu preferencia, nos encontramos en Sandro botticelli 7889 , Las condes .</p>
              <p className="mt-1 text-sm text-gray-300">Recuerda siempre cancelar tu cita con anticipación en caso de no asistir.</p>

              <div className="mt-4">
                <p className="text-sm text-gray-400">Dirección</p>
                <p className="font-medium">7889 Sandro Botticelli Las Condes, Región Metropolitana 7560521</p>

                <p className="mt-3 text-sm text-gray-400">Teléfono</p>
                <a className="block font-medium" href="tel:936681862">9 3668 1862</a>

                <p className="mt-3 text-sm text-gray-400">Correo</p>
                <a className="block font-medium" href="mailto:edupalmabozo@gmail.com">edupalmabozo@gmail.com</a>
              </div>

              <div className="mt-6">
                <a className="inline-block px-4 py-2 border border-gray-700 rounded-md text-gray-300" href={pdfUrl} target="_blank" rel="noreferrer">Abrir PDF original</a>
              </div>
            </div>

            <div className="bg-[#0f0f0f] rounded-xl p-6 border border-gray-800">
              <p className="font-semibold">Horario</p>
              <p className="text-sm text-gray-300 mt-2">Abierto · Cierra a las 17:00</p>

            <a 
              href="https://www.google.com/maps/search/?api=1&query=7889+Sandro+Botticelli%2C+Las+Condes%2C+Regi%C3%B3n+Metropolitana%2C+7560521" 
              target="_blank" 
              rel="noreferrer"
              className="mt-6 h-48 rounded-lg overflow-hidden relative flex items-center justify-center group cursor-pointer"
            >
              <img 
                alt="7889 Sandro Botticelli, Las Condes, Región Metropolitana 7560521" 
                src="/Mapa.png"
                className="w-full h-full object-cover group-hover:opacity-80 transition"
              />
              <svg 
                aria-hidden="true" 
                fillRule="evenodd" 
                viewBox="0 0 480 480" 
                xmlns="http://www.w3.org/2000/svg" 
                className="absolute h-12 w-12 fill-red-600 drop-shadow-lg hover:fill-red-700 transition"
              >
                <path d="M230.5 431.6a15 15 0 0 0 19 0l.2-.1v-.1l.3-.2a204.4 204.4 0 0 0 5.9-5 625.7 625.7 0 0 0 65.6-67.1C356.7 316.8 395 258.2 395 200a155 155 0 0 0-310 0c0 58.2 38.3 116.8 73.5 159a625.7 625.7 0 0 0 71.5 72.2h.1l.2.3h.1ZM180 200a60 60 0 1 0 120 0 60 60 0 0 0-120 0Z"></path>
              </svg>
            </a>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-gray-800 py-6">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">Get more customers 24/7 with your free branded Booking Page. · setmore.com</div>
      </footer>

      <a
        style={{
          float: "none",
          position: "fixed",
          right: "-2px",
          top: "25%",
          display: "block",
          zIndex: 20000
        }}
        id="Setmore_button_iframe"
        href="https://maldaosobarberstudio.setmore.com"
      >
        <img
          src="https://storage.googleapis.com/full-assets/setmore/images/1.0/Calendar/Setmore-Book-Now.png"
          alt="Click here to book the appointment using setmore"
        />
      </a>
    </div>
  );
}

function Header() {
  const { user, role } = useAuth();

  return (
    <header className="max-w-6xl mx-auto p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img src="/Logo.png" alt="M studio" className="w-12 h-12 rounded-full object-cover" />
        <div>
          <h1 className="text-2xl font-semibold">M studio</h1>
          <p className="text-sm text-gray-300">Las Condes · 5.0 · 14 reseñas</p>
        </div>
      </div>
      <nav className="flex items-center gap-4">
        <a className="px-4 py-2 rounded-md border border-red-700 text-yellow-300" href="#services">Servicios</a>
        <Link className="px-4 py-2 rounded-md hover:bg-gray-800" to="/gallery">Galería</Link>
        <a className="px-4 py-2 rounded-md hover:bg-gray-800" href="#reviews">Reseñas</a>
        {role === 'admin' ? (
          <a href="/admin" className="px-4 py-2 bg-gray-800 rounded-md border">Panel</a>
        ) : (
          <a href="/login" className="px-4 py-2 bg-red-600 text-white rounded-md">Ingresar</a>
        )}
      </nav>
    </header>
  );
}
