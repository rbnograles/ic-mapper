# IC 2026 Indoor Navigation System

An interactive indoor navigation application designed for the 2026 International Convention at Ayala Malls. This system helps delegates navigate through multiple floors with real-time pathfinding, voice search, and multi-floor route planning.

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

### Navigation & Pathfinding
- **Multi-floor routing** with intelligent vertical connector selection (stairs, elevators)
- **A* and Dijkstra algorithms** for optimal path calculation
- **Real-time route visualization** on interactive SVG maps
- **Pre-calculated route caching** for instant navigation
- **Smart entrance resolution** with multiple entrance support

### User Interface
- **Voice search** for hands-free navigation
- **Lazy-loaded search** with infinite scroll
- **Floor selector** with visual floor cards
- **Responsive design** optimized for mobile and tablet
- **Touch-friendly map controls** with zoom and pan
- **Route step indicators** for multi-floor journeys

### Performance
- **Efficient data loading** with code splitting per floor
- **Route caching** (memory + localStorage) for repeated queries
- **Optimized re-renders** using Zustand state management
- **Preloaded vertical connectors** for faster multi-floor routing

---

## Technology Stack

### Frontend Framework
- **React 19** - UI library
- **Vite 7** - Build tool and dev server
- **TypeScript** - Type safety

### UI & Styling
- **Material-UI (MUI) 7** - Component library
- **Emotion** - CSS-in-JS styling
- **React Icons** - Icon library
- **Framer Motion** - Animations

### State Management
- **Zustand** - Lightweight state management
  - `MapStore` - Map state, active routes, multi-floor routing
  - `SearchStore` - Search queries, points A/B
  - `DrawerStore` - UI drawer states

### Mapping & Navigation
- **React Leaflet** - Map rendering
- **Custom pathfinding** - A* and Dijkstra implementations
- **SVG path parsing** - Building and boundary rendering
- **Polylabel** - Label positioning

### Utilities
- **Axios** - HTTP client
- **D3-shape** - Path calculations
- **React Router DOM** - Routing (if multi-page)

---

## Prerequisites

- **Node.js 18.x or newer** (LTS recommended)
- **npm, pnpm, or yarn**
- Modern browser with ES modules support

---

## Getting Started

### Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Available Scripts

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

