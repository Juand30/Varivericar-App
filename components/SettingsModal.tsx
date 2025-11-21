
import React, { useState, useEffect } from 'react';
import { X, Save, Server, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { getCloudConfiguration, saveCloudConfiguration, CloudConfig } from '../services/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      const config = getCloudConfiguration();
      setApiUrl(config.apiUrl || '');
      setApiKey(config.apiKey || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    setStatus('saving');
    
    const newConfig: CloudConfig = {
      apiUrl: apiUrl.trim(),
      apiKey: apiKey.trim(),
      bucketUrl: ''
    };

    saveCloudConfiguration(newConfig);

    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }, 500);
  };

  const handleReset = () => {
      if(window.confirm("Se borrará la configuración y la app pasará a MODO MOCK (Local).")) {
          localStorage.removeItem('varivericar_cloud_config');
          window.location.reload();
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-metal-900 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <Server size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Configuración del Servidor</h3>
              <p className="text-xs text-gray-400">Conecta la app a tu API</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                 <CheckCircle2 size={32} />
               </div>
               <h4 className="text-xl font-bold text-gray-900">¡Conexión Guardada!</h4>
               <p className="text-gray-600 mt-2">Reiniciando entorno...</p>
            </div>
          ) : (
            <>
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-6 text-sm text-orange-800 flex gap-3">
                <div className="mt-0.5"><Server size={16} /></div>
                <div>
                  <p className="font-bold mb-1">Modo de Operación:</p>
                  <p>Si dejas los campos vacíos, la aplicación funcionará en <b>Modo Simulación</b> (Mock) usando almacenamiento local. Rellénalos cuando tengas tu servidor remoto desplegado.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">URL del Servidor API</label>
                  <input 
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="https://api.ejemplo.com/prod"
                  />
                  <p className="text-xs text-gray-500 mt-1">Endpoint raíz de tu API REST.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">API Key (Opcional)</label>
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="x-api-key value..."
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {status !== 'success' && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <button 
                onClick={handleReset}
                className="text-sm text-red-500 hover:text-red-700 hover:underline font-medium"
            >
                Resetear a Local
            </button>
            <div className="flex gap-3">
                <button 
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition"
                >
                Cancelar
                </button>
                <button 
                onClick={handleSave}
                disabled={status === 'saving'}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-500/30 flex items-center gap-2"
                >
                {status === 'saving' ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Guardar
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
