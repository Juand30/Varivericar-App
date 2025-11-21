
import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { Plus, Trash2, Shield, User as UserIcon, Save, X, Pencil } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (email: string) => void;
  currentUserEmail: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, currentUserEmail }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('USER');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('USER');
    setEditingId(null);
    setIsFormOpen(false);
  };

  const startAdding = () => {
    resetForm();
    setIsFormOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const startEditing = (user: User) => {
    setName(user.name || '');
    setEmail(user.email);
    setPassword(user.password || '');
    setRole(user.role);
    setEditingId(user.id || '');
    setIsFormOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (editingId) {
        // Update existing
        const updatedUser: User = {
            id: editingId,
            name,
            email,
            password,
            role
        };
        onUpdateUser(updatedUser);
    } else {
        // Add new
        const newUser: User = {
            id: Date.now().toString(),
            name,
            email,
            password,
            role
        };
        onAddUser(newUser);
    }
    
    resetForm();
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-500">Administra credenciales y accesos al sistema.</p>
        </div>
        
        {!isFormOpen && (
            <button 
            onClick={startAdding}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-lg shadow-brand-500/30"
            >
            <Plus size={20} />
            Nuevo Usuario
            </button>
        )}
      </div>

      {isFormOpen && (
        <div ref={formRef} className="bg-white p-6 rounded-xl shadow-lg border border-brand-100 mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-brand-700">
                {editingId ? <Pencil size={20} /> : <UserIcon size={20} />} 
                {editingId ? 'Editar Usuario' : 'Agregar Nuevo Miembro'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
              </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                required 
                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña segura"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol de Sistema</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-brand-500 outline-none"
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
              >
                <option value="USER" className="text-gray-900 bg-white">Técnico (Usuario)</option>
                <option value="ADMIN" className="text-gray-900 bg-white">Administrador</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  Cancelar
              </button>
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
                <Save size={18} /> {editingId ? 'Actualizar' : 'Guardar'} Usuario
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contraseña</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.email} className={`hover:bg-gray-50 transition ${editingId === user.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'ADMIN' ? 'Administrador' : 'Técnico'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                    {user.password}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                    <button
                        onClick={() => startEditing(user)}
                        className="text-blue-500 hover:text-blue-700 transition p-2 hover:bg-blue-50 rounded-full"
                        title="Editar Usuario"
                    >
                        <Pencil size={18} />
                    </button>
                    
                    {user.email !== currentUserEmail && user.email !== 'juandp2290@gmail.com' && (
                      <button 
                        onClick={() => onDeleteUser(user.email)}
                        className="text-red-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-full"
                        title="Eliminar Usuario"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    {(user.email === currentUserEmail || user.email === 'juandp2290@gmail.com') && (
                         <div className="w-8 h-8"></div> // Spacer to align columns if delete button is hidden
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
