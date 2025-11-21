
// services/aws.ts - Servicio de Backend para AWS
// Este servicio reemplaza la lógica de Firebase.
// Funciona en dos modos:
// 1. MODO LOCAL (Default): Usa localStorage para simular AWS DynamoDB y S3.
// 2. MODO AWS: Si configuras una API URL, hará fetch a tu backend real.

export interface AWSConfig {
  apiUrl: string;       // URL de tu API Gateway o Instancia EC2 (ej: https://api.mivarillera.com)
  s3BucketUrl?: string; // URL base de tu bucket S3 (opcional para visualización)
  apiKey?: string;      // x-api-key para AWS Gateway (opcional)
}

// Configuración por defecto (Vacía = Modo Local)
const defaultAWSConfig: AWSConfig = {
  apiUrl: "", 
  s3BucketUrl: "",
  apiKey: ""
};

export const getAWSConfiguration = (): AWSConfig => {
  try {
    const stored = localStorage.getItem('varivericar_aws_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Error cargando config AWS", e);
  }
  return defaultAWSConfig;
};

export const saveAWSConfiguration = (config: AWSConfig) => {
  localStorage.setItem('varivericar_aws_config', JSON.stringify(config));
};

// --- SIMULACIÓN DE BASE DE DATOS LOCAL (MOCK) ---
// Esto permite que la app funcione antes de que tengas el backend AWS listo.
const mockDB = {
  reports: 'mock_aws_reports',
  users: 'mock_aws_users'
};

// --- CLIENTE API (HÍBRIDO) ---

export const awsService = {
  
  // 1. Subida de Archivos (Simula S3 PUT o usa API real)
  uploadFile: async (file: File): Promise<string> => {
    const config = getAWSConfiguration();

    if (config.apiUrl) {
      // MODO REAL: Solicitar URL firmada y subir
      // Paso 1: Pedir Presigned URL a tu backend
      const presignRes = await fetch(`${config.apiUrl}/upload-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey || '' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      
      if (!presignRes.ok) throw new Error('AWS S3 Sign Failed');
      const { uploadUrl, publicUrl } = await presignRes.json();

      // Paso 2: PUT directo a S3
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

  // 2. Guardar Datos (Simula DynamoDB PutItem)
  saveData: async (collection: 'reports' | 'users', data: any) => {
    const config = getAWSConfiguration();

    if (config.apiUrl) {
      // MODO REAL: POST a tu API
      const res = await fetch(`${config.apiUrl}/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey || '' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('AWS Save Failed');
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

  // 3. Obtener Datos (Simula DynamoDB Scan/Query)
  getData: async (collection: 'reports' | 'users') => {
    const config = getAWSConfiguration();

    if (config.apiUrl) {
      // MODO REAL: GET a tu API
      const res = await fetch(`${config.apiUrl}/${collection}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey || '' }
      });
      if (!res.ok) throw new Error('AWS Fetch Failed');
      return await res.json();
    } else {
      // MODO LOCAL
      const key = collection === 'reports' ? mockDB.reports : mockDB.users;
      let data = JSON.parse(localStorage.getItem(key) || '[]');
      
      // Si es usuarios y está vacío, crear admin default
      if (collection === 'users' && data.length === 0) {
        data = [{
           id: 'admin-default',
           name: 'Admin AWS',
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
    const config = getAWSConfiguration();

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
