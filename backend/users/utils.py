"""
Utilidades para la aplicación de usuarios.

Este módulo contiene funciones auxiliares para operaciones comunes
relacionadas con usuarios, como la creación de recipientes por defecto.
"""

from consumos.models import Recipiente
from typing import List


def crear_recipientes_por_defecto(usuario) -> List[Recipiente]:
    """
    Crea los recipientes por defecto para un nuevo usuario.
    
    Cuando un usuario se registra, se le asignan automáticamente dos
    recipientes estándar: una taza/vaso de 250ml y una botella/termo
    pequeño de 500ml. Ambos se marcan como favoritos.
    
    Args:
        usuario: Instancia del modelo User para el cual crear los recipientes
        
    Returns:
        List[Recipiente]: Lista de recipientes creados (normalmente 2)
        
    Example:
        >>> user = User.objects.create_user(...)
        >>> recipientes = crear_recipientes_por_defecto(user)
        >>> len(recipientes)
        2
    """
    recipientes_por_defecto = [
        {
            'nombre': 'Taza/Vaso',
            'cantidad_ml': 250,
            'color': '#3B82F6',
            'icono': 'cup',
            'es_favorito': True
        },
        {
            'nombre': 'Botella/Termo pequeño',
            'cantidad_ml': 500,
            'color': '#10B981',
            'icono': 'bottle',
            'es_favorito': True
        }
    ]
    
    recipientes_creados = []
    for recipiente_data in recipientes_por_defecto:
        recipiente = Recipiente.objects.create(
            usuario=usuario,
            **recipiente_data
        )
        recipientes_creados.append(recipiente)
    
    return recipientes_creados

