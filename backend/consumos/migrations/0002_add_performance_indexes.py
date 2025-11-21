"""
Migración para agregar índices de performance.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('consumos', '0001_initial'),
    ]

    operations = [
        # Índices para el modelo Consumo
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_consumo_usuario_fecha ON consumos_consumo (usuario_id, fecha_hora);",
            reverse_sql="DROP INDEX IF EXISTS idx_consumo_usuario_fecha;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_consumo_fecha ON consumos_consumo (fecha_hora);",
            reverse_sql="DROP INDEX IF EXISTS idx_consumo_fecha;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_consumo_bebida ON consumos_consumo (bebida_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_consumo_bebida;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_consumo_recipiente ON consumos_consumo (recipiente_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_consumo_recipiente;"
        ),
        
        # Índices para el modelo Bebida
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_bebida_activa ON consumos_bebida (activa);",
            reverse_sql="DROP INDEX IF EXISTS idx_bebida_activa;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_bebida_premium ON consumos_bebida (es_premium);",
            reverse_sql="DROP INDEX IF EXISTS idx_bebida_premium;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_bebida_agua ON consumos_bebida (es_agua);",
            reverse_sql="DROP INDEX IF EXISTS idx_bebida_agua;"
        ),
        
        # Índices para el modelo Recipiente
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_recipiente_usuario ON consumos_recipiente (usuario_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_recipiente_usuario;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_recipiente_favorito ON consumos_recipiente (es_favorito);",
            reverse_sql="DROP INDEX IF EXISTS idx_recipiente_favorito;"
        ),
        
        # Índices para el modelo MetaDiaria
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_meta_usuario_fecha ON consumos_metadiaria (usuario_id, fecha);",
            reverse_sql="DROP INDEX IF EXISTS idx_meta_usuario_fecha;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_meta_completada ON consumos_metadiaria (completada);",
            reverse_sql="DROP INDEX IF EXISTS idx_meta_completada;"
        ),
        
        # Índices para el modelo Recordatorio
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_recordatorio_usuario ON consumos_recordatorio (usuario_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_recordatorio_usuario;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_recordatorio_activo ON consumos_recordatorio (activo);",
            reverse_sql="DROP INDEX IF EXISTS idx_recordatorio_activo;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_recordatorio_tipo ON consumos_recordatorio (tipo_recordatorio);",
            reverse_sql="DROP INDEX IF EXISTS idx_recordatorio_tipo;"
        ),
        
        # Índices compuestos para consultas frecuentes
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_consumo_user_date_range ON consumos_consumo (usuario_id, fecha_hora, cantidad_ml);",
            reverse_sql="DROP INDEX IF EXISTS idx_consumo_user_date_range;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_consumo_stats ON consumos_consumo (usuario_id, fecha_hora, cantidad_hidratacion_efectiva);",
            reverse_sql="DROP INDEX IF EXISTS idx_consumo_stats;"
        ),
    ]
