import React from 'react';
import { AlertCircle, UserX, Lock, Wifi, Server } from 'lucide-react';

interface ErrorAlertProps {
  error: string;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, className = '' }) => {
  // Función para determinar el tipo de error y el icono correspondiente
  const getErrorInfo = (error: string) => {
    if (error.includes('Usuario no encontrado') || error.includes('usuario no existe')) {
      return {
        icon: UserX,
        type: 'user-not-found',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        title: 'Usuario no encontrado'
      };
    } else if (error.includes('Contraseña incorrecta') || error.includes('contraseña incorrecta')) {
      return {
        icon: Lock,
        type: 'wrong-password',
        color: 'text-error-600',
        bgColor: 'bg-error-50',
        borderColor: 'border-error-200',
        title: 'Contraseña incorrecta'
      };
    } else if (error.includes('Error de conexión') || error.includes('internet')) {
      return {
        icon: Wifi,
        type: 'connection-error',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        title: 'Error de conexión'
      };
    } else if (error.includes('Error del servidor') || error.includes('servidor')) {
      return {
        icon: Server,
        type: 'server-error',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        title: 'Error del servidor'
      };
    } else {
      return {
        icon: AlertCircle,
        type: 'general-error',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        title: 'Error de autenticación'
      };
    }
  };

  const errorInfo = getErrorInfo(error);
  const IconComponent = errorInfo.icon;

  return (
    <div className={`${errorInfo.bgColor} ${errorInfo.borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <IconComponent className={`w-5 h-5 ${errorInfo.color} mt-0.5 mr-3 flex-shrink-0`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${errorInfo.color} mb-1`}>
            {errorInfo.title}
          </p>
          <p className={`text-sm ${errorInfo.color} opacity-90`}>
            {error}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;

