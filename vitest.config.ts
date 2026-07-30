import { defineConfig, configDefaults } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    exclude: [...configDefaults.exclude, '**/tests/e2e/**'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
