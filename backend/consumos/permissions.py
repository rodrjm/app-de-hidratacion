"""
Permisos personalizados para la aplicación de consumos.
"""

import logging
from rest_framework.permissions import BasePermission

logger = logging.getLogger('users.security')


class IsPremiumUser(BasePermission):
    """
    Permiso personalizado que permite el acceso solo a usuarios premium.
    """
    
    def has_permission(self, request, view):
        """
        Retorna True si el usuario está autenticado y es premium.
        """
        if not (request.user and request.user.is_authenticated):
            return False
        
        is_premium = (
            hasattr(request.user, 'es_premium') and 
            request.user.es_premium
        )
        
        # Log de intento de acceso a recurso premium sin permisos
        if not is_premium:
            ip_address = self._get_client_ip(request)
            logger.warning(
                f'Intento de acceso a recurso premium sin permisos - Usuario: {request.user.email}, IP: {ip_address}, View: {view.__class__.__name__}',
                extra={
                    'event_type': 'premium_access_denied',
                    'user_id': request.user.id,
                    'email': request.user.email,
                    'ip': ip_address,
                    'view': view.__class__.__name__
                }
            )
        
        return is_premium
    
    def has_object_permission(self, request, view, obj):
        """
        Retorna True si el usuario es premium y tiene acceso al objeto.
        """
        return self.has_permission(request, view)
    
    def _get_client_ip(self, request):
        """Obtiene la IP del cliente desde el request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class IsOwnerOrPremium(BasePermission):
    """
    Permiso que permite acceso si el usuario es el propietario del objeto o es premium.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Retorna True si el usuario es el propietario del objeto o es premium.
        """
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Si el usuario es premium, puede acceder a cualquier objeto
        if (hasattr(request.user, 'es_premium') and 
            request.user.es_premium):
            return True
        
        # Si no es premium, solo puede acceder a sus propios objetos
        if hasattr(obj, 'usuario'):
            is_owner = obj.usuario == request.user
            
            # Log de intento de acceso a objeto de otro usuario
            if not is_owner:
                ip_address = self._get_client_ip(request)
                obj_owner_email = obj.usuario.email if hasattr(obj.usuario, 'email') else 'unknown'
                logger.warning(
                    f'Intento de acceso a objeto de otro usuario - Usuario: {request.user.email}, Objeto Owner: {obj_owner_email}, IP: {ip_address}, View: {view.__class__.__name__}',
                    extra={
                        'event_type': 'unauthorized_object_access',
                        'user_id': request.user.id,
                        'email': request.user.email,
                        'object_owner_id': obj.usuario.id if hasattr(obj.usuario, 'id') else None,
                        'ip': ip_address,
                        'view': view.__class__.__name__
                    }
                )
            
            return is_owner
        
        return False
    
    def _get_client_ip(self, request):
        """Obtiene la IP del cliente desde el request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class IsPremiumOrReadOnly(BasePermission):
    """
    Permiso que permite escritura solo a usuarios premium, lectura a todos los autenticados.
    """
    
    def has_permission(self, request, view):
        """
        Retorna True si el usuario está autenticado.
        Para escritura, requiere que sea premium.
        """
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Para métodos de lectura, cualquier usuario autenticado
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Para métodos de escritura, requiere ser premium
        return (
            hasattr(request.user, 'es_premium') and 
            request.user.es_premium
        )
