import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';

const packageJson = require('./package.json');

export default [
  // Main build
  {
    input: 'package.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [
      peerDepsExternal(),
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/__tests__/**', '**/*.test.*']
      }),
      postcss({
        extract: false,
        inject: true,
        minimize: true
      }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ],
    external: ['react', 'react-dom', 'framer-motion']
  },
  
  // Components build
  {
    input: 'exports/components.ts',
    output: [
      {
        file: 'dist/components.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/components.esm.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [
      peerDepsExternal(),
      resolve({ browser: true }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/__tests__/**', '**/*.test.*']
      }),
      postcss({ extract: false, inject: true }),
      terser()
    ],
    external: ['react', 'react-dom', 'framer-motion']
  },
  
  // Controls build
  {
    input: 'exports/controls.ts',
    output: [
      {
        file: 'dist/controls.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/controls.esm.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [
      peerDepsExternal(),
      resolve({ browser: true }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/__tests__/**', '**/*.test.*']
      }),
      postcss({ extract: false, inject: true }),
      terser()
    ],
    external: ['react', 'react-dom', 'framer-motion']
  },
  
  // Utils build
  {
    input: 'exports/utils.ts',
    output: [
      {
        file: 'dist/utils.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/utils.esm.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [
      peerDepsExternal(),
      resolve({ browser: true }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/__tests__/**', '**/*.test.*']
      }),
      terser()
    ],
    external: ['react', 'react-dom']
  },
  
  // Presets build
  {
    input: 'exports/presets.ts',
    output: [
      {
        file: 'dist/presets.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/presets.esm.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [
      peerDepsExternal(),
      resolve({ browser: true }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/__tests__/**', '**/*.test.*']
      }),
      terser()
    ],
    external: ['react', 'react-dom']
  },
  
  // Type declarations
  {
    input: 'package.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: [/\.css$/]
  },
  
  // Component type declarations
  {
    input: 'exports/components.ts',
    output: [{ file: 'dist/components.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: [/\.css$/]
  },
  
  // Controls type declarations
  {
    input: 'exports/controls.ts',
    output: [{ file: 'dist/controls.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: [/\.css$/]
  },
  
  // Utils type declarations
  {
    input: 'exports/utils.ts',
    output: [{ file: 'dist/utils.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: [/\.css$/]
  },
  
  // Types only declarations
  {
    input: 'exports/types.ts',
    output: [{ file: 'dist/types.d.ts', format: 'esm' }],
    plugins: [dts()]
  },
  
  // Presets type declarations
  {
    input: 'exports/presets.ts',
    output: [{ file: 'dist/presets.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: [/\.css$/]
  }
];