import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      colors: {
        // Portal (light) theme
        portal: {
          bg: '#F7F6F2',
          surface: '#FFFFFF',
          surface2: '#F2F1ED',
          border: '#E4E2DA',
          border2: '#D0CEC5',
          text: '#1C1B18',
          text2: '#6B6860',
          text3: '#9E9C95',
          accent: '#6B5FE4',
          'accent-light': '#EDEAFD',
          'accent-mid': '#C4BEFC',
          green: '#1A7A52',
          'green-bg': '#E3F4EC',
          amber: '#8A5A00',
          'amber-bg': '#FEF3DC',
          red: '#C0392B',
          'red-bg': '#FDECEA',
          blue: '#1A5F9A',
          'blue-bg': '#E3EFFE',
        },
        // Admin (dark) theme
        admin: {
          bg: '#0F0F11',
          surface: '#1A1A1F',
          surface2: '#222228',
          surface3: '#2A2A32',
          border: '#2E2E38',
          border2: '#3A3A46',
          text: '#F0EFE8',
          text2: '#9B9A94',
          text3: '#5E5D58',
          accent: '#7B6EF6',
          'accent-dim': '#3D3680',
          'accent-light': '#2A2550',
          green: '#34C77B',
          'green-dim': '#1A6340',
          'green-bg': '#122B1E',
          amber: '#F0A429',
          'amber-dim': '#7A5010',
          'amber-bg': '#2A1E08',
          red: '#F05252',
          'red-dim': '#7A2020',
          'red-bg': '#2A1010',
          blue: '#4A9EF5',
          'blue-bg': '#0E1E35',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        md: '0 4px 12px rgba(0,0,0,.08)',
      },
    },
  },
  plugins: [],
}

export default config
