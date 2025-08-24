import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Notification({ message, type, duration = 5000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '💬';
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-600 text-green-200';
      case 'error':
        return 'bg-red-900/90 border-red-600 text-red-200';
      case 'info':
        return 'bg-blue-900/90 border-blue-600 text-blue-200';
      default:
        return 'bg-gray-900/90 border-gray-600 text-gray-200';
    }
  };

  return (
    <div
      className={cn(
        'fixed top-20 right-4 z-[60] max-w-sm w-full p-4 rounded-lg border shadow-2xl backdrop-blur-sm transition-all duration-300',
        getStyles(),
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Notification manager hook
export function useNotification() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
  }>>([]);

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info', duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type, duration }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message: string, duration?: number) => addNotification(message, 'success', duration);
  const showError = (message: string, duration?: number) => addNotification(message, 'error', duration);
  const showInfo = (message: string, duration?: number) => addNotification(message, 'info', duration);

  return {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
  };
}

// Notification container component
export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  );
}
