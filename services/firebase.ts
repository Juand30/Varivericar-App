
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 1. Configuración por defecto (Respaldo)
const defaultFirebaseConfig = {
  apiKey: "AIzaSyCksDTC9v-klGc0CfHrd6aThYs_Y75RCKU",
  authDomain: "varivericar-app.firebaseapp.com",
  projectId: "varivericar-app",
  storageBucket: "varivericar-app.firebasestorage.app",
  messagingSenderId: "435501885056",
  appId: "1:435501885056:web:6552a142588c03cc40a865",
  measurementId: "G-351EDFFQ70"
};

// 2. Intentar cargar configuración personalizada del navegador
const getConfiguration = () => {
  try {
    const stored = localStorage.getItem('varivericar_firebase_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Error cargando config guardada, usando defecto", e);
  }
  return defaultFirebaseConfig;
};

const firebaseConfig = getConfiguration();

// 3. Inicializar Firebase
// Nota: Si la configuración es inválida, esto podría lanzar un error en consola.
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.error("Error inicializando Firebase. Verifica tu configuración.", e);
  // Fallback seguro para no romper la UI completamente antes de que el usuario pueda arreglarlo
  app = initializeApp(defaultFirebaseConfig); 
}

const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, firebaseConfig };
