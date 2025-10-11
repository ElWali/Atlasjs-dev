import { terser } from 'rollup-plugin-terser';

export default {
  input: 'index.js',
  output: [
    {
      file: '../jules-scratch/verification/atlas.v2.bundle.js',
      format: 'umd',
      name: 'atlas',
      sourcemap: true,
    },
  ],
};