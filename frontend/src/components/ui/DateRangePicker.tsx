import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  onDateRangeChange: (range: DateRange) => void;
  onClose: () => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
  onClose,
  className = ''
}) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Establecer fechas por defecto (últimos 30 días)
  React.useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const handleApply = () => {
    if (dateFrom && dateTo) {
      onDateRangeChange({
        from: dateFrom,
        to: dateTo
      });
      onClose();
    }
  };

  const handleQuickSelect = (days: number) => {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - days);

    setDateFrom(fromDate.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  const isValidRange = dateFrom && dateTo && dateFrom <= dateTo;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <Card className="w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Seleccionar Período
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Selectores de fecha */}
          <div className="space-y-4">
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio
              </label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de fin
              </label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Selección rápida */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-3">
              Selección rápida
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(7)}
                className="text-xs"
              >
                Últimos 7 días
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(30)}
                className="text-xs"
              >
                Últimos 30 días
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(90)}
                className="text-xs"
              >
                Últimos 90 días
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(365)}
                className="text-xs"
              >
                Último año
              </Button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleApply}
              disabled={!isValidRange}
              className="flex-1"
            >
              Aplicar
            </Button>
          </div>

          {/* Información de validación */}
          {!isValidRange && dateFrom && dateTo && (
            <div className="text-sm text-red-600 text-center">
              La fecha de inicio debe ser anterior o igual a la fecha de fin
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DateRangePicker;

