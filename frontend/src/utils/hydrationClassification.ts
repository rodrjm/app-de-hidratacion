/**
 * Utilidades para la clasificación hídrica visual basada en el factor de hidratación
 */

export interface ClasificacionHidrica {
  nivel: number;
  nombre: string;
  color: string;
  simbolo: string;
  mensaje: string;
}

/**
 * Determina la clasificación hídrica visual basada en el factor de hidratación
 * @param factorHidratacion - Factor de hidratación de la bebida
 * @returns Objeto con la clasificación (nivel, nombre, color, símbolo, mensaje)
 */
export const getClasificacionHidrica = (factorHidratacion: number): ClasificacionHidrica => {
  if (factorHidratacion >= 1.15) {
    return {
      nivel: 1,
      nombre: 'Muy Bueno',
      color: '#17A24A', // Verde Esmeralda
      simbolo: '💧💧💧',
      mensaje: 'Ayuda a retener líquidos'
    };
  }
  
  if (factorHidratacion >= 1.05) {
    return {
      nivel: 2,
      nombre: 'Bueno',
      color: '#28A745', // Verde Claro
      simbolo: '💧💧',
      mensaje: 'Hidratación superior al agua'
    };
  }
  
  if (factorHidratacion >= 0.95) {
    return {
      nivel: 3,
      nombre: 'Neutro',
      color: '#007BFF', // Azul Ciel
      simbolo: '💧',
      mensaje: 'Similar al agua'
    };
  }
  
  if (factorHidratacion >= 0.80) {
    return {
      nivel: 4,
      nombre: 'Regular',
      color: '#FFC107', // Naranja Suave
      simbolo: '⚠️',
      mensaje: 'Hidrata poco, ligera compensación necesaria'
    };
  }
  
  // factorHidratacion < 0.80
  return {
    nivel: 5,
    nombre: 'Malo',
    color: '#DC3545', // Rojo Suave
    simbolo: '❌',
    mensaje: 'Deshidrata más de lo que aporta, requiere compensación'
  };
};

