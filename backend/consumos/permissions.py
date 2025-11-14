"""
Permisos personalizados para la aplicación de consumos.
"""

from rest_framework.permissions import BasePermission


class IsPremiumUser(BasePermission):
    """
    Permiso personalizado que permite el acceso solo a usuarios premium.
    """
    
    def has_permission(self, request, view):
        """
        Retorna True si el usuario está autenticado y es premium.
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'es_premium') and 
            request.user.es_premium
        )
    
    def has_object_permission(self, request, view, obj):
        """
        Retorna True si el usuario es premium y tiene acceso al objeto.
        """
        return self.has_permission(request, view)


class IsOwnerOrPremium(BasePermission):
    """
    Permiso que permite acceso si el usuario es el propietario del objeto o es premium.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Retorna True si el usuario es el propietario del objeto o es premium.
        """
        # Si el usuario es premium, puede acceder a cualquier objeto
        if (request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'es_premium') and 
            request.user.es_premium):
            return True
        
        # Si no es premium, solo puede acceder a sus propios objetos
        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user
        
        return False


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
