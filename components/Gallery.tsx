
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, User as UserIcon, ImageIcon, X, ChevronLeft, ChevronRight, Trash2, FileText, ZoomIn, ZoomOut, RotateCcw, CloudDownload, ShieldAlert, AlertTriangle } from 'lucide-react';
import { DamageReport, User } from '../types';

interface GalleryProps {
  reports: DamageReport[];
  user: User;
  onDeleteReport: (id: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ reports, user, onDeleteReport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Estados para Zoom y Panning
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = 
        report.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = filterDate 
        ? new Date(report.timestamp).toISOString().slice(0, 10) === filterDate
        : true;

      return matchesSearch && matchesDate;
    });
  }, [reports, searchTerm, filterDate]);

  // Helper to get the correct image URL
  const getImageUrl = (report: DamageReport, index: number): string => {
    // 1. Cloud Storage (AWS S3) - Priority
    if (report.awsImageUrls && report.awsImageUrls[index]) {
        return report.awsImageUrls[index];
    }
    // 2. Runtime Preview (Current Session)
    if (report.imagePreviewUrls && report.imagePreviewUrls[index]) {
        return report.imagePreviewUrls[index];
    }
    // 3. Legacy Fallback
    if (report.images && report.images[index] instanceof File) {
         return URL.createObjectURL(report.images[index]);
    }
    return '';
  };

  // Helper to get count
  const getImageCount = (report: DamageReport) => {
      if (report.awsImageUrls?.length) return report.awsImageUrls.length;
      if (report.imagePreviewUrls?.length) return report.imagePreviewUrls.length;
      if (report.images?.length) return report.images.length;
      return 0;
  };

  // Resetear posición al cambiar imagen
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setZoomLevel(1);
  }, [selectedImageIndex]);

  const openReport = (report: DamageReport) => {
    setSelectedReport(report);
    setSelectedImageIndex(0);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setShowDeleteConfirm(false);
  };

  const closeReport = () => {
    setSelectedReport(null);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setShowDeleteConfirm(false);
  };

  const nextImage = () => {
    if (!selectedReport) return;
    const count = getImageCount(selectedReport);
    if (count === 0) return;
    setSelectedImageIndex((prev) => (prev + 1) % count);
  };

  const prevImage = () => {
    if (!selectedReport) return;
    const count = getImageCount(selectedReport);
    if (count === 0) return;
    setSelectedImageIndex((prev) => (prev - 1 + count) % count);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 1));
  const handleZoomReset = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleDownloadImage = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!selectedReport) return;
    
    try {
      const imageUrl = getImageUrl(selectedReport, selectedImageIndex);
      
      // Fetch image to create a blob for forced download
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Evidencia-${selectedReport.licensePlate}-${selectedImageIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
      console.error("Error descarga:", error);
      // Fallback for basic download attribute or new tab
      const link = document.createElement('a');
      link.href = getImageUrl(selectedReport, selectedImageIndex);
      link.download = `Evidencia-${selectedReport.licensePlate}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedReport) return;
    onDeleteReport(selectedReport.id);
    closeReport();
  };

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <ImageIcon className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No hay reportes aún</h3>
        <p className="text-gray-500">Los reportes se cargarán desde el backend.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Barra de Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Galería de Inspecciones</h2>
          <span className="bg-brand-100 text-brand-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {filteredReports.length} Resultados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por placa, técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
            />
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm text-gray-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setSearchTerm(''); setFilterDate(''); }}
              className="text-sm text-brand-600 font-medium hover:text-brand-700 px-4 py-2 hover:bg-brand-50 rounded-lg transition"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => {
          const thumbUrl = getImageUrl(report, 0);
          const imgCount = getImageCount(report);
          
          return (
            <div 
              key={report.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group relative cursor-pointer"
              onClick={() => openReport(report)}
            >
              {/* Image Preview */}
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {thumbUrl ? (
                  <img 
                    src={thumbUrl} 
                    alt={`Reporte ${report.licensePlate}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <ImageIcon size={32} />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10">
                  {imgCount} Fotos
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-gray-900">{report.licensePlate}</h3>
                  <span className="text-xs text-gray-500">{new Date(report.timestamp).toLocaleDateString()}</span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <UserIcon size={14} className="text-brand-500" />
                    <span>{report.technicianName}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Análisis IA</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{report.aiAnalysis || "Pendiente de análisis..."}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredReports.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No se encontraron reportes con estos criterios.
        </div>
      )}

      {/* MODAL DE DETALLE DE REPORTE */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col md:flex-row animate-scale-up">
            
            {/* Sección de Imagen */}
            <div className="w-full md:w-3/4 bg-black relative flex items-center justify-center overflow-hidden group flex-1 min-h-0 select-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black">
               {getImageCount(selectedReport) > 0 ? (
                 <div 
                    className="w-full h-full flex items-center justify-center overflow-hidden"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                 >
                   <img 
                     src={getImageUrl(selectedReport, selectedImageIndex)} 
                     alt="Full view"
                     draggable={false}
                     style={{ 
                       transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`, 
                       transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                       maxWidth: '100%',
                       maxHeight: '100%',
                       pointerEvents: 'none'
                      }}
                     className="object-contain"
                   />
                 </div>
               ) : (
                 <div className="text-gray-500">Sin imágenes</div>
               )}

               {/* Controles de Zoom */}
               <div className="absolute top-4 left-1/2 -translate-x-1/2 md:top-auto md:bottom-6 md:left-auto md:right-6 md:translate-x-0 flex gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 z-20 shadow-lg">
                  <button onClick={handleZoomOut} className="p-2 text-white hover:bg-white/20 rounded-full transition" title="Alejar">
                    <ZoomOut size={18} />
                  </button>
                  <span className="text-white text-xs font-mono flex items-center w-10 justify-center">{Math.round(zoomLevel * 100)}%</span>
                  <button onClick={handleZoomIn} className="p-2 text-white hover:bg-white/20 rounded-full transition" title="Acercar">
                    <ZoomIn size={18} />
                  </button>
                  <div className="w-px bg-white/20 mx-1"></div>
                  <button onClick={handleZoomReset} className="p-2 text-white hover:bg-white/20 rounded-full transition" title="Resetear">
                    <RotateCcw size={16} />
                  </button>
               </div>
               
               {/* Navegación */}
               {getImageCount(selectedReport) > 1 && (
                 <>
                   <button 
                     onClick={(e) => { e.stopPropagation(); prevImage(); }}
                     className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition z-20 border border-white/10 shadow-lg"
                   >
                     <ChevronLeft size={24} />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); nextImage(); }}
                     className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition z-20 border border-white/10 shadow-lg"
                   >
                     <ChevronRight size={24} />
                   </button>
                   <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 rounded-full text-white text-xs border border-white/10 backdrop-blur-sm z-20 font-medium">
                     {selectedImageIndex + 1} / {getImageCount(selectedReport)}
                   </div>
                 </>
               )}
               
               <button 
                 onClick={closeReport}
                 className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white md:hidden hover:bg-black/60 z-30 border border-white/10"
               >
                 <X size={20} />
               </button>
            </div>

            {/* Sección de Datos (Sidebar) */}
            <div className="w-full md:w-1/4 flex flex-col bg-white h-[40vh] md:h-full border-l border-gray-200 shadow-[-5px_0_15px_rgba(0,0,0,0.05)] relative z-30">
              {/* Header Sidebar */}
              <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">{selectedReport.licensePlate}</h3>
                  <p className="text-xs text-gray-500">{new Date(selectedReport.timestamp).toLocaleString()}</p>
                </div>
                <button onClick={closeReport} className="text-gray-400 hover:text-gray-600 hidden md:block">
                  <X size={24} />
                </button>
              </div>

              {/* Contenido Scrolleable */}
              <div className="p-4 md:p-5 overflow-y-auto flex-grow space-y-6 custom-scrollbar min-h-0">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Técnico</h4>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-brand-100 p-2 rounded-full text-brand-600">
                      <UserIcon size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-gray-900 truncate">{selectedReport.technicianName}</p>
                      <p className="text-xs text-gray-500 truncate">{selectedReport.userEmail}</p>
                    </div>
                  </div>
                </div>

                {selectedReport.notes && (
                  <div>
                     <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notas</h4>
                     <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                       "{selectedReport.notes}"
                     </p>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText size={14} /> Resumen IA
                  </h4>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                     {selectedReport.aiAnalysis}
                  </div>
                </div>
              </div>
              
              {/* Footer con acciones para Admin */}
              {user.role === 'ADMIN' && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col gap-3 mt-auto flex-shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-20">
                   <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert size={14} className="text-brand-600" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Zona Admin (AWS)</span>
                   </div>
                   
                   <button 
                    type="button"
                    onClick={handleDownloadImage}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg text-sm font-bold hover:bg-gray-100 transition shadow-sm active:scale-[0.98]"
                    title="Descargar imagen al dispositivo"
                   >
                    <CloudDownload size={18} className="text-blue-600" />
                    Descargar Imagen
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                    className="w-full py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold transition flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg active:scale-[0.98]"
                    title="Eliminar este reporte permanentemente"
                  >
                    <Trash2 size={18} /> 
                    Eliminar Reporte
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACION BORRADO */}
      {showDeleteConfirm && selectedReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-50 p-6 flex justify-center border-b border-red-100">
               <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center shadow-inner border border-red-200 animate-pulse">
                  <AlertTriangle size={40} className="text-red-600" />
               </div>
            </div>
            
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Reporte?</h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                Se enviará la orden de borrado a la base de datos AWS.
              </p>

              <div className="flex justify-center mb-6">
                 <span className="text-3xl font-black text-gray-800 bg-gray-100 px-6 py-3 rounded-lg border-2 border-gray-300 font-mono tracking-widest uppercase shadow-inner">
                    {selectedReport.licensePlate}
                 </span>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 px-4 bg-white text-gray-700 font-bold rounded-xl border border-gray-300 hover:bg-gray-50 transition shadow-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