# Format code
npm run format
```

### Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
ic_map_navigator/
├─ public/                    # Static assets
├─ src/
│  ├─ components/
│  │  ├─ common/              # Reusable components (loaders, chips)
│  │  ├─ Drawers/             # Direction panel, floor selector
│  │  ├─ map/                 # Map rendering components
│  │  ├─ navigation/          # Search bar, bottom nav, floating icons
│  │  └─ props/               # Utility components (voice search)
│  ├─ Data/
│  │  ├─ AyalaMalls/          # Floor data (maps, nodes, labels)
│  │  │  ├─ GroundFloor/
│  │  │  ├─ SecondFloor/
│  │  │  ├─ ThirdFloor/
│  │  │  ├─ FourthFloor/
│  │  │  ├─ FifthFloor/
│  │  │  └─ connectors/       # Vertical connectors (stairs, elevators)
│  │  └─ unique_types.json    # Place categories
│  ├─ hooks/
│  │  ├─ useLazyMapData.ts    # Lazy loading + search
│  │  └─ useRouteMapHandler.ts # Route calculation logic
│  ├─ pages/
│  │  └─ IndoorMap.tsx        # Main map page
│  ├─ routing/
│  │  ├─ routing.ts           # Core pathfinding (A*, Dijkstra)
│  │  └─ utils/
│  │     ├─ Constants.ts      # Floor definitions
│  │     ├─ mapLoader.ts      # Dynamic map data loading
│  │     ├─ MinHeap.ts        # Priority queue for pathfinding
│  │     ├─ Normalizer.ts     # Floor name normalization
│  │     ├─ routeCache.ts     # Route caching system
│  │     └─ verticalProcessor.ts # Multi-floor routing
│  ├─ store/
│  │  ├─ DrawerStore.ts       # Drawer/panel state
│  │  ├─ MapStore.ts          # Map, routes, active nodes
│  │  └─ SearchStore.ts       # Search queries, points
│  ├─ styles/
│  │  ├─ theme.ts             # MUI theme configuration
│  │  └─ layoutStyles.ts      # Layout styles
│  ├─ types/
│  │  └─ index.ts             # TypeScript interfaces
│  ├─ App.tsx                 # Root component
│  └─ main.tsx                # Entry point
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

---

## Core Features

### 1. Pathfinding System

**Algorithms:**
- **A\* Algorithm** - Point-to-point optimal pathfinding with heuristic
- **Dijkstra's Algorithm** - Single-source shortest paths for multi-destination queries

**Key Classes (`routing.ts`):**
- `PathfindingAlgorithm` - Base class with adjacency list building
- `AStarPathfinder` - A* implementation
- `DijkstraPathfinder` - Dijkstra implementation
- `EntranceResolver` - Maps entrances to path nodes
- `PlaceFinder` - Resolves place IDs and names
- `GraphRouter` - Main routing orchestrator

### 2. Multi-Floor Routing

**Process:**
1. User selects origin and destination on different floors
2. User chooses vertical connector (stairs, elevator, escalator)
3. System calculates route segments:
   - Floor A: Origin → Connector entrance
   - Vertical transition
   - Floor B: Connector exit → Destination
4. Routes are pre-calculated and cached
5. User navigates floor-by-floor with visual indicators

**Key Components:**
- `verticalProcessor.ts` - Finds vertical connectors
- `handleMultiFloorRoute()` - Generates route steps
- `MapStore.multiFloorRoute` - Tracks current step

### 3. Route Caching

**Two-tier caching:**
- **Memory cache** (Map) - Fast, session-based
- **localStorage** - Persistent across sessions
- **5-minute TTL** with automatic expiration cleanup
- **Bidirectional caching** - Supports reverse routes

### 4. Search System

**Features:**
- Debounced search (300ms)
- Lazy loading with infinite scroll
- Voice search integration
- Recent searches cache
- Type-based filtering (stores, restaurants, etc.)

**Components:**
- `SearchInput.tsx` - Autocomplete search bar
- `useLazyMapData.ts` - Chunk-based data loading
- `SearchStore.ts` - Query and results state

### 5. Map Rendering

**Layers:**
- SVG paths for buildings and boundaries
- Nodes for navigation graph
- Entrances with visual markers
- Active route highlighting
- Place labels (building marks, road marks)

**Interactions:**
- Zoom and pan controls
- Touch gestures support
- Floor switching
- Place selection

---

## Architecture

### State Management (Zustand)

**MapStore:**
```typescript
{
  highlightedPlace: IPlace;
  activeNodeIds: string[];
  multiFloorRoute: {
    isActive: boolean;
    currentStep: number;
    steps: RouteStep[];
    preCalculatedRoutes: Map<string, string[]>;
  };
  selectedFloorMap: string;
  isCalculatingRoute: boolean;
}
```

**SearchStore:**
```typescript
{
  query: string;
  pointA: IMapItem | null;
  pointB: IMapItem | null;
  displayOptions: IMapItem[];
}
```

**DrawerStore:**
```typescript
{
  isExpanded: boolean;
  isFloorMapOpen: boolean;
  isDirectionPanelOpen: boolean;
  isLoading: boolean;
}
```

### Data Flow

1. **Map Loading**: `loadMapData()` → Dynamic import → `setFloorData()`
2. **Search**: User input → Debounce → `search()` → `displayOptions`
3. **Route Calculation**: 
   - Same floor: `routeMapHandler()` → `GraphRouter.findPathBetweenPlaces()`
   - Multi-floor: `handleMultiFloorRoute()` → Step-by-step routing
4. **Rendering**: State change → React re-render → SVG update

---

## Configuration

### Floor Configuration (`Constants.ts`)

```typescript
export const floors: Floors[] = [
  {
    key: 'ground',
    name: 'Ground Floor',
    location: 'Ayala Malls',
    aliases: ['Ayala Malls Ground Floor'],
    assets: {},
  },
  // ... other floors
];
```

### Theme (`theme.ts`)

MUI theme customization for colors, typography, and component styles.

### Vite Configuration

- Path aliases (`@/` → `src/`)
- Build optimizations
- Dev server settings

---

## Development

### Adding a New Floor

1. Create floor directory: `src/Data/AyalaMalls/SixthFloor/`
2. Add data files:
   - `SixthFloor.json` - Place definitions
   - `SixthFloorNodes.json` - Navigation graph
   - `SixthFloorLabels.json` - Labels and marks
3. Update `Constants.ts` with floor entry
4. Update `mapLoader.ts` switch case
5. Add vertical connectors in `connectors/Verticals.json`

### Adding Place Types

1. Add type to `unique_types.json`
2. Create icon mapping in `ChipsIconMapper.tsx`
3. Update type filter chips

### Debugging Routes

Enable console logs in:
- `routing.ts` - Pathfinding steps
- `IndoorMap.tsx` - Multi-floor transitions
- `routeCache.ts` - Cache hits/misses

---

## Building & Deploying

### Production Build

```bash
npm run build
```

Output: `dist/` directory

### Preview Build

```bash
npm run preview
```

### Deployment Platforms

- **Vercel**: Zero-config, connect GitHub repo
- **Netlify**: Drag-and-drop `dist/` folder
- **AWS S3 + CloudFront**: Static hosting
- **GitHub Pages**: Use `vite-plugin-gh-pages`

**Build settings:**
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18+

---

## Troubleshooting

### Common Issues

**Route not calculating:**
- Check if places have valid `entranceNodes`
- Verify nodes are connected in graph
- Check console for pathfinding errors

**Multi-floor routing fails:**
- Ensure vertical connectors are defined
- Check floor names match between data and Constants
- Verify `from`/`to` IDs in Verticals.json

**Search not showing results:**
- Check `mapLoader.ts` for correct data imports
- Verify JSON structure matches `IMapItem` type
- Clear localStorage cache

**Map not rendering:**
- Check SVG path data format
- Verify coordinate system consistency
- Inspect browser console for errors

### Performance Optimization

- Use React DevTools Profiler
- Monitor Zustand state updates
- Check for unnecessary re-renders
- Optimize large SVG paths

---

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Follow code style (Prettier + ESLint)
4. Test thoroughly on multiple floors
5. Write meaningful commit messages
6. Open PR with description

### Code Standards

- Use TypeScript for new files
- Follow component structure conventions
- Add JSDoc comments for complex functions
- Update types in `types/index.ts`

---

## Useful Links

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [MUI Components](https://mui.com)
- [Zustand Guide](https://docs.pmnd.rs/zustand)
- [Leaflet API](https://leafletjs.com)

---

## License

```
MIT © IC 2026 Navigation Team
```

---

## Acknowledgments

- Ayala Malls for venue access
- IC 2026 organizing committee
- Open-source contributors

For questions or support, contact the development team.