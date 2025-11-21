
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DamageReportForm from './components/DamageReportForm';
import ChatBot from './components/ChatBot';
import Login from './components/Login';
import Gallery from './components/Gallery';
import UserManagement from './components/UserManagement';
import NotificationSystem from './components/NotificationSystem';
import SettingsModal from './components/SettingsModal';
import { Smartphone, Zap, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { User, DamageReport, Notification } from './types';
import { db } from './services/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'gallery' | 'users'>('home');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // --- Estados de Datos (Sincronizados con Firebase) ---
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<DamageReport[]>([]);

  // --- Listeners de Red ---
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addNotification({
        id: Date.now().toString(),
        title: 'Conexión Restaurada',
        message: 'Estás conectado a la nube nuevamente.',
        type: 'success',
        timestamp: Date.now()
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      addNotification({
        id: Date.now().toString(),
        title: 'Sin Conexión',
        message: 'Modo offline. Los datos no se sincronizarán hasta recuperar conexión.',
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

  // --- Firebase: Sincronización de Usuarios ---
  useEffect(() => {
    try {
      // Escucha cambios en la colección 'users' en tiempo real
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData: User[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        
        // Si no hay usuarios (DB vacía), creamos el admin por defecto
        if (usersData.length === 0) {
           const defaultAdmin: User = {
             name: 'Admin Principal',
             email: 'juandp2290@gmail.com',
             password: 'admin123', 
             role: 'ADMIN'
           };
           // Intentamos crear el admin. Si falla (por reglas), no pasa nada, el usuario tendrá que configurar Firebase.
           addDoc(collection(db, 'users'), defaultAdmin).catch(e => console.warn("Esperando configuración de DB..."));
        } else {
           setUsers(usersData);
        }
      }, (error) => {
        console.error("Error syncing users:", error);
        if (error.code === 'permission-denied') {
            addNotification({
                id: 'auth-err',
                title: 'Error de Permisos',
                message: 'Configura las Reglas de Firestore en la consola de Firebase.',
                type: 'warning',
                timestamp: Date.now()
            });
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase config error likely:", e);
    }
  }, []);

  // --- Firebase: Sincronización de Reportes ---
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, 'reports'), (snapshot) => {
        const reportsData: DamageReport[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as DamageReport));
        
        // Ordenar por fecha (más reciente primero)
        reportsData.sort((a, b) => b.timestamp - a.timestamp);
        setReports(reportsData);
      }, (error) => {
        console.error("Error syncing reports:", error);
      });
      return () => unsubscribe();
    } catch (e) { console.error(e); }
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

  // --- User Management Logic (Firestore) ---
  const handleAddUser = async (newUser: User) => {
    try {
      // Elimina ID temporal si existe, Firestore crea el suyo
      const { id, ...userData } = newUser;
      await addDoc(collection(db, 'users'), userData);
      
      addNotification({
        id: Date.now().toString(),
        title: 'Usuario Creado en Nube',
        message: `El usuario ${newUser.email} ha sido añadido a la base de datos.`,
        type: 'success',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error adding user", error);
      addNotification({
        id: Date.now().toString(),
        title: 'Error',
        message: 'No se pudo crear el usuario en Firebase.',
        type: 'warning',
        timestamp: Date.now()
      });
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (!updatedUser.id) return;
    try {
      const userRef = doc(db, 'users', updatedUser.id);
      // No enviamos el ID dentro de los datos
      const { id, ...data } = updatedUser;
      await updateDoc(userRef, data);

      addNotification({
        id: Date.now().toString(),
        title: 'Usuario Actualizado',
        message: `Datos sincronizados en la nube.`,
        type: 'success',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error updating user", error);
    }
  };

  const handleDeleteUser = async (email: string) => {
    try {
      // Buscar el usuario por email para obtener su ID (si no lo tenemos a mano en este contexto)
      const userToDelete = users.find(u => u.email === email);
      if (userToDelete && userToDelete.id) {
        await deleteDoc(doc(db, 'users', userToDelete.id));
        
        addNotification({
          id: Date.now().toString(),
          title: 'Usuario Eliminado',
          message: `Acceso revocado en la nube para ${email}.`,
          type: 'warning',
          timestamp: Date.now()
        });
      }
    } catch (error) {
       console.error("Error deleting user", error);
    }
  };

  const handleReportSubmit = (report: DamageReport) => {
    // El componente DamageReportForm ya maneja la subida a Firebase.
    // Aquí solo notificamos éxito visualmente.
    addNotification({
      id: Date.now().toString(),
      title: 'Reporte Sincronizado',
      message: `Reporte para ${report.licensePlate} guardado en la nube.`,
      type: 'success',
      timestamp: Date.now()
    });
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      addNotification({
        id: Date.now().toString(),
        title: 'Reporte Eliminado',
        message: 'El reporte ha sido eliminado de la base de datos.',
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
    // Pasamos un handler vacío para settings si estamos en login, o podríamos añadir un botón en login también.
    // Para simplificar, dejamos el login como está, pero si falla la carga de usuarios (porque no hay config),
    // el usuario admin por defecto (juandp2290) debería funcionar si lo hardcodeamos en Login para emergencias.
    return <Login users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <NotificationSystem notifications={notifications} onDismiss={dismissNotification} />
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Online/Offline Indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-xs text-center py-1 flex items-center justify-center gap-2">
          <WifiOff size={12} /> Estás desconectado. Los cambios se guardarán localmente hasta recuperar conexión.
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
                    Plataforma corporativa Varivericar. Captura, analiza con IA y gestiona reportes en la nube.
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
                      <CheckCircle size={18} className="text-green-500" />
                      <span>Firebase Cloud</span>
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
                  <p className="text-gray-600">Sube fotos directamente a la nube. Tus datos están seguros y accesibles desde cualquier dispositivo.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Análisis Gemini IA</h3>
                  <p className="text-gray-600">Nuestra IA pre-analiza las imágenes para sugerir la gravedad del daño automáticamente.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                    <Wifi className="text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Sincronización Real</h3>
                  <p className="text-gray-600">Si haces un reporte en el móvil, aparece instantáneamente en la web del administrador.</p>
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
          <p className="mt-2 text-xs text-gray-400">Powered by Google Gemini API & Firebase</p>
        </div>
      </footer>

      <ChatBot onMessageReceived={handleChatNotification} />
    </div>
  );
}

export default App;
