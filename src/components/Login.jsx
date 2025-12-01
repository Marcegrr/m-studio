import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // after successful login, navigate to the previous location or home
      navigate(from, { replace: true });
    } catch (err) {
      alert('Error al iniciar sesión: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <form onSubmit={handleSubmit} className="bg-[#0f0f0f] p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Acceso Administrador / Cliente</h2>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-3 bg-gray-800 rounded text-white"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-3 bg-gray-800 rounded text-white"
        />
        <div className="flex gap-2">
          <button disabled={loading} className="flex-1 bg-red-600 p-2 rounded text-white">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
          <Link to="/" className="inline-flex items-center px-4 py-2 border rounded text-gray-300">Volver</Link>
        </div>
      </form>
    </div>
  );
}
