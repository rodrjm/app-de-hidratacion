/**
 * Servicio para exportar datos de hidratación
 */

import { apiService } from './api';
import { Consumo } from '@/types';

export interface ExportOptions {
  format: 'csv' | 'json';
  dateFrom?: string;
  dateTo?: string;
  includeBeverageDetails?: boolean;
  includeLocation?: boolean;
}

export interface ExportData {
  consumos: Consumo[];
  summary: {
    total_ml: number;
    total_hidratacion_efectiva_ml: number;
    cantidad_consumos: number;
    periodo: string;
    promedio_diario_ml: number;
  };
}

class ExportService {
  /**
   * Obtener datos para exportar
   */
  async getExportData(options: ExportOptions): Promise<ExportData> {
    const params: Record<string, string | number | boolean | undefined> = {
      format: options.format,
    };

    if (options.dateFrom) {
      params.date_from = options.dateFrom;
    }
    if (options.dateTo) {
      params.date_to = options.dateTo;
    }
    if (options.includeBeverageDetails) {
      params.include_beverage_details = true;
    }
    if (options.includeLocation) {
      params.include_location = true;
    }

    return await apiService.get<ExportData>('/export/', params);
  }

  /**
   * Convertir datos a CSV
   */
  convertToCSV(data: ExportData): string {
    const headers = [
      'Fecha',
      'Hora',
      'Bebida',
      'Cantidad (ml)',
      'Hidratación Efectiva (ml)',
      'Recipiente',
      'Nivel de Sed',
      'Estado de Ánimo',
      'Ubicación',
      'Notas'
    ];

    const rows = data.consumos.map(consumo => [
      this.formatDate(consumo.fecha_hora),
      this.formatTime(consumo.fecha_hora),
      (typeof consumo.bebida === 'object' ? consumo.bebida?.nombre : 'N/A') || 'N/A',
      consumo.cantidad_ml,
      consumo.cantidad_hidratacion_efectiva ?? 'N/A',
      (typeof consumo.recipiente === 'object' && consumo.recipiente ? consumo.recipiente?.nombre : 'N/A') || 'N/A',
      this.getNivelSedText(consumo.nivel_sed),
      this.getEstadoAnimoText(consumo.estado_animo),
      consumo.ubicacion || 'N/A',
      consumo.notas || 'N/A'
    ]);

    // Agregar resumen al final
    const summaryRow = [
      'RESUMEN',
      '',
      '',
      data.summary.total_ml,
      data.summary.total_hidratacion_efectiva_ml,
      '',
      '',
      '',
      '',
      `Total consumos: ${data.summary.cantidad_consumos}`
    ];

    const allRows = [headers, ...rows, [], summaryRow];
    
    return allRows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  }

  /**
   * Descargar archivo CSV
   */
  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Generar nombre de archivo con fecha
   */
  generateFilename(prefix: string = 'hidratacion'): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    return `${prefix}_${dateStr}.csv`;
  }

  /**
   * Formatear fecha
   */
  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  /**
   * Formatear hora
   */
  private formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener texto del nivel de sed
   */
  private getNivelSedText(nivel?: number): string {
    const niveles = {
      1: 'Muy poca sed',
      2: 'Poca sed',
      3: 'Sed normal',
      4: 'Mucha sed',
      5: 'Muy sediento'
    };
    return nivel ? niveles[nivel as keyof typeof niveles] || 'N/A' : 'N/A';
  }

  /**
   * Obtener texto del estado de ánimo
   */
  private getEstadoAnimoText(estado?: number | string): string {
    if (typeof estado === 'number') {
      const map: Record<number, string> = {
        1: 'Muy mal',
        2: 'Mal',
        3: 'Regular',
        4: 'Bueno',
        5: 'Excelente'
      };
      return map[estado] ?? 'N/A';
    }
    const estados = {
      'excelente': 'Excelente',
      'bueno': 'Bueno',
      'regular': 'Regular',
      'malo': 'Malo',
      'terrible': 'Terrible'
    } as const;
    return estado ? estados[estado as keyof typeof estados] || String(estado) : 'N/A';
  }
}

export const exportService = new ExportService();
export default exportService;
