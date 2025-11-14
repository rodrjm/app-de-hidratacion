/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nueva paleta "Tomá bien, che!"
        primary: {
          DEFAULT: '#F3F7F8', // Blanco Roto - Fondo principal
          50: '#F3F7F8',
          100: '#E8F0F2',
          200: '#D1E1E5',
          300: '#BAD2D8',
          400: '#A3C3CB',
          500: '#8CB4BE',
          600: '#7595A1',
          700: '#5E7684',
          800: '#475767',
          900: '#30384A',
        },
        secondary: {
          DEFAULT: '#17A24A', // Verde Esmeralda Oscuro - Botones de acción
          50: '#E8F5ED',
          100: '#C8E6D1',
          200: '#A5D6B3',
          300: '#81C694',
          400: '#66BB7A',
          500: '#17A24A',
          600: '#138F3F',
          700: '#0F7C35',
          800: '#0B692B',
          900: '#075620',
        },
        accent: {
          DEFAULT: '#007BFF', // Azul Ciel - Enlaces y elementos interactivos
          50: '#E6F2FF',
          100: '#B3D9FF',
          200: '#80C0FF',
          300: '#4DA7FF',
          400: '#1A8EFF',
          500: '#007BFF',
          600: '#0066CC',
          700: '#005299',
          800: '#003D66',
          900: '#002833',
        },
        neutral: {
          DEFAULT: '#343A40', // Gris Oscuro - Tipografía
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#6C757D',
          600: '#495057',
          700: '#343A40',
          800: '#212529',
          900: '#1A1D20',
        },
        chart: {
          DEFAULT: '#B1DCCF', // Verde Menta - Meta cumplida en gráficos
          50: '#F0F9F6',
          100: '#E1F3ED',
          200: '#C2E7DB',
          300: '#B1DCCF',
          400: '#A0D1C3',
          500: '#8FC6B7',
          600: '#7EBBAB',
          700: '#6DB09F',
          800: '#5CA593',
          900: '#4B9A87',
        },
        success: '#17A24A',
        warning: {
          DEFAULT: '#FFC107',
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFC107',
          600: '#FFB300',
          700: '#FFA000',
          800: '#FF8F00',
          900: '#FF6F00',
        },
        error: {
          DEFAULT: '#DC3545',
          50: '#FCE4E6',
          100: '#F8BBD0',
          200: '#F48FB1',
          300: '#F06292',
          400: '#EC407A',
          500: '#DC3545',
          600: '#C62828',
          700: '#B71C1C',
          800: '#9E1A1A',
          900: '#7F1A1A',
        },
        info: '#007BFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 6px rgba(0, 0, 0, 0.1)', // Nueva sombra para tarjetas
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.1)',
        'card': '0 4px 6px rgba(0, 0, 0, 0.1)', // Sombra específica para tarjetas
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [
    // Plugins opcionales de Tailwind - descomentar si los necesitas
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
    // require('@tailwindcss/aspect-ratio'),
  ],
}
