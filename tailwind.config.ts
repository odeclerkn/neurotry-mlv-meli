import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Colores Neurotry
      colors: {
        // Colores primarios (azules de marca)
        primary: {
          900: '#00408a',
          700: '#0250b6',
          500: '#0561ff',
          300: '#02b1ff',
          100: '#04e6e5',
          DEFAULT: '#0561ff',
        },
        // Colores de fondo
        bg: {
          primary: '#f0f4ff',
          secondary: '#f7f9ff',
          white: '#fefefe',
        },
        // Colores neutros
        neutral: {
          900: '#000000',
          600: '#606060',
          400: '#9ca3af',
          200: '#e5e7eb',
          100: '#f3f4f6',
        },
        // Colores semánticos
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
        },
        info: {
          DEFAULT: '#0561ff',
          light: '#dbeafe',
        },
        // Mantener compatibilidad con shadcn/ui
        border: '#e5e7eb',
        input: '#f7f9ff',
        ring: '#0561ff',
        background: '#f0f4ff',
        foreground: '#000000',
        secondary: {
          DEFAULT: '#f7f9ff',
          foreground: '#000000',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#f3f4f6',
          foreground: '#606060',
        },
        accent: {
          DEFAULT: '#0561ff',
          foreground: '#ffffff',
        },
        popover: {
          DEFAULT: '#fefefe',
          foreground: '#000000',
        },
        card: {
          DEFAULT: '#fefefe',
          foreground: '#000000',
        },
      },
      // Tipografía Neurotry
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Montserrat', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      // Border radius Neurotry
      borderRadius: {
        sm: '0.25rem',   // 4px
        DEFAULT: '0.5rem',    // 8px
        md: '0.5rem',    // 8px
        lg: '0.75rem',   // 12px
        xl: '1rem',      // 16px
        '2xl': '1.5rem', // 24px
        full: '9999px',
      },
      // Sombras Neurotry
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 64, 138, 0.05)',
        DEFAULT: '0 4px 6px -1px rgba(0, 64, 138, 0.1), 0 2px 4px -1px rgba(0, 64, 138, 0.06)',
        md: '0 4px 6px -1px rgba(0, 64, 138, 0.1), 0 2px 4px -1px rgba(0, 64, 138, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 64, 138, 0.1), 0 4px 6px -2px rgba(0, 64, 138, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 64, 138, 0.1), 0 10px 10px -5px rgba(0, 64, 138, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 64, 138, 0.25)',
        primary: '0 4px 14px 0 rgba(5, 97, 255, 0.39)',
        'primary-lg': '0 10px 25px 0 rgba(5, 97, 255, 0.35)',
      },
      // Gradientes Neurotry
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0561ff 0%, #02b1ff 50%, #04e6e5 100%)',
        'gradient-dark': 'linear-gradient(135deg, #00408a 0%, #0250b6 100%)',
        'gradient-light': 'linear-gradient(135deg, #f0f4ff 0%, #f7f9ff 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
