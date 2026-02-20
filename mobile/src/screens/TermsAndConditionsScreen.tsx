import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import HeaderAppLogo from "../components/HeaderAppLogo";

export default function TermsAndConditionsScreen() {
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
            <Ionicons name="document-text-outline" size={22} color="#6366F1" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-display font-bold text-neutral-800">
              Términos y condiciones de uso
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
                1. Aceptación de los Términos
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                Al acceder y utilizar la aplicación &quot;Dosis Vital: Tu aplicación de hidratación personal&quot;
                (en adelante, &quot;la Aplicación&quot;), usted acepta estar sujeto a estos Términos y Condiciones
                de Uso. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar la Aplicación.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                2. Descargo de Responsabilidad Médica
              </Text>
              <View className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-2">
                <Text className="text-xs font-display font-semibold text-yellow-800 mb-1">
                  ⚠️ IMPORTANTE - LEA CUIDADOSAMENTE
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed mb-2">
                  <Text className="font-semibold">
                    La Aplicación NO sustituye el consejo, diagnóstico o tratamiento médico profesional.
                  </Text>{" "}
                  Las recomendaciones de hidratación proporcionadas por la Aplicación se basan en algoritmos generales
                  y fórmulas científicas estándar, pero no tienen en cuenta todas las condiciones médicas individuales,
                  medicamentos o circunstancias de salud específicas.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed mb-1">
                  <Text className="font-semibold">Usted reconoce y acepta que:</Text>
                </Text>
                <View className="pl-3">
                  <Text className="text-sm text-neutral-700 leading-relaxed">• La Aplicación es una herramienta de referencia y seguimiento, no un servicio médico.</Text>
                  <Text className="text-sm text-neutral-700 leading-relaxed">
                    • Debe consultar con un médico o profesional de la salud calificado antes de realizar cambios
                    significativos en su ingesta de líquidos, especialmente si tiene condiciones médicas preexistentes.
                  </Text>
                  <Text className="text-sm text-neutral-700 leading-relaxed">
                    • Si experimenta síntomas de deshidratación, sobrehidratación o cualquier problema de salud, debe
                    buscar atención médica inmediata.
                  </Text>
                  <Text className="text-sm text-neutral-700 leading-relaxed">
                    • Los desarrolladores de la Aplicación no se hacen responsables de decisiones médicas tomadas
                    basándose únicamente en la información proporcionada por la Aplicación.
                  </Text>
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                3. Uso de la Aplicación
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed mb-2">
                La Aplicación está diseñada para ayudarle a realizar un seguimiento de su consumo de líquidos y
                proporcionar recomendaciones generales de hidratación. Usted se compromete a:
              </Text>
              <View className="pl-3">
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • Proporcionar información precisa y veraz sobre su peso, edad, nivel de actividad y otros datos solicitados.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • Utilizar la Aplicación de manera responsable y conforme a la ley.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • No utilizar la Aplicación para fines ilegales o no autorizados.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • No intentar acceder a áreas restringidas de la Aplicación o interferir con su funcionamiento.
                </Text>
                <Text className="text-sm text-neutral-700 leading-relaxed">
                  • Mantener la confidencialidad de su cuenta y contraseña.
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                4. Cuentas de Usuario
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                Para utilizar ciertas funcionalidades de la Aplicación, debe crear una cuenta. Usted es responsable de
                mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran bajo
                su cuenta. Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                5. Propiedad Intelectual
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                Todo el contenido de la Aplicación, incluyendo pero no limitado a textos, gráficos, logos, iconos,
                imágenes y software, es propiedad de los desarrolladores o sus licenciantes y está protegido por leyes
                de propiedad intelectual. No puede reproducir, distribuir, modificar o crear obras derivadas sin
                autorización previa por escrito.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                6. Limitación de Responsabilidad
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                En la máxima medida permitida por la ley, los desarrolladores de la Aplicación no serán responsables de
                ningún daño directo, indirecto, incidental, especial, consecuente o punitivo que resulte del uso o la
                imposibilidad de usar la Aplicación, incluyendo pero no limitado a daños relacionados con la salud.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                7. Modificaciones de los Términos
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán
                en vigor inmediatamente después de su publicación. Su uso continuado de la Aplicación después de
                cualquier modificación constituye su aceptación de los nuevos términos.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                8. Terminación
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                Podemos terminar o suspender su acceso a la Aplicación en cualquier momento, con o sin causa, con o sin
                previo aviso, por cualquier motivo, incluyendo la violación de estos términos.
              </Text>
            </View>

            <View className="mb-2">
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                9. Ley Aplicable
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed mb-2">
                Estos términos se regirán e interpretarán de acuerdo con las leyes de Argentina, sin tener en cuenta
                sus disposiciones sobre conflictos de leyes.
              </Text>
              <Text className="text-base font-display font-bold text-neutral-800 mb-2">
                10. Contacto
              </Text>
              <Text className="text-sm text-neutral-700 leading-relaxed">
                Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos a través de la funcionalidad
                de feedback disponible en la Aplicación.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

