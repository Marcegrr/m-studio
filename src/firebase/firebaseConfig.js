// Firebase Config para M Studio (React + Roles + Firestore)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDZM_0UTl-YaGo12EnoGkivPwLaiQNLOV8",
  authDomain: "mstudio-e846d.firebaseapp.com",
  projectId: "mstudio-e846d",
  // Use the default bucket hostname (usually <project>.appspot.com)
  storageBucket: "mstudio-e846d.appspot.com",
  messagingSenderId: "507420190304",
  appId: "1:507420190304:web:8ab8dde18296a265608505",
  measurementId: "G-FG9CKCDXR1"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios NECESARIOS para tu proyecto
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Log para depuración en el navegador/dev server
try {
  // eslint-disable-next-line no-console
  console.log('Firebase config loaded (auth/db/storage):', !!auth, !!db, !!storage);
} catch (e) {
  // ignore
}

// También exportar por defecto (fallback) para evitar errores de import inesperados
export default { auth, db, storage };
