import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}','./components/**/*.{js,ts,jsx,tsx}','./lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT:'#0F1F3D', 2:'#1A2D5A' },
        teal: { DEFAULT:'#0ABFBC', 2:'#07908E' },
        bb: {
          navy:'#0F1F3D', navy2:'#1A2D5A',
          teal:'#0ABFBC', teal2:'#07908E',
          blue:'#1A6EA8', gold:'#F5C242',
          red:'#E53935', green:'#00BFA5',
          bg:'#F0F4F8', border:'#DDE6EF', muted:'#6B82A0'
        }
      },
      fontFamily: {
        sans:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
        display: ['Fraunces', 'serif'],
      }
    }
  },
  plugins: []
}
export default config
