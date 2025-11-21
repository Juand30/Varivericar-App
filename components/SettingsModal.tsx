
import React, { useState, useEffect } from 'react';
import { X, Save, Database, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { firebaseConfig } from '../services/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [configJson, setConfigJson] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Load current config
      const stored = localStorage.getItem('varivericar_firebase_config');
      if (stored) {
        setConfigJson(stored); // Keep formatting as is if possible, or just string
      } else {
        setConfigJson(JSON.stringify(firebaseConfig, null, 2));
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    setStatus('saving');
    setErrorMsg('');

    try {
      // 1. Validate JSON
      const parsed = JSON.parse(configJson);
      
      // 2. Validate required fields
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error("Faltan campos obligatorios (apiKey o projectId)");
      }

      // 3. Save
      localStorage.setItem('varivericar_firebase_config', JSON.stringify(parsed));
      setStatus('success');

      // 4. Reload after short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (e) {
      setStatus('error');
      setErrorMsg("El texto no es un JSON válido o tiene errores.");
    }
  };

  const handleReset = () => {
      if(window.confirm("¿Estás seguro? Se borrará tu configuración personalizada y se usará la por defecto.")) {
          localStorage.removeItem('varivericar_firebase_config');
          window.location.reload();
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-metal-900 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-lg">
              <Database size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Configuración de Firebase</h3>
              <p className="text-xs text-gray-400">Conecta la app a tu base de datos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                 <CheckCircle2 size={32} />
               </div>
               <h4 className="text-xl font-bold text-gray-900">¡Configuración Guardada!</h4>
               <p className="text-gray-600 mt-2">La aplicación se reiniciará automáticamente para aplicar los cambios...</p>
               <RefreshCw className="animate-spin mt-4 text-brand-500" />
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-800 flex gap-3">
                <div className="mt-0.5"><Database size={16} /></div>
                <div>
                  <p className="font-bold mb-1">Instrucciones:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-blue-700">
                    <li>Ve a tu <b>Consola de Firebase</b> &gt; Configuración del Proyecto.</li>
                    <li>Baja hasta la sección "Tus apps".</li>
                    <li>Selecciona la opción "Configurar SDK" o "NPM".</li>
                    <li>Copia el objeto que está dentro de <code>const firebaseConfig = &#123; ... &#125;;</code></li>
                    <li>Pega ese código (solo lo que está entre llaves) abajo.</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Objeto de Configuración (JSON)</label>
                <textarea 
                  value={configJson}
                  onChange={(e) => setConfigJson(e.target.value)}
                  className="w-full h-64 font-mono text-xs bg-metal-900 text-green-400 p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 outline-none shadow-inner resize-none"
                  placeholder={`{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "..."
}`}
                />
                <p className="text-xs text-gray-500 text-right">Asegúrate de que las comillas y las comas estén bien.</p>
              </div>

              {status === 'error' && (
                <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-slide-in">
                  <AlertTriangle size={16} />
                  {errorMsg}
                </div>
              )}
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
                Restaurar Original
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
                className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition shadow-lg shadow-brand-500/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                {status === 'saving' ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Guardar y Reiniciar
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
