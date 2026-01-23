import React from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import BrandLogo from '@/components/common/BrandLogo';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <BrandLogo />
          <h1 className="text-3xl font-display font-bold text-neutral-700 mt-6">
            Política de Privacidad
          </h1>
          <p className="text-neutral-600 mt-2">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <Card className="prose prose-sm max-w-none">
          <div className="space-y-6 text-neutral-700">
            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">1. Introducción</h2>
              <p className="text-neutral-700 leading-relaxed">
                En "Dosis Vital: Tu aplicación de hidratación personal" (en adelante, "la Aplicación"), 
                nos comprometemos a proteger su privacidad y la seguridad de sus datos personales. Esta 
                Política de Privacidad explica cómo recopilamos, utilizamos, almacenamos y protegemos su 
                información cuando utiliza nuestra Aplicación.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">2. Información que Recopilamos</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Recopilamos los siguientes tipos de información:
              </p>
              
              <h3 className="text-lg font-display font-semibold text-neutral-800 mb-2">2.1. Información de Registro</h3>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
                <li>Nombre y apellido</li>
                <li>Dirección de correo electrónico</li>
                <li>Contraseña (almacenada de forma encriptada)</li>
                <li>Nombre de usuario</li>
              </ul>

              <h3 className="text-lg font-display font-semibold text-neutral-800 mb-2">2.2. Información de Salud y Bienestar</h3>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
                <li>Peso corporal</li>
                <li>Fecha de nacimiento (para calcular la edad)</li>
                <li>Género</li>
                <li>Nivel de actividad física</li>
                <li>Condiciones de salud relevantes (si las proporciona, como fragilidad o insuficiencia cardíaca)</li>
                <li>Registros de consumo de líquidos</li>
                <li>Registros de actividades físicas</li>
                <li>Metas de hidratación personalizadas</li>
                <li>Preferencias de recordatorios</li>
              </ul>

              <h3 className="text-lg font-display font-semibold text-neutral-800 mb-2">2.3. Información Técnica</h3>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Dirección IP</li>
                <li>Tipo de navegador y dispositivo</li>
                <li>Fecha y hora de acceso</li>
                <li>Datos de uso de la aplicación</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">3. Cómo Utilizamos su Información</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Utilizamos su información para los siguientes propósitos:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li><strong>Proporcionar servicios:</strong> Para calcular recomendaciones de hidratación personalizadas 
                    basadas en sus datos de salud y actividad.</li>
                <li><strong>Mejorar la aplicación:</strong> Para analizar el uso de la aplicación y mejorar nuestras funcionalidades.</li>
                <li><strong>Comunicación:</strong> Para enviarle recordatorios de hidratación y notificaciones relacionadas con el servicio.</li>
                <li><strong>Seguridad:</strong> Para proteger su cuenta y prevenir fraudes.</li>
                <li><strong>Cumplimiento legal:</strong> Para cumplir con obligaciones legales y regulatorias.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">4. Seguridad de los Datos</h2>
              <p className="text-neutral-700 leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger sus datos personales 
                contra acceso no autorizado, alteración, divulgación o destrucción. Esto incluye:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700 mt-3">
                <li>Encriptación de contraseñas</li>
                <li>Conexiones seguras (HTTPS)</li>
                <li>Acceso restringido a datos personales</li>
                <li>Monitoreo regular de seguridad</li>
                <li>Copias de seguridad regulares</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mt-3">
                Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro. 
                Aunque nos esforzamos por proteger sus datos, no podemos garantizar su seguridad absoluta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">5. Compartir Información</h2>
              <p className="text-neutral-700 leading-relaxed">
                <strong>No vendemos, alquilamos ni compartimos su información personal con terceros</strong> para sus 
                propios fines de marketing. Podemos compartir información solo en las siguientes circunstancias:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700 mt-3">
                <li><strong>Proveedores de servicios:</strong> Con empresas que nos ayudan a operar la aplicación 
                    (como servicios de hosting), bajo estrictos acuerdos de confidencialidad.</li>
                <li><strong>Cumplimiento legal:</strong> Cuando sea requerido por ley, orden judicial o proceso legal.</li>
                <li><strong>Protección de derechos:</strong> Para proteger nuestros derechos, propiedad o seguridad, 
                    o la de nuestros usuarios.</li>
                <li><strong>Con su consentimiento:</strong> En cualquier otra situación con su consentimiento explícito.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">6. Retención de Datos</h2>
              <p className="text-neutral-700 leading-relaxed">
                Conservamos sus datos personales durante el tiempo necesario para cumplir con los propósitos descritos 
                en esta política, a menos que la ley requiera o permita un período de retención más largo. Si elimina 
                su cuenta, eliminaremos o anonimizaremos sus datos personales, excepto cuando la ley requiera que los 
                conservemos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">7. Sus Derechos</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Usted tiene los siguientes derechos respecto a sus datos personales:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li><strong>Acceso:</strong> Puede solicitar una copia de los datos personales que tenemos sobre usted.</li>
                <li><strong>Rectificación:</strong> Puede corregir cualquier dato inexacto o incompleto.</li>
                <li><strong>Eliminación:</strong> Puede solicitar que eliminemos sus datos personales.</li>
                <li><strong>Portabilidad:</strong> Puede solicitar que transfiramos sus datos a otro proveedor de servicios.</li>
                <li><strong>Oposición:</strong> Puede oponerse al procesamiento de sus datos en ciertas circunstancias.</li>
                <li><strong>Retirar consentimiento:</strong> Puede retirar su consentimiento en cualquier momento.</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mt-3">
                Para ejercer estos derechos, puede contactarnos a través de la funcionalidad de feedback disponible 
                en la Aplicación.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">8. Cookies y Tecnologías Similares</h2>
              <p className="text-neutral-700 leading-relaxed">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso de la aplicación 
                y personalizar el contenido. Puede configurar su navegador para rechazar cookies, aunque esto puede 
                afectar algunas funcionalidades de la aplicación.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">9. Menores de Edad</h2>
              <p className="text-neutral-700 leading-relaxed">
                Nuestra aplicación no está dirigida a menores de 13 años. No recopilamos intencionalmente información 
                personal de menores de 13 años. Si descubrimos que hemos recopilado información de un menor de 13 años, 
                tomaremos medidas para eliminar esa información.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">10. Cambios a esta Política</h2>
              <p className="text-neutral-700 leading-relaxed">
                Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre cambios 
                significativos publicando la nueva política en esta página y actualizando la fecha de "Última actualización". 
                Le recomendamos que revise esta política periódicamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">11. Contacto</h2>
              <p className="text-neutral-700 leading-relaxed">
                Si tiene preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad o el 
                manejo de sus datos personales, puede contactarnos a través de la funcionalidad de feedback disponible 
                en la Aplicación.
              </p>
            </section>

            <section className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
              <p className="text-neutral-700 leading-relaxed">
                <strong>Nota sobre Regulaciones:</strong> Esta política cumple con los principios generales de protección 
                de datos. Si reside en la Unión Europea, también se aplican los derechos bajo el Reglamento General de 
                Protección de Datos (RGPD). Si reside en Argentina, se aplican los derechos bajo la Ley de Protección de 
                Datos Personales (Ley 25.326).
              </p>
            </section>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <Link to="/register">
            <Button variant="primary">Volver al Registro</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
