// @ts-check
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
const SLICED_LAYERS = ['pages', 'widgets', 'features', 'entities'];

// в flat config правило перекрывается последним блоком, поэтому список нужен целиком
function fsdImportRules(layer) {
  const upperLayers = LAYERS.slice(0, LAYERS.indexOf(layer));

  const patterns = [
    {
      group: SLICED_LAYERS.map((name) => `@${name}/*/*`),
      message: 'Импортируйте слайс через его index.ts: @layer/slice.',
    },
    {
      regex: `^(\\.\\./)+(${LAYERS.join('|')})(/|$)`,
      message: 'Между слоями импортируйте через алиасы @layer/...',
    },
  ];

  if (upperLayers.length > 0) {
    patterns.push({
      group: upperLayers.flatMap((name) => [`@${name}`, `@${name}/*`]),
      message: `Слой ${layer} не может импортировать ${upperLayers.join(', ')}.`,
    });
  }

  return { 'no-restricted-imports': ['error', { patterns }] };
}

export default defineConfig(
  globalIgnores(['dist', 'coverage', 'docs']),

  {
    name: 'project/javascript',
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [js.configs.recommended],
    rules: {
      eqeqeq: ['error', 'always'],
    },
  },

  {
    name: 'project/typescript',
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommendedTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      // для строк нужен ||, чтобы пустая строка тоже заменялась значением по умолчанию
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        { ignorePrimitives: { string: true } },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },

  {
    name: 'project/react',
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite(),
      jsxA11y.configs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  { name: 'fsd/app', files: ['src/app/**'], rules: fsdImportRules('app') },
  { name: 'fsd/pages', files: ['src/pages/**'], rules: fsdImportRules('pages') },
  { name: 'fsd/widgets', files: ['src/widgets/**'], rules: fsdImportRules('widgets') },
  { name: 'fsd/features', files: ['src/features/**'], rules: fsdImportRules('features') },
  { name: 'fsd/entities', files: ['src/entities/**'], rules: fsdImportRules('entities') },
  { name: 'fsd/shared', files: ['src/shared/**'], rules: fsdImportRules('shared') },

  {
    name: 'project/node',
    files: ['*.config.{js,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    name: 'project/javascript-untyped',
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  prettier,
);
