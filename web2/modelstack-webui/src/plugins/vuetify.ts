/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          error: '#ef4444',
          warning: '#f59e0b',
          info: '#3b82f6',
          success: '#22c55e',
          background: '#fafafa',
          surface: '#ffffff',
          'surface-variant': '#f4f4f5',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#818cf8',
          secondary: '#a78bfa',
          accent: '#22d3ee',
          error: '#f87171',
          warning: '#fbbf24',
          info: '#60a5fa',
          success: '#4ade80',
          background: '#0a0a0a',
          surface: '#18181b',
          'surface-variant': '#27272a',
        },
      },
    },
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
    },
    VCard: {
      rounded: 'lg',
    },
    VChip: {
      rounded: 'lg',
    },
    VTextField: {
      rounded: 'lg',
    },
    VTooltip: {
      contentClass: 'custom-tooltip',
    },
  },
})
