import type { Preview } from '@storybook/react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#ffffff' },
        { name: 'surface-alt', value: '#f5f5f7' },
        { name: 'mx-black', value: '#0a0a0a' },
      ],
    },
    a11y: {
      element: '#storybook-root',
      manual: false,
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default preview
