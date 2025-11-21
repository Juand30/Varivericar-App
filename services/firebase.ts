
// services/cloud.ts - Servicio de Backend Genérico
// Funciona en dos modos:
// 1. MODO LOCAL (Default): Usa localStorage para simular base de datos y almacenamiento.
// 2. MODO REMOTO: Si configuras una API URL, hará fetch a tu backend real.

export interface CloudConfig {
  apiUrl: string;       // URL de tu API (ej: https://api.mivarillera.com)
  bucketUrl?: string;   // URL base de almacenamiento (opcional para visualización)
  apiKey?: string;      // Header de autenticación (opcional)
}

// Configuración por defecto (Vacía = Modo Local)
const defaultCloudConfig: CloudConfig = {
  apiUrl: "", 
  bucketUrl: "",
  apiKey: ""
};

export const getCloudConfiguration = (): CloudConfig => {
  try {
    const stored = localStorage.getItem('varivericar_cloud_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Error cargando config Cloud", e);
  }
  return defaultCloudConfig;
};

export const saveCloudConfiguration = (config: CloudConfig) => {
  localStorage.setItem('varivericar_cloud_config', JSON.stringify(config));
};

// --- SIMULACIÓN DE BASE DE DATOS LOCAL (MOCK) ---
const mockDB = {
  reports: 'mock_cloud_reports',
  users: 'mock_cloud_users'
};

// --- CLIENTE API (HÍBRIDO) ---

export const cloudService = {
  
  // 1. Subida de Archivos (Simula PUT o usa API real)
  uploadFile: async (file: File): Promise<string> => {
    const config = getCloudConfiguration();

    if (config.apiUrl) {
      // MODO REAL: Solicitar URL firmada y subir
      const presignRes = await fetch(`${config.apiUrl}/upload-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey || '' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      
      if (!presignRes.ok) throw new Error('Cloud Sign Failed');
      const { uploadUrl, publicUrl } = await presignRes.json();

      // PUT directo
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      return publicUrl;
    } else {
      // MODO LOCAL: Convertir a Base64 y guardar (Simulación)
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
  },

  // 2. Guardar Datos
  saveData: async (collection: 'reports' | 'users', data: any) => {
    const config = getCloudConfiguration();

    if (config.apiUrl) {
      // MODO REAL: POST a tu API
      const res = await fetch(`${config.apiUrl}/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey || '' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Cloud Save Failed');
      return await res.json();
    } else {
      // MODO LOCAL
      const key = collection === 'reports' ? mockDB.reports : mockDB.users;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      
      // Update si existe ID, sino Add
      const index = existing.findIndex((item: any) => item.id === data.id);
      if (index >= 0) {
        existing[index] = data;
      } else {
        existing.push(data);
      }
      localStorage.setItem(key, JSON.stringify(existing));
      return data;
    }
  },

  // 3. Obtener Datos
  getData: async (collection: 'reports' | 'users') => {
    const config = getCloudConfiguration();

    if (config.apiUrl) {
      // MODO REAL: GET a tu API
      const res = await fetch(`${config.apiUrl}/${collection}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey || '' }
      });
      if (!res.ok) throw new Error('Cloud Fetch Failed');
      return await res.json();
    } else {
      // MODO LOCAL
      const key = collection === 'reports' ? mockDB.reports : mockDB.users;
      let data = JSON.parse(localStorage.getItem(key) || '[]');
      
      // Si es usuarios y está vacío, crear admin default
      if (collection === 'users' && data.length === 0) {
        data = [{
           id: 'admin-default',
           name: 'Admin System',
           email: 'juandp2290@gmail.com',
           password: 'admin123', 
           role: 'ADMIN'
        }];
        localStorage.setItem(key, JSON.stringify(data));
      }
      return data;
    }
  },

  // 4. Borrar Datos
  deleteData: async (collection: 'reports' | 'users', id: string) => {
    const config = getCloudConfiguration();

    if (config.apiUrl) {
      // MODO REAL: DELETE a tu API
      await fetch(`${config.apiUrl}/${collection}/${id}`, {
        method: 'DELETE',
        headers: { 'x-api-key': config.apiKey || '' }
      });
    } else {
      // MODO LOCAL
      const key = collection === 'reports' ? mockDB.reports : mockDB.users;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter((item: any) => item.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  }
};
