"""
Constantes para la aplicación de consumos.
"""

# Metas de hidratación por defecto
HYDRATION_GOALS = {
    'low': 1500,      # 1.5L
    'moderate': 2000,  # 2L
    'high': 2500,     # 2.5L
    'very_high': 3000  # 3L
}

# Niveles de actividad
ACTIVITY_LEVELS = {
    'low': {
        'name': 'Baja',
        'description': 'Poco o ningún ejercicio',
        'factor': 1.0
    },
    'moderate': {
        'name': 'Moderada',
        'description': 'Ejercicio ligero 1-3 días por semana',
        'factor': 1.2
    },
    'high': {
        'name': 'Alta',
        'description': 'Ejercicio moderado 3-5 días por semana',
        'factor': 1.4
    },
    'very_high': {
        'name': 'Muy Alta',
        'description': 'Ejercicio intenso 6-7 días por semana',
        'factor': 1.6
    }
}

# Tipos de clima
CLIMATE_TYPES = {
    'temperate': {
        'name': 'Templado',
        'description': 'Clima templado, sin extremos',
        'factor': 1.0
    },
    'hot': {
        'name': 'Cálido',
        'description': 'Clima cálido, mayor sudoración',
        'factor': 1.3
    },
    'cold': {
        'name': 'Frío',
        'description': 'Clima frío, menor sudoración',
        'factor': 0.9
    }
}

# Niveles de sed
SED_LEVELS = {
    1: {
        'name': 'Sin sed',
        'description': 'No sientes sed',
        'color': '#4CAF50'
    },
    2: {
        'name': 'Sed ligera',
        'description': 'Sientes una ligera sed',
        'color': '#8BC34A'
    },
    3: {
        'name': 'Sed moderada',
        'description': 'Sientes sed moderada',
        'color': '#FFC107'
    },
    4: {
        'name': 'Sed intensa',
        'description': 'Sientes mucha sed',
        'color': '#FF9800'
    },
    5: {
        'name': 'Sed extrema',
        'description': 'Sientes sed extrema',
        'color': '#F44336'
    }
}

# Niveles de ánimo
MOOD_LEVELS = {
    1: {
        'name': 'Muy malo',
        'description': 'Te sientes muy mal',
        'color': '#F44336'
    },
    2: {
        'name': 'Malo',
        'description': 'Te sientes mal',
        'color': '#FF9800'
    },
    3: {
        'name': 'Regular',
        'description': 'Te sientes regular',
        'color': '#FFC107'
    },
    4: {
        'name': 'Bueno',
        'description': 'Te sientes bien',
        'color': '#8BC34A'
    },
    5: {
        'name': 'Excelente',
        'description': 'Te sientes excelente',
        'color': '#4CAF50'
    }
}

# Funcionalidades premium
PREMIUM_FEATURES = [
    {
        'id': 'personalized_goal',
        'name': 'Meta Personalizada',
        'description': 'Calcula tu meta diaria basada en tu peso y actividad',
        'icon': 'target'
    },
    {
        'id': 'advanced_stats',
        'name': 'Estadísticas Avanzadas',
        'description': 'Análisis detallados y tendencias de tu hidratación',
        'icon': 'chart-line'
    },
    {
        'id': 'unlimited_reminders',
        'name': 'Recordatorios Ilimitados',
        'description': 'Crea tantos recordatorios como necesites',
        'icon': 'bell'
    },
    {
        'id': 'no_ads',
        'name': 'Sin Anuncios',
        'description': 'Disfruta de la app sin interrupciones',
        'icon': 'ad'
    },
    {
        'id': 'premium_beverages',
        'name': 'Bebidas Premium',
        'description': 'Acceso a catálogo completo de bebidas',
        'icon': 'wine-glass'
    },
    {
        'id': 'smart_insights',
        'name': 'Insights Inteligentes',
        'description': 'Recomendaciones personalizadas basadas en tus datos',
        'icon': 'lightbulb'
    },
    {
        'id': 'data_export',
        'name': 'Exportación de Datos',
        'description': 'Exporta tus datos en múltiples formatos',
        'icon': 'download'
    },
    {
        'id': 'priority_support',
        'name': 'Soporte Prioritario',
        'description': 'Atención al cliente de alta prioridad',
        'icon': 'headset'
    }
]

# Límites de uso
USAGE_LIMITS = {
    'free': {
        'max_reminders': 3,
        'max_daily_consumos': 50,
        'max_recipientes': 5,
        'max_bebidas_personalizadas': 3
    },
    'premium': {
        'max_reminders': -1,  # Ilimitado
        'max_daily_consumos': -1,  # Ilimitado
        'max_recipientes': -1,  # Ilimitado
        'max_bebidas_personalizadas': -1  # Ilimitado
    }
}

# Configuración de notificaciones
NOTIFICATION_SETTINGS = {
    'reminder_times': [
        '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'
    ],
    'reminder_messages': [
        "¡Hora de hidratarse! 💧",
        "Recuerda beber agua 🥤",
        "Mantente hidratado 💦",
        "¡Tu cuerpo te lo agradecerá! 🌟",
        "Hora de cuidar tu salud 💚"
    ]
}

# Configuración de colores para la UI
UI_COLORS = {
    'primary': '#2196F3',
    'secondary': '#FFC107',
    'success': '#4CAF50',
    'warning': '#FF9800',
    'error': '#F44336',
    'info': '#00BCD4'
}

# Configuración de iconos
UI_ICONS = {
    'water': '💧',
    'glass': '🥤',
    'bottle': '🍼',
    'cup': '☕',
    'juice': '🧃',
    'soda': '🥤',
    'energy': '⚡',
    'health': '💚'
}
