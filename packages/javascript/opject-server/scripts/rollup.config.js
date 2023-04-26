import ttypescript from 'ttypescript';
import commonjs from '@rollup/plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';

const pkg = require('../package.json');



export default {
    input: 'source/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'cjs',
            sourcemap: true,
            exports: 'default',
        },
        {
            file: pkg.module,
            format: 'es',
            sourcemap: true,
            exports: 'default',
        },
    ],
    external: [
        '@plurid/deon',
        '@plurid/plurid-functions',
        'path',
        'fs',
        'express',
        'body-parser',
        'crypto',
    ],
    watch: {
        include: 'source/**',
    },
    plugins: [
        typescript({
            typescript: ttypescript,
            rollupCommonJSResolveHack: true,
            clean: true,
        }),
        commonjs(),
        sourceMaps(),
        terser({
            mangle: false,
            compress: false,
            format: {
                beautify: true,
                comments: false,
            },
        }),
    ],
};
