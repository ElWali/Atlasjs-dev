import { terser } from 'rollup-plugin-terser';

export default {
  input: 'index.js',
  output: [
    {
      file: 'dist/atlas-v2.js',
      format: 'umd',
      name: 'atlas',
      sourcemap: true,
    },
    {
      file: 'dist/atlas-v2.min.js',
      format: 'umd',
      name: 'atlas',
      sourcemap: true,
      plugins: [terser()],
    },
  ],
};