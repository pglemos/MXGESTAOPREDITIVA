import type { StorybookConfig } from '@storybook/react-vite'
import path from 'node:path'

// Storybook 8 carrega main.ts via esbuild-register (CJS bridge), portanto
// __dirname está disponível em runtime — usar path.resolve relativo.
const projectRoot = path.resolve(__dirname, '..')

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
  viteFinal: async (config) => {
    // Garantir que o alias @ resolve para src/
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@': path.resolve(projectRoot, 'src'),
    }
    return config
  },
}

export default config
