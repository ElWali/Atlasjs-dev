import { terser } from 'rollup-plugin-terser';

export default {
  input: 'atlas.js',
  output: [
    {
      file: 'atlas.bundle.js',
      format: 'umd',
      name: 'atlas',
      sourcemap: true,
    },
    {
      file: 'atlas.min.js',
      format: 'umd',
      name: 'atlas',
      sourcemap: true,
      plugins: [terser()],
    },
  ],
};