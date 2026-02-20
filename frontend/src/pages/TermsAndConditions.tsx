import React from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import BrandLogo from '@/components/common/BrandLogo';

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <BrandLogo />
          <h1 className="text-3xl font-display font-bold text-neutral-700 mt-6">
            Términos y condiciones de uso
          </h1>
          <p className="text-neutral-600 mt-2">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <Card className="prose prose-sm max-w-none">
          <div className="space-y-6 text-neutral-700">
            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">1. Aceptación de los Términos</h2>
              <p className="text-neutral-700 leading-relaxed">
                Al acceder y utilizar la aplicación "Dosis Vital: Tu aplicación de hidratación personal" 
                (en adelante, "la Aplicación"), usted acepta estar sujeto a estos Términos y Condiciones 
                de Uso. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar la Aplicación.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">2. Descargo de responsabilidad médica</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                <p className="font-display font-semibold text-yellow-800 mb-2">⚠️ IMPORTANTE - LEA CUIDADOSAMENTE</p>
                <p className="text-neutral-700 leading-relaxed">
                  <strong>La Aplicación NO sustituye el consejo, diagnóstico o tratamiento médico profesional.</strong> 
                  Las recomendaciones de hidratación proporcionadas por la Aplicación se basan en algoritmos 
                  generales y fórmulas científicas estándar, pero no tienen en cuenta todas las condiciones 
                  médicas individuales, medicamentos, o circunstancias de salud específicas.
                </p>
                <p className="text-neutral-700 leading-relaxed mt-3">
                  <strong>Usted reconoce y acepta que:</strong>
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2 text-neutral-700">
                  <li>La Aplicación es una herramienta de referencia y seguimiento, no un servicio médico.</li>
                  <li>Debe consultar con un médico o profesional de la salud calificado antes de realizar 
                      cambios significativos en su ingesta de líquidos, especialmente si tiene condiciones 
                      médicas preexistentes.</li>
                  <li>Si experimenta síntomas de deshidratación, sobrehidratación, o cualquier problema de salud, 
                      debe buscar atención médica inmediata.</li>
                  <li>Los desarrolladores de la Aplicación no se hacen responsables de decisiones médicas 
                      tomadas basándose únicamente en la información proporcionada por la Aplicación.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">3. Uso de la Aplicación</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                La Aplicación está diseñada para ayudarle a realizar un seguimiento de su consumo de líquidos 
                y proporcionar recomendaciones generales de hidratación. Usted se compromete a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                <li>Proporcionar información precisa y veraz sobre su peso, edad, nivel de actividad y otros datos solicitados.</li>
                <li>Utilizar la Aplicación de manera responsable y conforme a la ley.</li>
                <li>No utilizar la Aplicación para fines ilegales o no autorizados.</li>
                <li>No intentar acceder a áreas restringidas de la Aplicación o interferir con su funcionamiento.</li>
                <li>Mantener la confidencialidad de su cuenta y contraseña.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">4. Cuentas de usuario</h2>
              <p className="text-neutral-700 leading-relaxed">
                Para utilizar ciertas funcionalidades de la Aplicación, debe crear una cuenta. Usted es responsable 
                de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran 
                bajo su cuenta. Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">5. Propiedad intelectual</h2>
              <p className="text-neutral-700 leading-relaxed">
                Todo el contenido de la Aplicación, incluyendo pero no limitado a textos, gráficos, logos, iconos, 
                imágenes, y software, es propiedad de los desarrolladores o sus licenciantes y está protegido por 
                leyes de propiedad intelectual. No puede reproducir, distribuir, modificar o crear obras derivadas 
                sin autorización previa por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">6. Limitación de responsabilidad</h2>
              <p className="text-neutral-700 leading-relaxed">
                En la máxima medida permitida por la ley, los desarrolladores de la Aplicación no serán responsables 
                de ningún daño directo, indirecto, incidental, especial, consecuente o punitivo que resulte del uso 
                o la imposibilidad de usar la Aplicación, incluyendo pero no limitado a daños relacionados con la salud.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">7. Modificaciones de los términos</h2>
              <p className="text-neutral-700 leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones 
                entrarán en vigor inmediatamente después de su publicación. Su uso continuado de la Aplicación 
                después de cualquier modificación constituye su aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">8. Terminación</h2>
              <p className="text-neutral-700 leading-relaxed">
                Podemos terminar o suspender su acceso a la Aplicación en cualquier momento, con o sin causa, 
                con o sin previo aviso, por cualquier motivo, incluyendo la violación de estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">9. Ley aplicable</h2>
              <p className="text-neutral-700 leading-relaxed">
                Estos términos se regirán e interpretarán de acuerdo con las leyes de Argentina, sin tener en 
                cuenta sus disposiciones sobre conflictos de leyes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-neutral-800 mb-3">10. Contacto</h2>
              <p className="text-neutral-700 leading-relaxed">
                Si tiene preguntas sobre estos Términos y condiciones, puede contactarnos a través de la 
                funcionalidad de feedback disponible en la Aplicación.
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

export default TermsAndConditions;
