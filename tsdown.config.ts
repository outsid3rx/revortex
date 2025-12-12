import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts', './src/wrapper.ts'],
  format: ['cjs', 'esm'],
  target: 'node20',
  dts: true,
})