import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('client');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      // guardar rol en Firestore
      await setDoc(doc(db, 'users', cred.user.uid), { role });
      alert('Usuario creado');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <form onSubmit={handleSubmit} className="bg-[#0f0f0f] p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Registro</h2>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nombre" className="w-full p-2 mb-3 bg-gray-800 rounded text-white" />
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Correo" className="w-full p-2 mb-3 bg-gray-800 rounded text-white" />
        <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Contraseña" type="password" className="w-full p-2 mb-3 bg-gray-800 rounded text-white" />

        <label className="text-sm text-gray-400">Rol</label>
        <select value={role} onChange={(e)=>setRole(e.target.value)} className="w-full p-2 mb-3 bg-gray-800 rounded text-white">
          <option value="client">Cliente</option>
          <option value="admin">Administrador</option>
        </select>

        <button className="w-full bg-red-600 p-2 rounded text-white">Crear cuenta</button>
      </form>
    </div>
  );
}
