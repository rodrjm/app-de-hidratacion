import logging

from django.db import close_old_connections
from django.db.utils import OperationalError


logger = logging.getLogger(__name__)


class RetryDbOperationalErrorOnSafeMethodsMiddleware:
    """
    Neon (especialmente en planes gratuitos) puede cerrar conexiones SSL ociosas.
    Eso puede causar OperationalError en requests GET (p.ej. /users/profile/, /actividades/resumen_dia/).

    Para métodos seguros (GET/HEAD/OPTIONS), reintentamos una vez:
    - cerramos conexiones viejas
    - ejecutamos nuevamente el request

    Importante: NO reintentar POST/PUT/PATCH/DELETE para evitar efectos duplicados.
    """

    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method not in self.SAFE_METHODS:
            return self.get_response(request)

        try:
            return self.get_response(request)
        except OperationalError as e:
            msg = str(e)
            if "SSL connection has been closed unexpectedly" not in msg:
                raise
            logger.warning("OperationalError (SSL closed). Retrying once. path=%s", request.path)
            close_old_connections()
            return self.get_response(request)

