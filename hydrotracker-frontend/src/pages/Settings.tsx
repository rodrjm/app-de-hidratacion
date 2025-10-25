import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const Settings: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Personaliza tu experiencia de hidratación</p>
        </div>

        <div className="space-y-6">
          <Card title="Preferencias de Usuario">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta diaria de hidratación
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="2000"
                />
              </div>
            </div>
          </Card>

          <Card title="Notificaciones">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Recordatorios</h3>
                  <p className="text-sm text-gray-500">Recibe notificaciones para beber agua</p>
                </div>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Cuenta">
            <div className="space-y-4">
              <Button variant="outline" size="sm">
                Cambiar contraseña
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-300">
                Eliminar cuenta
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
