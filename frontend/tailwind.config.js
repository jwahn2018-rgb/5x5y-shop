/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#ffffff',
          600: '#e5e5e5',
          700: '#d4d4d4',
          800: '#a3a3a3',
          900: '#737373',
        },
        dark: {
          50: '#1a1a1a',   // 메인 배경 (무신사 스타일)
          100: '#2a2a2a',  // 카드 배경
          200: '#1f1f1f',  // 입력 필드 배경
          300: '#3a3a3a',  // 호버 상태
          400: '#4a4a4a',  // 테두리
          500: '#5a5a5a',  // 더 밝은 테두리
          600: '#2a2a2a',  // 헤더/푸터 배경
          700: '#353535',  // 호버 배경
          800: '#404040',  // 테두리 (호버)
          900: '#0f0f0f',  // 더 어두운 배경
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

