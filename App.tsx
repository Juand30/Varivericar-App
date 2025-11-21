
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DamageReportForm from './components/DamageReportForm';
import ChatBot from './components/ChatBot';
import Login from './components/Login';
import Gallery from './components/Gallery';
import UserManagement from './components/UserManagement';
import NotificationSystem from './components/NotificationSystem';
import SettingsModal from './components/SettingsModal';
import { Smartphone, Zap, CheckCircle, Wifi, WifiOff, Server } from 'lucide-react';
import { User, DamageReport, Notification } from './types';
import { awsService } from './services/firebase'; // Importamos el nuevo servicio AWS

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'gallery' | 'users'>('home');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // --- Estados de Datos ---
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<DamageReport[]>([]);

  // --- Polling para simular tiempo real o actualizar datos de API AWS ---
  const fetchData = useCallback(async () => {
    try {
      const usersData = await awsService.getData('users');
      setUsers(usersData);

      const reportsData = await awsService.getData('reports');
      // Ordenar por fecha descendente
      reportsData.sort((a: DamageReport, b: DamageReport) => b.timestamp - a.timestamp);
      setReports(reportsData);
    } catch (error) {
      console.error("Error fetching data from AWS/Mock:", error);
    }
  }, []);

  // Cargar datos iniciales y configurar intervalo
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- Listeners de Red ---
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addNotification({
        id: Date.now().toString(),
        title: 'Conexión Restaurada',
        message: 'Conectado a Internet.',
        type: 'success',
        timestamp: Date.now()
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      addNotification({
        id: Date.now().toString(),
        title: 'Sin Conexión',
        message: 'Modo offline activado.',
        type: 'warning',
        timestamp: Date.now()
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
    setCurrentView('home'); 
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setTimeout(() => {
      dismissNotification(notification.id);
    }, 5000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- User Management Logic (AWS Service) ---
  const handleAddUser = async (newUser: User) => {
    try {
      await awsService.saveData('users', newUser);
      fetchData(); // Refrescar inmediato
      addNotification({
        id: Date.now().toString(),
        title: 'Usuario Guardado',
        message: `El usuario ${newUser.email} ha sido registrado.`,
        type: 'success',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error adding user", error);
      addNotification({
        id: Date.now().toString(),
        title: 'Error',
        message: 'No se pudo guardar en AWS.',
        type: 'warning',
        timestamp: Date.now()
      });
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await awsService.saveData('users', updatedUser);
      fetchData();
      addNotification({
        id: Date.now().toString(),
        title: 'Usuario Actualizado',
        message: `Datos sincronizados.`,
        type: 'success',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error updating user", error);
    }
  };

  const handleDeleteUser = async (email: string) => {
    try {
      const userToDelete = users.find(u => u.email === email);
      if (userToDelete && userToDelete.id) {
        await awsService.deleteData('users', userToDelete.id);
        fetchData();
        addNotification({
          id: Date.now().toString(),
          title: 'Usuario Eliminado',
          message: `Acceso revocado para ${email}.`,
          type: 'warning',
          timestamp: Date.now()
        });
      }
    } catch (error) {
       console.error("Error deleting user", error);
    }
  };

  const handleReportSubmit = (report: DamageReport) => {
    fetchData(); // Actualizar lista de reportes
    addNotification({
      id: Date.now().toString(),
      title: 'Reporte Enviado',
      message: `Reporte para ${report.licensePlate} procesado exitosamente.`,
      type: 'success',
      timestamp: Date.now()
    });
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await awsService.deleteData('reports', reportId);
      fetchData();
      addNotification({
        id: Date.now().toString(),
        title: 'Reporte Eliminado',
        message: 'El reporte ha sido eliminado del sistema.',
        type: 'warning',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error deleting report", error);
    }
  };

  const handleChatNotification = (text: string) => {
    const notif: Notification = {
      id: Date.now().toString(),
      title: 'Nuevo mensaje de Soporte',
      message: text,
      type: 'info',
      timestamp: Date.now()
    };
    addNotification(notif);
  };

  const getVisibleReports = () => {
    if (!user) return [];
    if (user.role === 'ADMIN') return reports;
    return reports.filter(r => r.userEmail === user.email);
  };

  if (!user) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <NotificationSystem notifications={notifications} onDismiss={dismissNotification} />
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {!isOnline && (
        <div className="bg-yellow-500 text-white text-xs text-center py-1 flex items-center justify-center gap-2">
          <WifiOff size={12} /> Estás desconectado. Verificando conexión a AWS...
        </div>
      )}

      <Navbar 
        user={user} 
        onLogout={() => setUser(null)} 
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-grow">
        {currentView === 'home' && (
          <>
            <section className="bg-metal-900 text-white pb-20 pt-10 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
                    Gestión Inteligente de <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-300">
                      Daños por Granizo
                    </span>
                  </h1>
                  <p className="text-lg text-gray-300 mb-8">
                    Plataforma corporativa AWS. Captura, analiza con IA y gestiona reportes escalables.
                  </p>
                  
                  <div className="flex justify-center gap-6 text-sm font-medium text-gray-400">
                    <div className="flex items-center gap-2">
                      <Smartphone size={18} className="text-brand-500" />
                      <span>Mobile First</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap size={18} className="text-yellow-500" />
                      <span>Análisis IA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Server size={18} className="text-orange-500" />
                      <span>AWS Cloud</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-20">
                   <DamageReportForm user={user} onReportSubmit={handleReportSubmit} />
                </div>
              </div>
            </section>

            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                    <Smartphone className="text-brand-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Captura Móvil</h3>
                  <p className="text-gray-600">Sube fotos directamente a S3. Tus datos están seguros en la infraestructura de AWS.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Análisis Gemini IA</h3>
                  <p className="text-gray-600">Nuestra IA pre-analiza las imágenes para sugerir la gravedad del daño automáticamente.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
                    <Server className="text-orange-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Backend AWS</h3>
                  <p className="text-gray-600">Arquitectura preparada para escalar usando API Gateway, Lambda y DynamoDB.</p>
                </div>
              </div>
            </section>
          </>
        )}

        {currentView === 'gallery' && (
          <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[80vh]">
             <Gallery 
               reports={getVisibleReports()} 
               user={user}
               onDeleteReport={handleDeleteReport}
             />
          </section>
        )}

        {currentView === 'users' && user.role === 'ADMIN' && (
          <UserManagement 
            users={users} 
            onAddUser={handleAddUser} 
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            currentUserEmail={user.email}
          />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Varivericar Systems. Todos los derechos reservados.</p>
          <p className="mt-2 text-xs text-gray-400">Powered by Gemini API & Amazon Web Services</p>
        </div>
      </footer>

      <ChatBot onMessageReceived={handleChatNotification} />
    </div>
  );
}

export default App;
