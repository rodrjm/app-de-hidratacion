import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, TrendingUp, BarChart3, PieChart, Download, Lock, ArrowUp, ArrowDown, Clock, Droplets } from 'lucide-react';
import { useConsumosStore } from '@/store/consumosStore';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { exportService } from '@/services/export';
import { toast } from 'react-hot-toast';
import { consumosService } from '@/services/consumos';
import { Consumo } from '@/types';

const Statistics: React.FC = () => {
  const { user } = useAuthStore();
  const {
    estadisticas,
    tendencias,
    insights,
    isLoading,
    error,
    fetchEstadisticas,
    fetchTendencias,
    fetchInsights
  } = useConsumosStore();

  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('daily');
  const [isExporting, setIsExporting] = useState(false);
  const [periodConsumos, setPeriodConsumos] = useState<Consumo[]>([]);

  // Utilidad: formatear fecha local YYYY-MM-DD (sin convertir a UTC)
  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Función para calcular fechas según el período (usando zona horaria local)
  const getPeriodDates = (period: 'daily' | 'weekly' | 'monthly' | 'annual') => {
    const today = new Date();
    const fechaFin = new Date(today);
    fechaFin.setHours(23, 59, 59, 999);
    
    let fechaInicio = new Date(today);
    
    if (period === 'daily') {
      fechaInicio.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      fechaInicio.setDate(today.getDate() - 6);
      fechaInicio.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      fechaInicio.setDate(today.getDate() - 29);
      fechaInicio.setHours(0, 0, 0, 0);
    } else if (period === 'annual') {
      fechaInicio.setDate(today.getDate() - 364);
      fechaInicio.setHours(0, 0, 0, 0);
    }
    
    return {
      fechaInicio: formatLocalDate(fechaInicio),
      fechaFin: formatLocalDate(fechaFin)
    };
  };

  // Función para obtener el subtítulo del gráfico según el período
  const getProgressSubtitle = (period: 'daily' | 'weekly' | 'monthly' | 'annual') => {
    if (period === 'daily') {
      return 'Hidratación por bloques de 3 horas';
    } else if (period === 'weekly') {
      return 'Hidratación por día de la semana';
    } else if (period === 'monthly') {
      return 'Hidratación por semana';
    } else if (period === 'annual') {
      return 'Hidratación por mes';
    }
    return '';
  };

  // Función para obtener el subtítulo de tendencias según el período
  const getTrendsSubtitle = (period: 'daily' | 'weekly' | 'monthly' | 'annual') => {
    if (period === 'daily') {
      return 'Comparación día actual vs día anterior';
    } else if (period === 'weekly') {
      return 'Comparación semana actual vs anterior';
    } else if (period === 'monthly') {
      return 'Comparación mes actual vs anterior';
    } else if (period === 'annual') {
      return 'Comparación año actual vs anterior';
    }
    return '';
  };

  useEffect(() => {
    // Pasar fecha local de hoy para evitar desfases por UTC en el backend
    const todayLocal = formatLocalDate(new Date());
    fetchEstadisticas(todayLocal);
    fetchTendencias(selectedPeriod);
    if (user?.es_premium) {
      fetchInsights(30);
    }
    
    // Cargar consumos según el período seleccionado
    const { fechaInicio, fechaFin } = getPeriodDates(selectedPeriod);
    consumosService.getConsumos(1, 1000, { fecha_inicio: fechaInicio, fecha_fin: fechaFin })
      .then(resp => {
        const consumos = resp.results || [];
        // Filtro defensivo en el cliente para evitar arrastre de otro día si el backend trae fuera de rango
        let filtered = consumos;
        if (selectedPeriod === 'daily') {
          const todayLocal = formatLocalDate(new Date());
          filtered = consumos.filter((c: any) => {
            const d = new Date(c.fecha_hora);
            const localStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            return localStr === todayLocal;
          });
        }
        console.log(`[Statistics] Cargados ${consumos.length} consumos para período ${selectedPeriod} (${fechaInicio} a ${fechaFin})`);
        console.log('[Statistics] Primeros consumos:', consumos.slice(0, 3));
        if (selectedPeriod === 'daily') {
          console.log(`[Statistics] Filtrados por día local (${formatLocalDate(new Date())}):`, filtered.length);
        }
        setPeriodConsumos(filtered);
      })
      .catch((error) => {
        console.error('[Statistics] Error al cargar consumos:', error);
        setPeriodConsumos([]);
      });
  }, [fetchEstadisticas, fetchTendencias, fetchInsights, user?.es_premium, selectedPeriod]);

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly' | 'annual') => {
    setSelectedPeriod(period);
    // Limpiar datos del período anterior inmediatamente para evitar "flash" de datos antiguos
    setPeriodConsumos([]);
    fetchTendencias(period);
  };

  const handleExportData = async () => {

    setIsExporting(true);
    try {
      const { fechaInicio, fechaFin } = getPeriodDates(selectedPeriod);
      const exportOptions = {
        format: 'csv' as const,
        dateFrom: fechaInicio,
        dateTo: fechaFin,
        includeBeverageDetails: true,
        includeLocation: true
      };

      const data = await exportService.getExportData(exportOptions);
      const csvContent = exportService.convertToCSV(data);
      const periodLabel = selectedPeriod === 'daily' ? 'diario' : selectedPeriod === 'weekly' ? 'semanal' : selectedPeriod === 'monthly' ? 'mensual' : 'anual';
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `hidratacion_${periodLabel}_${dateStr}.csv`;
      exportService.downloadCSV(csvContent, filename);
      toast.success('Datos exportados exitosamente');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error al exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  // Buckets de progreso según el período
  const progressBuckets = useMemo(() => {
    // Deduplicar por id para evitar doble conteo
    const uniqueById = (items: Consumo[]) => {
      const map = new Map<number, Consumo>();
      for (const item of items) {
        if (item && typeof (item as any).id === 'number') {
          const id = (item as any).id as number;
          if (!map.has(id)) map.set(id, item);
        } else {
          // Si no hay id, mantener el item tal cual
          const fallbackId = Math.random();
          map.set(fallbackId, item);
        }
      }
      return Array.from(map.values());
    };
    const safeConsumos = uniqueById(periodConsumos || []);
    if (selectedPeriod === 'daily') {
      // 8 segmentos de 3 horas para el día
      const buckets = new Array(8).fill(0);
      safeConsumos.forEach((c) => {
        const fechaHora = new Date(c.fecha_hora);
        const h = fechaHora.getHours();
        const idx = Math.floor(h / 3);
        // Usar SIEMPRE la hidratación efectiva si viene (cantidad_hidratacion_efectiva o hidratacion_efectiva_ml)
        // En su defecto, usar cantidad_ml
        const hasEfectiva = (c as any).cantidad_hidratacion_efectiva !== undefined && (c as any).cantidad_hidratacion_efectiva !== null;
        const hasEfectivaAlt = (c as any).hidratacion_efectiva_ml !== undefined && (c as any).hidratacion_efectiva_ml !== null;
        const hidratacion = hasEfectiva
          ? Number((c as any).cantidad_hidratacion_efectiva) || 0
          : hasEfectivaAlt
          ? Number((c as any).hidratacion_efectiva_ml) || 0
          : (c.cantidad_ml !== undefined && c.cantidad_ml !== null ? Number(c.cantidad_ml) : 0);
        
        if (idx >= 0 && idx < 8 && hidratacion > 0) {
          buckets[idx] += hidratacion;
          console.log(`[Statistics] Consumo agregado: hora=${h}:00, bucket=${idx} (${idx*3}:00), cantidad=${hidratacion}ml, acumulado=${buckets[idx]}ml`);
        }
      });
      const max = Math.max(...buckets, 0);
      const total = buckets.reduce((sum, v) => sum + v, 0);
      console.log(`[Statistics] Daily buckets finales:`, buckets, 'max:', max, 'total:', total);
      console.log(`[Statistics] Consumos procesados:`, periodConsumos.length, 'consumos');
      return buckets.map((v, i) => ({ 
        value: v, 
        pct: max > 0 ? Math.round((v / max) * 100) : 0,
        label: `${i * 3}:00`
      }));
    } else if (selectedPeriod === 'weekly') {
      // 7 días de la semana (Lunes a Domingo)
      const buckets = new Array(7).fill(0);
      const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      periodConsumos.forEach((c) => {
        const date = new Date(c.fecha_hora);
        let dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
        // Convertir a índice donde Lunes = 0, Domingo = 6
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const hidratacion = (c.cantidad_hidratacion_efectiva !== undefined && c.cantidad_hidratacion_efectiva !== null) 
          ? c.cantidad_hidratacion_efectiva 
          : ((c as any).hidratacion_efectiva_ml !== undefined && (c as any).hidratacion_efectiva_ml !== null)
          ? (c as any).hidratacion_efectiva_ml
          : (c.cantidad_ml !== undefined && c.cantidad_ml !== null ? c.cantidad_ml : 0);
        if (dayOfWeek >= 0 && dayOfWeek < 7) {
          buckets[dayOfWeek] += hidratacion;
        }
      });
      const max = Math.max(...buckets, 0);
      const total = buckets.reduce((sum, v) => sum + v, 0);
      console.log(`[Statistics] Weekly buckets:`, buckets, 'max:', max, 'total:', total);
      return buckets.map((v, i) => ({
        value: v,
        pct: max > 0 ? Math.round((v / max) * 100) : 0,
        label: dayLabels[i]
      }));
    } else if (selectedPeriod === 'monthly') {
      // 4 semanas del mes (aproximadamente)
      const buckets = new Array(4).fill(0);
      periodConsumos.forEach((c) => {
        const date = new Date(c.fecha_hora);
        const dayOfMonth = date.getDate();
        const weekIndex = Math.min(3, Math.floor((dayOfMonth - 1) / 7));
        const hidratacion = (c.cantidad_hidratacion_efectiva !== undefined && c.cantidad_hidratacion_efectiva !== null) 
          ? c.cantidad_hidratacion_efectiva 
          : ((c as any).hidratacion_efectiva_ml !== undefined && (c as any).hidratacion_efectiva_ml !== null)
          ? (c as any).hidratacion_efectiva_ml
          : (c.cantidad_ml !== undefined && c.cantidad_ml !== null ? c.cantidad_ml : 0);
        if (weekIndex >= 0 && weekIndex < 4) {
          buckets[weekIndex] += hidratacion;
        }
      });
      const max = Math.max(...buckets);
      return buckets.map((v, i) => ({
        value: v,
        pct: max > 0 ? Math.round((v / max) * 100) : 0,
        label: `Sem ${i + 1}`
      }));
    } else if (selectedPeriod === 'annual') {
      // 12 meses hacia atrás desde hoy
      const buckets = new Array(12).fill(0);
      const today = new Date();
      const labels: string[] = [];
      const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      // Generar labels para los últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        labels.push(monthLabels[date.getMonth()]);
      }
      
      // Agrupar consumos por mes relativo (0 = hace 11 meses, 11 = mes actual)
      periodConsumos.forEach((c) => {
        const date = new Date(c.fecha_hora);
        const monthsDiff = (today.getFullYear() - date.getFullYear()) * 12 + (today.getMonth() - date.getMonth());
        const bucketIndex = 11 - monthsDiff; // 0 = más antiguo, 11 = más reciente
        
        if (bucketIndex >= 0 && bucketIndex < 12) {
          const hidratacion = (c.cantidad_hidratacion_efectiva !== undefined && c.cantidad_hidratacion_efectiva !== null) 
            ? c.cantidad_hidratacion_efectiva 
            : ((c as any).hidratacion_efectiva_ml !== undefined && (c as any).hidratacion_efectiva_ml !== null)
            ? (c as any).hidratacion_efectiva_ml
            : (c.cantidad_ml !== undefined && c.cantidad_ml !== null ? c.cantidad_ml : 0);
          buckets[bucketIndex] += hidratacion;
        }
      });
      
      const max = Math.max(...buckets);
      return buckets.map((v, i) => ({
        value: v,
        pct: max > 0 ? Math.round((v / max) * 100) : 0,
        label: labels[i]
      }));
    }
    
    return [];
  }, [periodConsumos, selectedPeriod]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="bg-white shadow-card border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <Skeleton className="h-6 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
          <div className="mb-8">
            <Skeleton className="h-10 w-80 mb-6" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
                <Skeleton className="h-7 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-28 mx-auto" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-64 w-full" />
            </Card>
            <Card className="p-6">
              <Skeleton className="h-6 w-52 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <BarChart3 className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-display font-bold text-neutral-700 mb-2">
            Error al cargar estadísticas
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white shadow-card border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-neutral-700">
                Estadísticas Detalladas
              </h1>
              <p className="text-neutral-600">
                Analiza tus patrones de hidratación
              </p>
            </div>
            <div className="flex items-center space-x-4">
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-display font-bold text-neutral-700 mb-2">
                {estadisticas?.total_hidratacion_efectiva_ml || 0}ml
              </h3>
              <p className="text-neutral-600">Total Consumido</p>
            </div>
          </Card>
          <Card className="text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-display font-bold text-neutral-700 mb-2">
                {estadisticas?.meta_ml || 0}ml
              </h3>
              <p className="text-neutral-600">Meta Diaria</p>
            </div>
          </Card>
          <Card className="text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="text-2xl font-display font-bold text-neutral-700 mb-2">
                {Math.round(estadisticas?.progreso_porcentaje || 0)}%
              </h3>
              <p className="text-neutral-600">Progreso</p>
            </div>
          </Card>
          <Card className="text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-display font-bold text-neutral-700 mb-2">
                {estadisticas?.cantidad_consumos || 0}
              </h3>
              <p className="text-neutral-600">Consumos Hoy</p>
            </div>
          </Card>
        </div>

        {/* Premium Section: Period selector + charts */}
        {user?.es_premium ? (
          <>
            {/* Period Selector (solo premium) */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
                  {[
                    { key: 'daily', label: 'Diario', icon: Calendar, disabled: false },
                    { key: 'weekly', label: 'Semanal', icon: TrendingUp, disabled: false },
                    { key: 'monthly', label: 'Mensual', icon: BarChart3, disabled: false },
                    { key: 'annual', label: 'Anual', icon: Calendar, disabled: false }
                  ].map(({ key, label, icon: Icon, disabled }) => (
                    <button
                      key={key}
                      onClick={() => !disabled && handlePeriodChange(key as 'daily' | 'weekly' | 'monthly' | 'annual')}
                      disabled={disabled}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                        selectedPeriod === key
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <div />
              </div>
            </div>

            {/* Charts Section (Premium) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card title="Progreso" subtitle={getProgressSubtitle(selectedPeriod)}>
                {progressBuckets.length > 0 ? (() => {
                  const maxValue = Math.max(...progressBuckets.map(b => b.value), 0);
                  
                  // Función para calcular el máximo del eje Y
                  // Si el máximo real es 1500ml, la columna más alta debe llegar hasta y=1500
                  const calculateRoundedMax = (value: number): number => {
                    if (value === 0) return 100;
                    // Redondear hacia arriba a un múltiplo de 50, 100, 500 o 1000 para mejor visualización
                    // pero mantenerlo cerca del valor real
                    if (value <= 50) return Math.ceil(value / 10) * 10;
                    if (value <= 200) return Math.ceil(value / 50) * 50;
                    if (value <= 1000) return Math.ceil(value / 100) * 100;
                    if (value <= 5000) return Math.ceil(value / 500) * 500;
                    return Math.ceil(value / 1000) * 1000;
                  };
                  
                  const roundedMax = calculateRoundedMax(maxValue);
                  const step = roundedMax / 4;
                  const marks = [0, step, step * 2, step * 3, roundedMax];
                  
                  // Formatear valores para mostrar
                  const formatValue = (val: number) => {
                    if (val === 0) return '0';
                    if (val >= 1000) return `${(val / 1000).toFixed(1)}L`;
                    return `${Math.round(val)}ml`;
                  };
                  
                  return (
                    <div className="relative">
                      {/* Eje Y con valores (0 abajo, máximo arriba) */}
                      {maxValue > 0 && (
                        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between pr-2 text-xs text-gray-500">
                          {marks.slice().reverse().map((value, idx) => (
                            <span key={idx} className="text-right w-14 font-medium">
                              {formatValue(value)}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Gráfico de barras */}
                      <div className={`relative h-64 flex items-end justify-between bg-gray-50 rounded-lg p-4 pb-8 gap-1 ${maxValue > 0 ? 'pl-16' : ''}`}>
                        {progressBuckets.map((b, i) => {
                          // Calcular altura basada en el valor máximo redondeado (roundedMax)
                          // El contenedor tiene h-64 = 256px total
                          // Con padding p-4 = 16px arriba y abajo, y pb-8 = 32px abajo
                          // El espacio para labels es aproximadamente 24px (text-xs + mt-2)
                          // Altura disponible para barras: 256px - 16px (top padding) - 24px (labels) = 216px
                          const containerHeight = 216; // Altura disponible para las barras en píxeles
                          const barHeightPercent = roundedMax > 0 ? (b.value / roundedMax) * 100 : 0;
                          const barHeightPx = Math.max((barHeightPercent / 100) * containerHeight, b.value > 0 ? 8 : 0);
                          
                          const barColor = b.value > 0 
                            ? 'bg-gradient-to-t from-primary-600 to-primary-400' 
                            : 'bg-gray-200';
                          
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end mx-0.5 min-w-0" style={{ height: '216px' }}>
                              <div 
                                className={`w-full ${barColor} rounded-t-md transition-all shadow-sm hover:shadow-md cursor-pointer`}
                                style={{ 
                                  height: `${barHeightPx}px`,
                                  minHeight: b.value > 0 ? '8px' : '0px'
                                }}
                                title={`${b.label}: ${b.value} ml (máximo eje: ${formatValue(roundedMax)})`}
                              />
                              <span className="text-xs text-gray-600 mt-2 font-medium truncate w-full text-center">
                                {b.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Sin datos para el período seleccionado
                  </div>
                )}
              </Card>

              <Card title="Tendencias" subtitle={getTrendsSubtitle(selectedPeriod)}>
                <div className="p-6">
                  {tendencias ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Cambio</span>
                        {tendencias.cambio_porcentaje !== null && tendencias.cambio_porcentaje !== undefined ? (
                          <div className="flex items-center gap-2">
                            {tendencias.cambio_porcentaje >= 0 ? (
                              <ArrowUp className={`w-5 h-5 text-secondary-600`} />
                            ) : (
                              <ArrowDown className={`w-5 h-5 text-error-600`} />
                            )}
                            <span className={`font-display font-bold ${tendencias.cambio_porcentaje >= 0 ? 'text-secondary-600' : 'text-error-600'}`}>
                              {Math.round(Math.abs(tendencias.cambio_porcentaje))}%
                            </span>
                          </div>
                        ) : (
                          <span className="font-display font-medium text-neutral-500">
                            N/A
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm text-neutral-600 mb-1">
                          <span>Anterior</span>
                          <span>{tendencias.total_anterior || 0} ml</span>
                        </div>
                        <div className="w-full h-3 bg-neutral-200 rounded-md overflow-hidden mb-2">
                          <div className="h-full bg-neutral-400" style={{ width: `${Math.min(100, (tendencias.total_anterior || 0) / Math.max(1, (tendencias.total_actual || 1)) * 100)}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-sm text-neutral-600 mb-1">
                          <span>Actual</span>
                          <span>{tendencias.total_actual || 0} ml</span>
                        </div>
                        <div className="w-full h-3 bg-neutral-200 rounded-md overflow-hidden">
                          <div className="h-full bg-accent-500" style={{ width: `100%` }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-neutral-500 text-center">Sin datos de tendencias</div>
                  )}
                </div>
              </Card>
            </div>

            {/* Export Button (Premium) */}
            <Card title="Exportar Datos" subtitle="Descarga tus estadísticas en formato CSV" className="mb-8">
              <div className="flex items-center justify-between">
                <p className="text-neutral-700">Exporta tus datos de hidratación para análisis externos o respaldo.</p>
                {user?.es_premium ? (
                  <Button 
                    variant="primary" 
                    onClick={handleExportData}
                    disabled={isExporting}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exportando...' : 'Exportar'}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-neutral-500" />
                    <Button 
                      variant="outline" 
                      disabled
                      title="Desbloquea Exportación con Premium"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                    <p className="text-xs text-neutral-500">Desbloquea Exportación con Premium</p>
                  </div>
                )}
              </div>
            </Card>
          </>
        ) : (
          <Card title="Estadísticas avanzadas" subtitle="Desbloquea tu potencial: Gráficos semanales y anuales con Tomá bien, che! Premium">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-2 rounded-lg w-fit">
                {[
                  { key: 'daily', label: 'Diario', icon: Calendar },
                  { key: 'weekly', label: 'Semanal', icon: TrendingUp },
                  { key: 'monthly', label: 'Mensual', icon: BarChart3 },
                  { key: 'annual', label: 'Anual', icon: Calendar }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    disabled
                    className="flex items-center space-x-2 px-4 py-2 rounded-md opacity-50 cursor-not-allowed"
                    title="Disponible en Premium"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-neutral-700">Desbloquea tu potencial: Gráficos semanales y anuales con Tomá bien, che! Premium.</p>
                <Button variant="secondary" disabled title="Disponible en Premium">Exportar</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Insights Section */}
        {user?.es_premium && insights && (
          <Card title="💡 Insights Personalizados" subtitle="Análisis inteligente de tus patrones" className="mt-8">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-accent-50 rounded-lg border border-accent-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                      <Droplets className="w-6 h-6 text-accent-600" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-accent-900">Bebida Favorita</h4>
                    </div>
                  </div>
                  <p className="text-accent-700 font-display font-medium">{insights.bebida_mas_consumida || 'Agua'}</p>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-secondary-600" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-secondary-900">Hora Pico</h4>
                    </div>
                  </div>
                  <p className="text-secondary-700 font-display font-medium">{insights.hora_pico_hidratacion || '14:00'}</p>
                </div>
                <div className="p-4 bg-chart-50 rounded-lg border border-chart-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-chart-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-chart-600" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-chart-900">Recomendación</h4>
                    </div>
                  </div>
                  <p className="text-chart-700 text-sm">{insights.recomendacion || 'Mantén una hidratación constante durante el día'}</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Sin modal de personalización */}
    </div>
  );
};

export default Statistics;
