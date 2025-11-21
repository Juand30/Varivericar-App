
import React from 'react';
import { Menu, ShieldCheck, Image as ImageIcon, LogOut, Users, X, Home, Settings, Hammer } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  currentView: 'home' | 'gallery' | 'users';
  onChangeView: (view: 'home' | 'gallery' | 'users') => void;
  onOpenSettings: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, currentView, onChangeView, onOpenSettings }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navButtonClass = (view: string) => 
    `px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${currentView === view ? 'bg-metal-800 text-white' : 'text-gray-300 hover:bg-metal-800 hover:text-white'}`;

  return (
    <nav className="bg-metal-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre (Con enlace externo) */}
          <a 
            href="https://varibericar.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            title="Visitar sitio web de Varivericar"
          >
            <div className="flex-shrink-0 bg-white p-1.5 rounded-lg">
              <Hammer className="h-6 w-6 text-brand-600" />
            </div>
            <span className="ml-2 text-xl font-bold tracking-tight text-white">Varivericar</span>
          </a>
          
          {user && (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <button onClick={() => onChangeView('home')} className={navButtonClass('home')}>
                  <Home size={16} /> Inicio
                </button>
                <button onClick={() => onChangeView('gallery')} className={navButtonClass('gallery')}>
                  <ImageIcon size={16} /> Galería
                </button>
                
                {user.role === 'ADMIN' && (
                  <button onClick={() => onChangeView('users')} className={navButtonClass('users')}>
                    <Users size={16} /> Usuarios
                  </button>
                )}
              </div>
              
              <div className="h-6 w-px bg-metal-700 mx-2"></div>
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400 capitalize flex justify-end items-center gap-1">
                    {user.role === 'ADMIN' && <ShieldCheck size={12} className="text-brand-400" />}
                    {user.role === 'ADMIN' ? 'Admin' : 'Técnico'}
                  </p>
                </div>
                
                <button 
                  onClick={onOpenSettings}
                  className="p-2 rounded-full hover:bg-metal-800 hover:text-white transition text-gray-400"
                  title="Configuración de Conexión"
                >
                  <Settings size={20} />
                </button>

                <button 
                  onClick={onLogout}
                  className="p-2 rounded-full hover:bg-red-500/20 hover:text-red-400 transition text-gray-400"
                  title="Cerrar Sesión"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          )}

          <div className="-mr-2 flex md:hidden">
            {user && (
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden bg-metal-800 pb-4 animate-slide-in">
           <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => {onChangeView('home'); setMobileMenuOpen(false)}} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-metal-700 flex items-center gap-2">
                <Home size={18} /> Inicio
              </button>
              <button onClick={() => {onChangeView('gallery'); setMobileMenuOpen(false)}} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-metal-700 hover:text-white flex items-center gap-2">
                <ImageIcon size={18} /> Galería
              </button>
              {user.role === 'ADMIN' && (
                <button onClick={() => {onChangeView('users'); setMobileMenuOpen(false)}} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-metal-700 hover:text-white flex items-center gap-2">
                  <Users size={18} /> Gestión de Usuarios
                </button>
              )}
              <button onClick={() => {onOpenSettings(); setMobileMenuOpen(false)}} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-brand-400 hover:bg-metal-700 hover:text-white flex items-center gap-2">
                <Settings size={18} /> Configurar Conexión
              </button>
              <button onClick={onLogout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-metal-700 hover:text-red-300 mt-4 border-t border-metal-700 flex items-center gap-2">
                <LogOut size={18} /> Cerrar Sesión
              </button>
           </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
