# IC 2026 Indoor Navigation System

An interactive indoor navigation application designed for the 2026 International Convention at Ayala Malls. This system helps delegates navigate through multiple floors with real-time pathfinding, voice search, and multi-floor route planning.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff.svg)](https://vitejs.dev/)
[![MUI](https://img.shields.io/badge/MUI-7-007fff.svg)](https://mui.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 📖 Documentation

### Quick Links
- [🚀 Getting Started](#getting-started) - Installation and setup
- [🏗️ Architecture](#architecture) - System design overview
- [🎯 Core Features](#core-features) - Main functionality
- [🐛 Troubleshooting](#troubleshooting) - Common issues and solutions

### Code Documentation
- [🪝 **Custom Hooks**](./src/hooks/README.md) - React hooks for navigation, routing, and data management
- [🗺️ **Routing System**](./src/routing/README.md) - Pathfinding algorithms (A*, Dijkstra)
- [🧩 **Components**](./src/components/README.md) - Reusable UI components
- [💾 **State Management**](./src/store/README.md) - Zustand stores (Map, Search, Drawer)
- [📐 **Type Definitions**](./src/types/README.md) - TypeScript interfaces and types
- [🛠️ **Utilities**](./src/routing/utils/README.md) - Helper functions and tools

### Additional Resources
- [📊 Data Structure](./src/Data/README.md) - Floor data format and schema
- [🎨 Styling Guide](./src/styles/README.md) - Theme and styling conventions
- [🤝 Contributing](./CONTRIBUTING.md) - How to contribute to the project

---

## Table of Contents

* [Features](#features)
* [Technology Stack](#technology-stack)
* [Prerequisites](#prerequisites)
* [Getting Started](#getting-started)
* [Project Structure](#project-structure)
* [Core Features](#core-features)
* [Architecture](#architecture)
* [Configuration](#configuration)
* [Development](#development)
* [Building & Deploying](#building--deploying)
* [Troubleshooting](#troubleshooting)
* [Contributing](#contributing)
* [License](#license)

---

## Features

### 🧭 Navigation & Pathfinding
- **Multi-floor routing** with intelligent vertical connector selection (stairs, elevators)
- **A* and Dijkstra algorithms** for optimal path calculation
- **Real-time route visualization** on interactive SVG maps
- **Pre-calculated route caching** for instant navigation
- **Smart entrance resolution** with multiple entrance support

### 🎨 User Interface
- **Voice search** for hands-free navigation
- **Lazy-loaded search** with infinite scroll
- **Floor selector** with visual floor cards
- **Responsive design** optimized for mobile and tablet
- **Touch-friendly map controls** with zoom and pan
- **Route step indicators** for multi-floor journeys

### ⚡ Performance
- **Efficient data loading** with code splitting per floor
- **Route caching** (memory + localStorage) for repeated queries
- **Optimized re-renders** using Zustand state management
- **Preloaded vertical connectors** for faster multi-floor routing

---

## Technology Stack

### Frontend Framework
- **React 19** - UI library with concurrent features
- **Vite 7** - Lightning-fast build tool and dev server
- **TypeScript 5.6** - Type safety and developer experience

### UI & Styling
- **Material-UI (MUI) 7** - Comprehensive component library
- **Emotion** - Performant CSS-in-JS styling
- **React Icons** - Popular icon library
- **Framer Motion** - Smooth animations

### State Management
- **Zustand** - Lightweight state management
  - [`MapStore`](./src/store/README.md#mapstore) - Map state, active routes, multi-floor routing
  - [`SearchStore`](./src/store/README.md#searchstore) - Search queries, points A/B
  - [`DrawerStore`](./src/store/README.md#drawerstore) - UI drawer states

### Mapping & Navigation
- **React Leaflet** - Interactive map rendering
- **[Custom pathfinding](./src/routing/README.md)** - A* and Dijkstra implementations
- **SVG path parsing** - Building and boundary rendering
- **Polylabel** - Optimal label positioning

### Utilities
- **Axios** - HTTP client for data fetching
- **D3-shape** - Advanced path calculations
- **React Router DOM** - Client-side routing

---

## Prerequisites

- **Node.js 18.x or newer** (LTS recommended)
- **npm, pnpm, or yarn** package manager
- Modern browser with ES modules support (Chrome 90+, Firefox 88+, Safari 15+)

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Available Scripts

```bash
# Start development server (localhost only)
npm run dev

# Start development server (accessible on network)
npm run dev-external

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code with Prettier
npm run format

# Type check
npm run type-check
```

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

For network access (test on mobile devices):
```bash
npm run dev-external
```

---

## Project Structure

```
ic_map_navigator/
├─ public/                    # Static assets
├─ src/
│  ├─ components/             # 🧩 React components
│  │  ├─ common/              # Reusable components (loaders, chips)
│  │  ├─ drawers/             # Direction panel, floor selector
│  │  ├─ map/                 # Map rendering components
│  │  ├─ navigation/          # Search bar, bottom nav, floating icons
│  │  └─ props/               # Utility components (voice search)
│  │  └─ README.md            # 📖 Component documentation
│  ├─ Data/                   # 📊 Floor and map data
│  │  ├─ AyalaMalls/          # Floor data (maps, nodes, labels)
│  │  │  ├─ GroundFloor/
│  │  │  ├─ SecondFloor/
│  │  │  ├─ ThirdFloor/
│  │  │  ├─ FourthFloor/
│  │  │  ├─ FifthFloor/
│  │  │  └─ connectors/       # Vertical connectors (stairs, elevators)
│  │  ├─ unique_types.json    # Place categories
│  │  └─ README.md            # 📖 Data structure documentation
│  ├─ hooks/                  # 🪝 Custom React hooks
│  │  ├─ useFloorData.ts      # Floor data management
│  │  ├─ useLazyMapData.ts    # Lazy loading + search
│  │  ├─ useRouteMapHandler.ts # Route calculation logic
│  │  └─ README.md            # 📖 Hooks documentation
│  ├─ pages/                  # 📄 Page components
│  │  └─ IndoorMap.tsx        # Main map page
│  ├─ routing/                # 🗺️ Pathfinding system
│  │  ├─ algorithms/
│  │  │  ├─ routing.ts        # Core pathfinding (A*, Dijkstra)
│  │  │  └─ README.md         # 📖 Algorithm documentation
│  │  └─ utils/               # 🛠️ Routing utilities
│  │     ├─ Constants.ts      # Floor definitions
│  │     ├─ mapLoader.ts      # Dynamic map data loading
│  │     ├─ MinHeap.ts        # Priority queue for pathfinding
│  │     ├─ Normalizer.ts     # Floor name normalization
│  │     ├─ routeCache.ts     # Route caching system
│  │     ├─ verticalProcessor.ts # Multi-floor routing
│  │     └─ README.md         # 📖 Utils documentation
│  ├─ store/                  # 💾 State management
│  │  ├─ DrawerStore.ts       # Drawer/panel state
│  │  ├─ MapStore.ts          # Map, routes, active nodes
│  │  ├─ SearchStore.ts       # Search queries, points
│  │  └─ README.md            # 📖 Store documentation
│  ├─ styles/                 # 🎨 Styling
│  │  ├─ theme.ts             # MUI theme configuration
│  │  ├─ layoutStyles.ts      # Layout styles
│  │  └─ README.md            # 📖 Styling guide
│  ├─ types/                  # 📐 TypeScript types
│  │  ├─ index.ts             # Type definitions
│  │  └─ README.md            # 📖 Type documentation
│  ├─ App.tsx                 # Root component
│  └─ main.tsx                # Entry point
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ CONTRIBUTING.md            # 🤝 Contribution guidelines
└─ README.md                  # 📖 This file
```

---

## Core Features

### 1. 🧮 Pathfinding System

> **Detailed documentation**: [Routing Algorithms](./src/routing/README.md)

**Algorithms:**
- **A\* Algorithm** - Point-to-point optimal pathfinding with heuristic
- **Dijkstra's Algorithm** - Single-source shortest paths for multi-destination queries

**Key Components:**
- `PathfindingAlgorithm` - Base class with adjacency list building
- `AStarPathfinder` - A* implementation with priority queue
- `DijkstraPathfinder` - Dijkstra implementation
- `EntranceResolver` - Maps entrances to path nodes
- `PlaceFinder` - Resolves place IDs and names
- `GraphRouter` - Main routing orchestrator

Learn more: [Routing System Documentation](./src/routing/README.md)

### 2. 🏢 Multi-Floor Routing

> **Detailed documentation**: [Multi-Floor Hooks](./src/hooks/README.md#usemultifloorpathfinding)

**Process:**
1. User selects origin and destination on different floors
2. User chooses vertical connector (stairs, elevator, escalator)
3. System calculates route segments using BFS:
   - Floor A: Origin → Connector entrance
   - Vertical transition
   - Floor B: Connector exit → Destination
4. Routes are pre-calculated and cached for instant display
5. User navigates floor-by-floor with visual indicators

**Key Components:**
- [`verticalProcessor.ts`](./src/routing/utils/README.md#verticalprocessor) - Finds vertical connectors
- [`useMultiFloorPathfinding`](./src/hooks/README.md#usemultifloorpathfinding) - BFS floor traversal
- [`useMultiFloorRouteBuilder`](./src/hooks/README.md#usemultifloorroutebuilder) - Step generation
- [`MapStore.multiFloorRoute`](./src/store/README.md#multi-floor-state) - Tracks current step

Learn more: [Multi-Floor Navigation Guide](./src/hooks/README.md#multi-floor-routing)

### 3. 💾 Route Caching

> **Detailed documentation**: [Route Cache Utils](./src/routing/utils/README.md#routecache)

**Two-tier caching strategy:**
- **Memory cache** (Map) - Fast, session-based
- **localStorage** - Persistent across sessions
- **5-minute TTL** with automatic expiration cleanup
- **Bidirectional caching** - Supports reverse routes
- **Pre-calculation** - Multi-floor routes cached before navigation

Learn more: [Caching Strategy](./src/routing/utils/README.md#caching)

### 4. 🔍 Search System

> **Detailed documentation**: [Search Hooks](./src/hooks/README.md#uselazymapdata)

**Features:**
- Debounced search (300ms) for performance
- Lazy loading with infinite scroll
- Voice search integration (Web Speech API)
- Recent searches cache
- Type-based filtering (stores, restaurants, etc.)
- Smart deduplication by name

**Components:**
- `SearchInput.tsx` - Autocomplete search bar
- [`useLazyMapData.ts`](./src/hooks/README.md#uselazymapdata) - Chunk-based data loading
- [`SearchStore.ts`](./src/store/README.md#searchstore) - Query and results state

Learn more: [Search System Documentation](./src/hooks/README.md#lazy-loading-with-search)

### 5. 🗺️ Map Rendering

**Layers (rendered in order):**
1. SVG paths for buildings and boundaries
2. Nodes for navigation graph (debugging)
3. Entrances with visual markers
4. Active route highlighting
5. Place labels (building marks, road marks)

**Interactions:**
- Zoom and pan controls (Leaflet)
- Touch gestures support
- Floor switching with animation
- Place selection and highlighting
- Route visualization

Learn more: [Map Components](./src/components/README.md#map-components)

---

## Architecture

> **Full documentation**: [Architecture Overview](./docs/architecture.md)

### State Management (Zustand)

**MapStore** ([documentation](./src/store/README.md#mapstore)):
```typescript
{
  highlightedPlace: IPlace;
  activeNodeIds: string[];
  multiFloorRoute: {
    isActive: boolean;
    currentStep: number;
    steps: RouteStep[];
    preCalculatedRoutes: Map<string, string[]>;
    finalDestination: IMapItem | null;
  };
  selectedFloorMap: string;
  isCalculatingRoute: boolean;
}
```

**SearchStore** ([documentation](./src/store/README.md#searchstore)):
```typescript
{
  query: string;
  pointA: IMapItem | null;
  pointB: IMapItem | null;
  displayOptions: IMapItem[];
  recentSearches: IMapItem[];
}
```

**DrawerStore** ([documentation](./src/store/README.md#drawerstore)):
```typescript
{
  isExpanded: boolean;
  isFloorMapOpen: boolean;
  isDirectionPanelOpen: boolean;
  isLoading: boolean;
}
```

### Data Flow

```
1. Map Loading:
   loadMapData() → Dynamic import → setFloorData()

2. Search:
   User input → Debounce → search() → displayOptions → UI

3. Route Calculation (Same Floor):
   routeMapHandler() → GraphRouter.findPathBetweenPlaces() → activeNodeIds

4. Route Calculation (Multi-Floor):
   handleMultiFloorRoute() → findMultiFloorPath() → buildRouteSteps() →
   preCalculateRoutes() → setMultiFloorRoute() → Step-by-step rendering

5. Rendering:
   State change → React re-render → SVG/Component update
```

Learn more: [Detailed Architecture](./docs/architecture.md)

---

## Configuration

### Floor Configuration

See [`Constants.ts`](./src/routing/utils/README.md#constants) for floor definitions:

```typescript
export const floors: Floors[] = [
  {
    key: 'ground',
    name: 'Ground Floor',
    location: 'Ayala Malls',
    aliases: ['Ayala Malls Ground Floor', '1F', 'GF'],
    assets: {},
  },
  // ... other floors
];
```

### Theme Configuration

See [Styling Guide](./src/styles/README.md) for theme customization.

### Vite Configuration

- Path aliases (`@/` → `src/`)
- Build optimizations
- Dev server settings
- Environment variables

---

## Development

### Adding a New Floor

> **Full guide**: [Adding Floors](./src/Data/README.md#adding-new-floors)

1. Create floor directory: `src/Data/AyalaMalls/SixthFloor/`
2. Add data files:
   - `SixthFloor.json` - Place definitions
   - `SixthFloorNodes.json` - Navigation graph
   - `SixthFloorLabels.json` - Labels and marks
3. Update [`Constants.ts`](./src/routing/utils/Constants.ts) with floor entry
4. Update [`mapLoader.ts`](./src/routing/utils/mapLoader.ts) switch case
5. Add vertical connectors in `connectors/Verticals.json`

### Adding Place Types

> **Full guide**: [Place Types](./src/Data/README.md#place-types)

1. Add type to `unique_types.json`
2. Create icon mapping in `ChipsIconMapper.tsx`
3. Update type filter chips

### Custom Hooks Development

> **Full guide**: [Hooks Documentation](./src/hooks/README.md)

When creating new hooks:
- Follow Single Responsibility Principle
- Use TypeScript for type safety
- Include proper error handling
- Add documentation with usage examples
- Consider performance implications

### Debugging

**Enable console logs in:**
- [`routing.ts`](./src/routing/README.md) - Pathfinding steps
- [`IndoorMap.tsx`](./src/pages/) - Multi-floor transitions
- [`routeCache.ts`](./src/routing/utils/README.md#routecache) - Cache hits/misses
- [`useMultiFloorContinuation.ts`](./src/hooks/README.md#usemultifloorcontinuation) - Route progression

**Tools:**
- React DevTools - Component inspection
- Zustand DevTools - State tracking
- Redux DevTools - Time travel debugging
- Network tab - Data loading

---

## Building & Deploying

### Production Build

```bash
npm run build
```

Output: `dist/` directory (optimized, minified, tree-shaken)

### Preview Build Locally

```bash
npm run preview
```

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

#### AWS S3 + CloudFront
```bash
# Upload dist/ to S3 bucket
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

#### GitHub Pages
```bash
# Install gh-pages
npm i -D gh-pages

# Add to package.json
"scripts": {
  "deploy": "gh-pages -d dist"
}

# Deploy
npm run deploy
```

**Build Configuration:**
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18+
- Environment variables: Set in platform dashboard

---

## Troubleshooting

> **Full guide**: [Troubleshooting Guide](./docs/troubleshooting.md)

### Common Issues

#### Route not calculating
- ✅ Check if places have valid `entranceNodes`
- ✅ Verify nodes are connected in graph
- ✅ Check console for pathfinding errors
- ✅ See [Routing Troubleshooting](./src/routing/README.md#troubleshooting)

#### Multi-floor routing fails
- ✅ Ensure vertical connectors are defined in `Verticals.json`
- ✅ Check floor names match between data and `Constants.ts`
- ✅ Verify `from`/`to` IDs in connector definitions
- ✅ See [Multi-Floor Troubleshooting](./src/hooks/README.md#troubleshooting)

#### Search not showing results
- ✅ Check `mapLoader.ts` for correct data imports
- ✅ Verify JSON structure matches `IMapItem` type
- ✅ Clear localStorage cache: `localStorage.clear()`
- ✅ See [Search Troubleshooting](./src/hooks/README.md#lazy-loading-not-working)

#### Map not rendering
- ✅ Check SVG path data format
- ✅ Verify coordinate system consistency
- ✅ Inspect browser console for errors
- ✅ Check Leaflet configuration

#### Performance issues
- ✅ Use React DevTools Profiler
- ✅ Monitor Zustand state updates
- ✅ Check for unnecessary re-renders
- ✅ Optimize large SVG paths
- ✅ See [Performance Guide](./docs/performance.md)

---

## Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Start

1. Fork repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Follow code style (Prettier + ESLint)
4. Test thoroughly on multiple floors
5. Write meaningful commit messages
6. Open PR with description

### Code Standards

- ✅ Use TypeScript for all new files
- ✅ Follow component structure conventions
- ✅ Add JSDoc comments for complex functions
- ✅ Update types in [`types/index.ts`](./src/types/README.md)
- ✅ Write unit tests for utilities
- ✅ Update relevant documentation

### Development Workflow

```bash
# Create branch
git checkout -b feature/my-feature

# Make changes
# ...

# Format and lint
npm run format
npm run lint

# Test
npm run test

# Commit
git commit -m "feat: add new feature"

# Push
git push origin feature/my-feature
```

---

## Useful Links

### Documentation
- [React Documentation](https://react.dev) - UI library
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type system
- [Vite Documentation](https://vitejs.dev) - Build tool

### Libraries
- [MUI Components](https://mui.com) - Component library
- [Zustand Guide](https://docs.pmnd.rs/zustand) - State management
- [React Leaflet](https://react-leaflet.js.org/) - Map components
- [Framer Motion](https://www.framer.com/motion/) - Animations

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools) - Debugging
- [TypeScript Playground](https://www.typescriptlang.org/play) - Testing types
- [Can I Use](https://caniuse.com/) - Browser compatibility

---

## License

```
MIT License

Copyright (c) 2025 IC 2026 Navigation Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments

- **Ayala Malls** for venue access and floor plans
- **IC 2026 Organizing Committee** for project sponsorship
- **Open Source Community** for amazing libraries
- **Development Team** for tireless effort
- **Beta Testers** for valuable feedback

---

## Contact & Support

- 📧 **Email**: dev-team@ic2026navigation.com
- 💬 **Discussions**: [GitHub Discussions](https://github.com/username/repo/discussions)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/username/repo/issues)
- 📚 **Documentation**: [Full Docs](./docs/README.md)

---

**Built with ❤️ by the IC 2026 Navigation Team**