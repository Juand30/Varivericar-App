import React from 'react';
import { Bell, X, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Notification } from '../types';

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {notifications.map((notif) => (
        <div 
          key={notif.id}
          className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 pointer-events-auto animate-slide-in flex items-start gap-3 overflow-hidden relative"
        >
          <div className={`
            flex-shrink-0 rounded-full p-2 
            ${notif.type === 'success' ? 'bg-green-100 text-green-600' : 
              notif.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
              'bg-blue-100 text-blue-600'}
          `}>
            {notif.type === 'success' ? <CheckCircle size={20} /> : 
             notif.type === 'warning' ? <AlertTriangle size={20} /> : 
             <Info size={20} />}
          </div>
          
          <div className="flex-1 mr-6">
            <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
            <p className="text-sm text-gray-600 mt-1 leading-snug">{notif.message}</p>
            <p className="text-xs text-gray-400 mt-2">{new Date(notif.timestamp).toLocaleTimeString()}</p>
          </div>

          <button 
            onClick={() => onDismiss(notif.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;