# Self Guided Map - IC 2026

This application is intended to be used for the 2026 International Convention, this application aims to help delegades walk through all the approved locations. This application is built on top or React JS + Vite.

---

## Table of contents

* [Why Vite + React?](#why-vite--react)
* [Features](#features)
* [Prerequisites](#prerequisites)
* [Getting started](#getting-started)

  * [Create the project (if you haven't)](#create-the-project-if-you-havent)
  * [Install dependencies](#install-dependencies)
  * [Available scripts](#available-scripts)
* [Recommended project structure](#recommended-project-structure)
* [Environment variables](#environment-variables)
* [Styling / CSS strategy](#styling--css-strategy)
* [Linting & Formatting](#linting--formatting)
* [Testing](#testing)
* [Building & Deploying](#building--deploying)
* [CI / CD suggestions](#ci--cd-suggestions)
* [Troubleshooting](#troubleshooting)
* [Contributing](#contributing)
* [License](#license)

---

## Why Vite + React?

Vite provides a fast development environment with instant server start and lightning‑fast HMR. Combined with React, it gives a modern DX for building single page applications.

## Features

* Fast dev server using native ES modules
* Hot Module Replacement (HMR)
* Optimized production builds
* Simple configuration and extensibility via plugins
* Works well with TypeScript, Tailwind, PostCSS, and more

## Prerequisites

* Node.js (LTS recommended, e.g. 18.x or newer)
* npm, pnpm, or yarn

## Getting started

### Create the project (if you haven't)

You can scaffold a Vite + React app with the following commands (choose one):

```bash
# npm
npm create vite@latest my-app -- --template react

# TypeScript template
npm create vite@latest my-app -- --template react-ts

# yarn
yarn create vite my-app --template react

# pnpm
pnpm create vite my-app -- --template react
```

Replace `react` with `react-ts` for a TypeScript template.

### Install dependencies

```bash
cd my-app
# npm
npm install

# or yarn
yarn

# or pnpm
pnpm install
```

### Available scripts

Common scripts you should include in `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "format": "prettier --write .",
    "test": "vitest",
    "test:watch": "vitest --watch"
  }
}
```

Run the dev server:

```bash
npm run dev
# or
npm run dev-external
# or
yarn dev
# or
pnpm dev
```

Open `http://localhost:5173` by default.

## Recommended project structure

```
my-app/
├─ public/                # static assets (served at /)
├─ src/
│  ├─ assets/             # images, fonts, etc.
│  ├─ components/   
|  |   ├─ Drawers
|  |   ├─ Maps
|  |   ├─ Navigations
|  |   ├─ props
│  ├─ Data
│  ├─ pages/              # route-level components
│  ├─ layouts/            # layout components
│  ├─ hooks/              # custom React hooks
│  ├─ services/           # API clients, data layer
│  ├─ stores/             # state management (zustand, redux, etc.)
│  ├─ styles/             # global styles, variables
│  ├─ App.jsx / App.tsx
│  ├─ main.jsx / main.tsx
│  └─ types/              # TypeScript types (if using TS)
├─ index.html
├─ package.json
├─ vite.config.js / ts
├─ .eslintrc.cjs
├─ .prettierrc
└─ README.md
```

## Environment variables

Vite exposes environment variables prefixed with `VITE_`.

Create `.env` / `.env.local` and add variables like:

```
VITE_API_BASE_URL=https://api.example.com
VITE_MAP_KEY=abc123
```

Access them in code via `import.meta.env.VITE_API_BASE_URL`.

> **Security note:** Never store secrets that must remain private (server secrets, private keys) in client-side env files.

## Styling / CSS strategy

Options you might choose:

* Plain CSS modules: `Component.module.css`
* Global CSS: `src/styles/global.css`
* Tailwind CSS: works great with Vite (see Tailwind docs)
* CSS-in-JS: styled-components, emotion

Example: adding Tailwind

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Then configure `tailwind.config.js` and include Tailwind directives in your `index.css`.

## Linting & Formatting

Recommended tools:

* ESLint with `eslint-plugin-react`, `@typescript-eslint` (for TS)
* Prettier for formatting

Example minimal `.eslintrc.cjs` for React + TypeScript:

```js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['react', '@typescript-eslint'],
  settings: { react: { version: 'detect' } },
  env: { browser: true, es2021: true, node: true }
};
```

Add a Prettier config (e.g. `.prettierrc`) and a `.gitignore` that excludes `node_modules`, `dist`, and `.env*`.

## Testing

Suggested tools:

* [Vitest](https://vitest.dev/) (fast unit test runner compatible with Vite)
* [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) for component tests

Install:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Add a `vitest.config.ts` (or `vite.config.ts`) configuration and use `npm test`.

Example simple test script in `package.json`:

```json
"test": "vitest run"
```

## Building & Deploying

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Deploy targets

* **Vercel**: `vite` projects deploy with zero config. Connect repo and set build command `npm run build` and output directory `dist`.

## CI / CD suggestions

A simple GitHub Actions workflow:

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm run test
      - name: Build
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist
```

Adjust jobs for caching, code scanning, and publishing to your hosting provider.

## Troubleshooting

**Dev server not starting / port in use**

* Kill processes using the port or change `--port` in the `dev` script.

**HMR not working**

* Check console for CORS or proxy errors.
* Ensure code uses module boundaries (no large sync transforms that block HMR).

**Build errors**

* Read stack traces carefully; missing polyfills or incorrect imports are common.
* If a dependency relies on Node built-ins, consider `@rollup/plugin-node-resolve` or a polyfill.

## Contributing

1. Fork repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes, write tests
4. Run `npm run lint`, `npm run test`
5. Open a PR describing the change

Follow conventional commit messages if your project uses them.

## Useful tips & links

* Vite docs: [https://vitejs.dev](https://vitejs.dev)
* React docs: [https://reactjs.org](https://reactjs.org)
* Vitest docs: [https://vitest.dev](https://vitest.dev)
* Tailwind CSS docs: [https://tailwindcss.com](https://tailwindcss.com)

## License

```
MIT © SG Maps Team
```

---
