/**
 * Standalone tsdown config: node-half library only.
 *
 * The plugin emits plain ESM the host Loader imports. Official
 * @deepseek-ai/* packages are provided by the profile's pnpm closure at
 * mount time; leave them external so lib/index.js imports resolve at runtime.
 */
import { defineConfig } from 'tsdown'

export default defineConfig({
  name: 'dsh-pwa',
  entry: ['src/index.ts', 'src/invariant.ts'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: false,
  clean: false,
  external: [/^@deepseek-ai\//],
})