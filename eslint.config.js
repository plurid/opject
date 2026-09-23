import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
    globalIgnores([
        '**/distribution/**', '**/dist/**', '**/coverage/**', '.venv*/**',
        '.uv-cache/**', '.pnpm-store/**', '.cache/**',
        'packages/registry/**', 'packages/javascript/*/tests/**',
    ]),
    js.configs.recommended,
    {
        files: ['**/*.{js,mjs,ts,cts}'],
        languageOptions: { globals: globals.node },
    },
    {
        files: ['**/*.{ts,cts}'],
        extends: [tseslint.configs.recommended],
        rules: {
            // Objects passed over the wire intentionally have caller-defined shapes.
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
        },
    },
]);
