
import React, { useState, useRef } from 'react';
import { Camera, Save, X, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon, Server } from 'lucide-react';
import { ReportStatus, DamageReport, User } from '../types';
import { analyzeDamageImages } from '../services/geminiService';
import { awsService } from '../services/firebase'; // Nuevo servicio AWS

interface DamageReportFormProps {
  user: User;
  onReportSubmit: (report: DamageReport) => void;
}

const MAX_NOTES_LENGTH = 1000;

const DamageReportForm: React.FC<DamageReportFormProps> = ({ user, onReportSubmit }) => {
  const [technicianName, setTechnicianName] = useState(user.name || '');
  const [licensePlate, setLicensePlate] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [status, setStatus] = useState<ReportStatus>(ReportStatus.IDLE);
  const [aiReport, setAiReport] = useState<string | null>(null);
  
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files);
      const validImages = newFiles.filter(file => file.type.startsWith('image/'));
      
      if (validImages.length < newFiles.length) {
        alert("Algunos archivos no eran imágenes y fueron ignorados.");
      }

      setImages(prev => [...prev, ...validImages]);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // AWS Upload Logic
  const uploadImagesToCloud = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      try {
        const url = await awsService.uploadFile(file);
        urls.push(url);
      } catch (error) {
        console.error("Error uploading file:", file.name, error);
        throw error;
      }
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) return;

    setStatus(ReportStatus.ANALYZING);
    
    try {
        // 1. Analyze with Gemini (Uses local file buffer)
        const analysis = await analyzeDamageImages(images, notes);
        setAiReport(analysis);
        
        setStatus(ReportStatus.SENDING);

        // 2. Upload Images to AWS S3 (or Mock)
        const cloudImageUrls = await uploadImagesToCloud(images);

        // 3. Create Report Object
        const reportId = Date.now().toString(); 
        const newReport: DamageReport = {
          id: reportId,
          technicianName,
          licensePlate,
          notes,
          images: [], 
          awsImageUrls: cloudImageUrls, 
          aiAnalysis: analysis,
          timestamp: Date.now(),
          userEmail: user.email
        };

        // 4. Save Data to AWS DB (or Mock)
        await awsService.saveData('reports', newReport);

        onReportSubmit(newReport);
        setStatus(ReportStatus.SUCCESS);
        
    } catch (error) {
        console.error("Error creating report", error);
        setStatus(ReportStatus.ERROR);
    }
  };

  const resetForm = () => {
    setTechnicianName(user.name || '');
    setLicensePlate('');
    setNotes('');
    setImages([]);
    setStatus(ReportStatus.IDLE);
    setAiReport(null);
  };

  if (status === ReportStatus.SUCCESS) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg mx-auto mt-10 animate-fade-in border border-green-100">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reporte Enviado!</h2>
        <p className="text-gray-600 mb-6">
          Las imágenes y el análisis se han procesado en el backend AWS correctamente.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg text-left mb-6 text-sm text-gray-700 border border-gray-200 shadow-inner">
          <p className="font-semibold text-brand-600 mb-2 flex items-center gap-2">
            <CheckCircle2 size={16} /> Resumen IA Generado:
          </p>
          <p className="italic whitespace-pre-wrap text-gray-600">{aiReport}</p>
        </div>

        <button 
          onClick={resetForm}
          className="w-full bg-brand-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-brand-700 transition shadow-lg shadow-brand-500/30"
        >
          Realizar Nuevo Reporte
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-metal-800 to-metal-900 px-6 py-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Camera className="text-brand-500" />
          Nuevo Reporte (AWS Cloud)
        </h2>
        <p className="text-metal-300 text-sm mt-1">Complete los datos. Se enviarán a la infraestructura segura.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Técnico Responsable</label>
            <input
              type="text"
              required
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition outline-none"
              placeholder="Nombre del técnico"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Matrícula / Patente</label>
            <input
              type="text"
              required
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition outline-none uppercase font-mono"
              placeholder="ABC-123"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">Notas Adicionales</label>
            <span className={`text-xs ${notes.length >= MAX_NOTES_LENGTH ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
              {notes.length} / {MAX_NOTES_LENGTH}
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={MAX_NOTES_LENGTH}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition outline-none resize-none"
            placeholder="Detalles específicos del granizo, zona..."
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Evidencia Fotográfica</label>
          
          <input 
            type="file" 
            ref={galleryInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*" 
            multiple 
          />

          <input 
            type="file" 
            ref={cameraInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*" 
            capture="environment"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => galleryInputRef.current?.click()}
              className="h-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition group text-center"
            >
              <div className="bg-gray-100 p-3 rounded-full mb-3 group-hover:bg-brand-100 transition">
                <ImageIcon className="h-6 w-6 text-gray-500 group-hover:text-brand-600" />
              </div>
              <p className="text-gray-700 font-semibold">Abrir Galería</p>
            </div>

            <div 
              onClick={() => cameraInputRef.current?.click()}
              className="h-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition group text-center"
            >
              <div className="bg-gray-100 p-3 rounded-full mb-3 group-hover:bg-brand-100 transition">
                <Camera className="h-6 w-6 text-gray-500 group-hover:text-brand-600" />
              </div>
              <p className="text-gray-700 font-semibold">Usar Cámara</p>
            </div>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {images.map((file, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="preview" 
                    className="w-full h-full object-cover" 
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition shadow-md"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {status === ReportStatus.ERROR && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
            <AlertCircle size={18} />
            <span>Error al conectar con el servidor. Verifique su conexión a AWS.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={images.length === 0 || status === ReportStatus.ANALYZING || status === ReportStatus.SENDING}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95
            ${images.length === 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 shadow-brand-500/40'
            }`}
        >
          {status === ReportStatus.ANALYZING ? (
            <>
              <Loader2 className="animate-spin" />
              Analizando con Gemini...
            </>
          ) : status === ReportStatus.SENDING ? (
            <>
              <Server className="animate-pulse" />
              Enviando a AWS...
            </>
          ) : (
            <>
              <Save size={20} />
              Analizar y Guardar
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default DamageReportForm;
