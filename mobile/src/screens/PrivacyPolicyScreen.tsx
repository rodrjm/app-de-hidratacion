import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import HeaderAppLogo from "../components/HeaderAppLogo";

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<any>();
  return (
    <SafeAreaView className="flex-1 bg-primary-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 32 }}
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
            <Ionicons name="shield-checkmark-outline" size={22} color="#6366F1" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-display font-bold text-neutral-800">
              Política de privacidad
            </Text>
            <Text className="text-xs text-neutral-500">
              Última actualización: {new Date().toLocaleDateString("es-ES")}
            </Text>
          </View>
          <HeaderAppLogo />
        </View>

        <View className="bg-white rounded-2xl border border-neutral-100 shadow-card p-4">
          <View className="space-y-4">
            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                1. Introducción
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                En &quot;Dosis Vital: Tu aplicación de hidratación personal&quot; (en adelante, &quot;la Aplicación&quot;),
                nos comprometemos a proteger su privacidad y la seguridad de sus datos personales. Esta política de
                Privacidad explica cómo recopilamos, utilizamos, almacenamos y protegemos su información cuando utiliza
                nuestra Aplicación.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                2. Información que Recopilamos
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed mb-2">
                Recopilamos los siguientes tipos de información:
              </Text>

              <Text className="text-sm font-display font-semibold text-neutral-800 mb-1">
                2.1. Información de Registro
              </Text>
              <View className="pl-3 mb-3">
                <Text className="text-sm text-neutral-700 leading-relaxed">• Nombre y apellido</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Dirección de correo electrónico</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Contraseña (almacenada de forma encriptada)</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Nombre de usuario</Text>
              </View>

              <Text className="text-sm font-display font-semibold text-neutral-800 mb-1">
                2.2. Información de Salud y Bienestar
              </Text>
              <View className="pl-3 mb-3">
                <Text className="text-sm text-neutral-700 leading-relaxed">• Peso corporal</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Fecha de nacimiento (para calcular la edad)</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Género</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Nivel de actividad física</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • Condiciones de salud relevantes (si las proporciona, como fragilidad o insuficiencia cardíaca)
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Registros de consumo de líquidos</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Registros de actividades físicas</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Metas de hidratación personalizadas</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Preferencias de recordatorios</Text>
              </View>

              <Text className="text-sm font-display font-semibold text-neutral-800 mb-1">
                2.3. Información Técnica
              </Text>
              <View className="pl-3">
                <Text className="text-sm text-neutral-700 leading-relaxed">• Dirección IP</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Tipo de navegador y dispositivo</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Fecha y hora de acceso</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Datos de uso de la aplicación</Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                3. Cómo Utilizamos su Información
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed mb-2">
                Utilizamos su información para los siguientes propósitos:
              </Text>
              <View className="pl-3">
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Proporcionar servicios:</Text> Para calcular recomendaciones de
                  hidratación personalizadas basadas en sus datos de salud y actividad.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Mejorar la aplicación:</Text> Para analizar el uso de la
                  aplicación y mejorar nuestras funcionalidades.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Comunicación:</Text> Para enviarle recordatorios de hidratación y
                  notificaciones relacionadas con el servicio.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Seguridad:</Text> Para proteger su cuenta y prevenir fraudes.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Cumplimiento legal:</Text> Para cumplir con obligaciones legales y
                  regulatorias.
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                4. Seguridad de los Datos
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed mb-2">
                Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger sus datos
                personales contra acceso no autorizado, alteración, divulgación o destrucción. Esto incluye:
              </Text>
              <View className="pl-3 mb-2">
                <Text className="text-sm text-neutral-700 leading-relaxed">• Encriptación de contraseñas</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Conexiones seguras (HTTPS)</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Acceso restringido a datos personales</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Monitoreo regular de seguridad</Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">• Copias de seguridad regulares</Text>
              </View>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro.
                Aunque nos esforzamos por proteger sus datos, no podemos garantizar su seguridad absoluta.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                5. Compartir Información
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed mb-2">
                <Text className="font-semibold">
                  No vendemos, alquilamos ni compartimos su información personal con terceros
                </Text>{" "}
                para sus propios fines de marketing. Podemos compartir información solo en las siguientes circunstancias:
              </Text>
              <View className="pl-3">
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Proveedores de servicios:</Text> Con empresas que nos ayudan a
                  operar la aplicación (como servicios de hosting), bajo estrictos acuerdos de confidencialidad.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Cumplimiento legal:</Text> Cuando sea requerido por ley, orden
                  judicial o proceso legal.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Protección de derechos:</Text> Para proteger nuestros derechos,
                  propiedad o seguridad, o la de nuestros usuarios.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Con su consentimiento:</Text> En cualquier otra situación con su
                  consentimiento explícito.
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                6. Retención de Datos
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                Conservamos sus datos personales durante el tiempo necesario para cumplir con los propósitos descritos
                en esta política, a menos que la ley requiera o permita un período de retención más largo. Si elimina
                su cuenta, eliminaremos o anonimizaremos sus datos personales, excepto cuando la ley requiera que los
                conservemos.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                7. Sus Derechos
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed mb-2">
                Usted tiene los siguientes derechos respecto a sus datos personales:
              </Text>
              <View className="pl-3 mb-2">
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Acceso:</Text> Puede solicitar una copia de los datos personales
                  que tenemos sobre usted.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Rectificación:</Text> Puede corregir cualquier dato inexacto o incompleto.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Eliminación:</Text> Puede solicitar que eliminemos sus datos personales.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Portabilidad:</Text> Puede solicitar que transfiramos sus datos a otro
                  proveedor de servicios.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Oposición:</Text> Puede oponerse al procesamiento de sus datos en
                  ciertas circunstancias.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • <Text className="font-semibold">Retirar consentimiento:</Text> Puede retirar su consentimiento en
                  cualquier momento.
                </Text>
              </View>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                Para ejercer estos derechos, puede contactarnos a través de la funcionalidad de feedback disponible en
                la Aplicación.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                8. Cookies y Tecnologías Similares
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso de la aplicación
                y personalizar el contenido. Puede configurar su navegador para rechazar cookies, aunque esto puede
                afectar algunas funcionalidades de la aplicación.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                9. Menores de Edad
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                Nuestra aplicación no está dirigida a menores de 13 años. No recopilamos intencionalmente información
                personal de menores de 13 años. Si descubrimos que hemos recopilado información de un menor de 13 años,
                tomaremos medidas para eliminar esa información.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                10. Cambios a esta política
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                Podemos actualizar esta política de privacidad ocasionalmente. Le notificaremos sobre cambios
                significativos publicando la nueva política en esta página y actualizando la fecha de &quot;Última
                actualización&quot;. Le recomendamos que revise esta política periódicamente.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                11. Contacto
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed mb-2">
                Si tiene preguntas, inquietudes o solicitudes relacionadas con esta política de privacidad o el manejo
                de sus datos personales, puede contactarnos a través de la funcionalidad de feedback disponible en la
                Aplicación.
              </Text>
            </View>

            <View className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-2">
              <Text className="text-sm text-neutral-700 leading-relaxed">
                <Text className="font-semibold">Nota sobre Regulaciones:</Text> Esta política cumple con los principios
                generales de protección de datos. Si reside en la Unión Europea, también se aplican los derechos bajo
                el Reglamento General de Protección de Datos (RGPD). Si reside en Argentina, se aplican los derechos
                bajo la Ley de Protección de Datos Personales (Ley 25.326).
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

