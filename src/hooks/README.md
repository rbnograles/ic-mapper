# Custom Hooks Documentation

This directory contains custom React hooks for managing indoor map navigation, routing, and multi-floor pathfinding.

## 📚 Related Documentation

- **[Main Project README](../../README.md)** - Project overview and setup
- **[Routing Algorithms](../routing/algorithms/README.md)** - Pathfinding implementations
- **[Store Documentation](../store/README.md)** - State management
- **[Types Documentation](../types/README.md)** - TypeScript interfaces
- **[Utils Documentation](../routing/utils/README.md)** - Helper utilities

---

## Table of Contents
- [Overview](#overview)
- [Hook Dependencies](#hook-dependencies)
- [Hooks Reference](#hooks-reference)
  - [useFloorData](#usefloordata)
  - [useFloorKeyResolver](#usefloorkeyresolver)
  - [useLazyMapData](#uselazymapdata)
  - [useMapItemResolver](#usemapitemresolver)
  - [useMultiFloorContinuation](#usemultifloorcontinuation)
  - [useMultiFloorPathfinding](#usemultifloorpathfinding)
  - [useMultiFloorRouteBuilder](#usemultifloorroutebuilder)
  - [useRouteCalculation](#useroutecalculation)
  - [useRouteHandler](#useroutehandler)
  - [useRouteMapHandler](#useroutemaphandler)
  - [useRoutePreCalculation](#userouteprecalculation)
- [Usage Patterns](#usage-patterns)
- [Best Practices](#best-practices)
- [Performance Considerations](#performance-considerations)
- [Troubleshooting](#troubleshooting)

---

## Overview

These hooks follow the Single Responsibility Principle, with each hook handling a specific aspect of map navigation:

- **Data Management**: Loading and managing floor/map data
- **Route Calculation**: Computing paths between locations
- **Multi-Floor Navigation**: Handling navigation across multiple floors
- **Utility Functions**: Helper functions for resolving identifiers and keys

---

## Hook Dependencies

```
useFloorData
useFloorKeyResolver
useLazyMapData
useMapItemResolver
useMultiFloorContinuation
  ├── useFloorKeyResolver (implied)
  └── useRouteCalculation (for route computation)
useMultiFloorPathfinding
useMultiFloorRouteBuilder
  └── useFloorKeyResolver
useRouteCalculation
  └── useMapItemResolver (for candidate resolution)
useRouteHandler
  ├── useFloorData
  ├── useMapItemResolver
  └── useRouteCalculation (indirectly via routeMapHandler)
useRouteMapHandler
  ├── useRouteCalculation
  ├── useFloorKeyResolver
  ├── useMultiFloorPathfinding
  ├── useRoutePreCalculation
  └── useMultiFloorRouteBuilder
useRoutePreCalculation
```

---

## Hooks Reference

### useFloorData

**File**: `useFloorData.ts`

**Purpose**: Manages floor data loading, caching, and state management for the currently selected floor.

**Parameters**:
- `selectedFloorMap: string` - The key of the currently selected floor
- `setIsLoading: (loading: boolean) => void` - Callback to update global loading state

**Returns**:
```typescript
{
  floorData: Omit<FloorData, 'floor'>;      // Current floor's map data
  floorDataRef: MutableRefObject<...>;       // Ref to floor data (for async access)
  isLoading: boolean;                        // Loading state
  selectedMapName: string;                   // Human-readable floor name
  loadedFloorsRef: MutableRefObject<Set<string>>; // Cache of loaded floors
}
```

**Key Features**:
- Automatically loads map data when `selectedFloorMap` changes
- Maintains a ref to floor data for use in async operations
- Tracks which floors have been loaded (caching)
- Converts floor keys to human-readable names

**Usage Example**:
```typescript
const {
  floorData,
  floorDataRef,
  isLoading,
  selectedMapName
} = useFloorData(selectedFloorMap, setIsLoading);

// Access current floor data
console.log(floorData.maps, floorData.nodes);

// Use in async operations
const dataRef = floorDataRef.current;
```

---

### useFloorKeyResolver

**File**: `useFloorKeyResolver.ts`

**Purpose**: Resolves various floor identifiers (names, aliases, node IDs) to standardized floor keys.

**Parameters**: None

**Returns**:
```typescript
{
  getFloorKey: (floorIdentifier: string) => string;
  getFloorKeyFromNode: (nodeId: string) => string;
}
```

**Key Features**:
- Resolves floor names, keys, and aliases to standardized keys
- Extracts floor information from node IDs
- Case-insensitive matching
- Fallback to original identifier if no match found

**Usage Example**:
```typescript
const { getFloorKey, getFloorKeyFromNode } = useFloorKeyResolver();

// Resolve from various formats
getFloorKey('Ground Floor');  // → 'ground'
getFloorKey('2F');            // → 'second'
getFloorKey('GROUND');        // → 'ground'

// Extract from node ID
getFloorKeyFromNode('ground_elevator_01'); // → 'ground'
```

---

### useLazyMapData

**File**: `useLazyMapData.ts`

**Purpose**: Lazily loads map data with infinite scroll support and smart search functionality.

**Parameters**:
- `floor: string` - Floor key to load data for
- `initialLimit?: number` - Initial number of places to display (default: 20)

**Returns**:
```typescript
{
  visiblePlaces: IMapItem[];        // Currently visible places
  hasMore: boolean;                 // Whether more items can be loaded
  loadMore: () => void;             // Load more items
  search: (query: string) => IMapItem[]; // Search places
  loading: boolean;                 // Loading state
  clearCache: () => void;           // Clear cached selections
  saveToCache: (place: IMapItem) => void; // Cache selected place
}
```

**Key Features**:
- Progressive loading with infinite scroll
- Smart search by name and type
- Automatic deduplication by name
- Floor-specific prioritization in results
- In-memory + localStorage caching
- Automatically merges 'all' floors data when needed

**Usage Example**:
```typescript
const { visiblePlaces, hasMore, loadMore, search } = useLazyMapData('ground', 20);

// Display initial places
{visiblePlaces.map(place => <PlaceItem key={place.id} {...place} />)}

// Load more on scroll
{hasMore && <button onClick={loadMore}>Load More</button>}

// Search
const results = search('coffee');
```

---

### useMapItemResolver

**File**: `useMapItemResolver.ts`

**Purpose**: Resolves map item identifiers (IDs, names, entrance references) to their canonical identifiers.

**Parameters**:
- `floorData: Omit<FloorData, 'floor'>` - Current floor's map data

**Returns**:
```typescript
{
  resolveMapItemIdentifier: (candidate: string) => string;
}
```

**Key Features**:
- Checks if candidate exists as a map ID
- Checks if candidate exists as an entrance ID
- Returns original candidate if not found (graceful fallback)

**Usage Example**:
```typescript
const { resolveMapItemIdentifier } = useMapItemResolver(floorData);

// Resolve various identifiers
const id = resolveMapItemIdentifier('store-123');      // Returns ID if exists
const name = resolveMapItemIdentifier('Starbucks');    // Returns name
const entrance = resolveMapItemIdentifier('entrance-A'); // Returns entrance ID
```

---

### useMultiFloorContinuation

**File**: `useMultiFloorContinuation.ts`

**Purpose**: Manages the continuation of multi-floor routes as the user progresses through steps.

**Parameters**:
```typescript
{
  selectedFloorMap: string;
  isLoading: boolean;
  floorData: Omit<FloorData, 'floor'>;
  floorDataRef: MutableRefObject<...>;
  resolveMapItemIdentifier: (candidate: string) => string;
}
```

**Returns**: void (side effects only)

**Key Features**:
- Monitors current step in multi-floor route
- Checks if current floor matches expected floor
- Uses pre-calculated routes when available
- Calculates routes on-the-fly if not pre-calculated
- Highlights destination locations
- Handles cleanup on unmount

**How It Works**:
1. Watches for changes to `selectedFloorMap` and multi-floor route state
2. Validates that floor data is ready and matches current step
3. Retrieves pre-calculated route if available
4. If not pre-calculated, computes route in real-time
5. Updates map store with active nodes and highlighted destination

**Usage Example**:
```typescript
// Used internally in IndoorMap component
useMultiFloorContinuation({
  selectedFloorMap,
  isLoading,
  floorData,
  floorDataRef,
  resolveMapItemIdentifier,
});

// No explicit return value - manages state via useMapStore
```

---

### useMultiFloorPathfinding

**File**: `useMultiFloorPathfinding.ts`

**Purpose**: Implements BFS algorithm to find paths between floors using vertical connectors (stairs, elevators, escalators).

**Parameters**: None

**Returns**:
```typescript
{
  findMultiFloorPath: (
    verticalsData: any,
    fromFloor: string,
    toFloor: string,
    viaType: string
  ) => any[] | null;
}
```

**Key Features**:
- Bidirectional BFS traversal (handles going up or down)
- Supports different vertical connector types (stairs, elevator, escalator)
- Builds adjacency map of floor connections
- Reconstructs path with proper direction metadata
- Handles floor key extraction from node IDs

**Algorithm Details**:
1. Builds bidirectional adjacency map from verticals data
2. Performs BFS from start floor to target floor
3. Tracks direction (up/down) for each transition
4. Reconstructs path with corrected connector orientation

**Usage Example**:
```typescript
const { findMultiFloorPath } = useMultiFloorPathfinding();

const path = findMultiFloorPath(
  verticalsData,     // Loaded vertical connectors
  'ground',          // From floor
  'third',           // To floor
  'elevator'         // Via type
);

// Returns: Array of connectors with direction metadata
// [
//   { from: 'ground_elevator_1', to: 'second_elevator_1', direction: 'up', ... },
//   { from: 'second_elevator_1', to: 'third_elevator_1', direction: 'up', ... }
// ]
```

---

### useMultiFloorRouteBuilder

**File**: `useMultiFloorRouteBuilder.ts`

**Purpose**: Builds the step-by-step route structure for multi-floor navigation.

**Parameters**: None (uses `useFloorKeyResolver` internally)

**Returns**:
```typescript
{
  buildRouteSteps: (
    from: IMapItem,
    to: IMapItem,
    via: string,
    connectorPath: any[]
  ) => RouteStep[];
}
```

**Key Features**:
- Creates initial step from origin to first connector
- Generates intermediate steps between connectors
- Creates final step from last connector to destination
- Properly assigns `fromId` and `toId` for precise routing
- Logs each step for debugging

**Route Structure**:
```typescript
RouteStep {
  floor: string;              // Floor key (e.g., 'ground')
  from: string;               // Display name of start point
  fromId: string;             // Precise ID of start point
  to: string;                 // Display name of end point
  toId: string;               // Precise ID of end point
  isVerticalTransition: boolean; // Whether this is a vertical movement
}
```

**Usage Example**:
```typescript
const { buildRouteSteps } = useMultiFloorRouteBuilder();

const steps = buildRouteSteps(
  fromLocation,    // IMapItem: { name, id, floor }
  toLocation,      // IMapItem: { name, id, floor }
  'elevator',      // Via type
  connectorPath    // Path from useMultiFloorPathfinding
);

// Returns array of RouteStep objects
```

---

### useRouteCalculation

**File**: `useRouteCalculation.ts`

**Purpose**: Handles single-floor route calculation with caching and optimization.

**Parameters**:
```typescript
{
  maps: IMapItem[];
  nodes: INodes[];
  entrances: IEntrances[];
  selectedFloorMap: string;
}
```

**Returns**:
```typescript
{
  calculateRoute: (
    from: string,
    to: string,
    forceCalculation?: boolean
  ) => Promise<string[] | null>;
  resolvePlaceCandidate: (candidate: string) => string;
}
```

**Key Features**:
- Checks pre-calculated multi-floor routes first
- Uses cached routes when available
- Resolves place candidates (ID, name, or entrance)
- Debounces calculations (30ms iOS, 50ms others)
- Updates map store with calculated path
- Prevents duplicate calculations

**Caching Strategy**:
1. Check pre-calculated routes (multi-floor optimization)
2. Check route cache (previous calculations)
3. Calculate fresh route if needed
4. Store result in cache for future use

**Usage Example**:
```typescript
const { calculateRoute, resolvePlaceCandidate } = useRouteCalculation({
  maps: floorData.maps,
  nodes: floorData.nodes,
  entrances: floorData.entrances,
  selectedFloorMap,
});

// Calculate route
const nodes = await calculateRoute('Starbucks', 'Exit A');

// Resolve identifiers
const resolvedId = resolvePlaceCandidate('store-123');
```

---

### useRouteHandler

**File**: `useRouteHandler.ts`

**Purpose**: High-level route handler that manages both same-floor and multi-floor routing.

**Parameters**:
```typescript
{
  floorData: Omit<FloorData, 'floor'>;
  floorDataRef: MutableRefObject<...>;
  resolveMapItemIdentifier: (candidate: string) => string;
  setSelectedFloorMap: (floor: string) => void;
  setIsExpanded: (expanded: boolean) => void;
  setIsFloorMapOpen: (open: boolean) => void;
}
```

**Returns**:
```typescript
{
  handleRoute: (
    from: IMapItem,
    to: IMapItem,
    via?: string
  ) => Promise<string[] | null>;
}
```

**Key Features**:
- Closes drawer UI before routing (better UX)
- Adds mobile-specific delays for smooth animations
- Handles same-floor routing directly
- Delegates multi-floor routing to specialized handler
- Waits for floor data to load before calculating
- Proper error handling and cleanup

**Routing Logic**:
```
if (same floor):
  → Calculate route directly
else if (multi-floor with via type):
  → Use handleMultiFloorRoute
  → Wait for floor data
  → Calculate first segment
else:
  → Return null (invalid request)
```

**Usage Example**:
```typescript
const { handleRoute } = useRouteHandler({
  floorData,
  floorDataRef,
  resolveMapItemIdentifier,
  setSelectedFloorMap,
  setIsExpanded,
  setIsFloorMapOpen,
});

// Same floor
await handleRoute(
  { name: 'Starbucks', id: 'store-1', floor: 'ground' },
  { name: 'Exit A', id: 'exit-a', floor: 'ground' }
);

// Multi-floor
await handleRoute(
  { name: 'Starbucks', id: 'store-1', floor: 'ground' },
  { name: 'Cinema', id: 'cinema-1', floor: 'third' },
  'elevator'
);
```

---

### useRouteMapHandler

**File**: `useRouteMapHandler.ts`

**Purpose**: Orchestrates all routing logic by composing multiple specialized hooks.

**Exports**:
- `routeMapHandler` - Main route calculation function
- `handleMultiFloorRoute` - Multi-floor route setup function

**Functions**:

#### routeMapHandler
```typescript
async function routeMapHandler(
  from: string,
  to: string,
  maps: IMapItem[],
  nodes: INodes[],
  entrances: IEntrances[],
  forceCalculation?: boolean
): Promise<string[] | null>
```

Uses `useRouteCalculation` internally to compute single-floor routes.

#### handleMultiFloorRoute
```typescript
async function handleMultiFloorRoute(
  from: IMapItem,
  to: IMapItem,
  via: string,
  setMultiFloorRoute: (steps, destination, preCalculated?) => void,
  setSelectedFloorMap: (floor: string) => void
): Promise<RouteStep[] | null>
```

**Multi-Floor Process**:
1. Load vertical connectors data
2. Find path through floors (BFS)
3. Build route steps
4. Load data for all required floors
5. Pre-calculate all route segments
6. Set up multi-floor route in store
7. Navigate to starting floor

**Usage Example**:
```typescript
import { routeMapHandler, handleMultiFloorRoute } from '@/hooks/useRouteMapHandler';

// Single floor
const nodes = await routeMapHandler(
  'Starbucks',
  'Exit A',
  maps,
  nodes,
  entrances
);

// Multi-floor
const steps = await handleMultiFloorRoute(
  fromLocation,
  toLocation,
  'elevator',
  setMultiFloorRoute,
  setSelectedFloorMap
);
```

---

### useRoutePreCalculation

**File**: `useRoutePreCalculation.ts`

**Purpose**: Pre-calculates all route segments for multi-floor navigation to enable instant navigation.

**Parameters**: None

**Returns**:
```typescript
{
  preCalculateMultiFloorRoutes: (
    steps: RouteStep[],
    allFloorsData: Map<string, FloorDataSet>
  ) => Promise<Map<string, string[]>>;
}
```

**Key Features**:
- Calculates routes for all steps in parallel
- Skips vertical transition steps (they're just floor changes)
- Stores results in a Map keyed by `"floorName:from:to"`
- Handles last segment specially (uses explicit IDs)
- Resolves identifiers to proper map/entrance references

**Pre-Calculation Benefits**:
- Instant route display when user changes floors
- Better UX (no loading delay between floors)
- Validates entire multi-floor route before starting
- Can detect unreachable destinations early

**Usage Example**:
```typescript
const { preCalculateMultiFloorRoutes } = useRoutePreCalculation();

const preCalculated = await preCalculateMultiFloorRoutes(
  steps,           // Array of RouteStep
  allFloorsData    // Map of floor data
);

// Result: Map<string, string[]>
// {
//   "Ground Floor:Starbucks:Elevator A" => ['node1', 'node2', ...],
//   "Second Floor:Elevator A:Cinema" => ['node5', 'node6', ...],
//   ...
// }
```

---

## Usage Patterns

### Basic Floor Navigation
```typescript
// In a component
const { floorData, isLoading } = useFloorData(selectedFloor, setIsLoading);

if (isLoading) return <LoadingSpinner />;

return <MapBuilder {...floorData} />;
```

### Single-Floor Routing
```typescript
const { calculateRoute } = useRouteCalculation({
  maps: floorData.maps,
  nodes: floorData.nodes,
  entrances: floorData.entrances,
  selectedFloorMap,
});

const nodes = await calculateRoute('Store A', 'Exit B');
```

### Multi-Floor Routing
```typescript
const { handleRoute } = useRouteHandler({
  floorData,
  floorDataRef,
  resolveMapItemIdentifier,
  setSelectedFloorMap,
  setIsExpanded,
  setIsFloorMapOpen,
});

await handleRoute(fromLocation, toLocation, 'elevator');
```

### Multi-Floor Route Continuation
```typescript
// Automatically handles route progression
useMultiFloorContinuation({
  selectedFloorMap,
  isLoading,
  floorData,
  floorDataRef,
  resolveMapItemIdentifier,
});
```

### Lazy Loading with Search
```typescript
const { visiblePlaces, hasMore, loadMore, search } = useLazyMapData('ground');

// Render visible items
{visiblePlaces.map(place => <PlaceCard {...place} />)}

// Infinite scroll
<InfiniteScroll hasMore={hasMore} loadMore={loadMore} />

// Search functionality
const results = search(searchQuery);
```

---

## Best Practices

1. **Always use refs for async operations**: Use `floorDataRef.current` in async callbacks to avoid stale closures

2. **Handle loading states**: Check `isLoading` before attempting route calculations

3. **Resolve identifiers**: Always use `resolveMapItemIdentifier` or `resolvePlaceCandidate` before routing

4. **Clean up on unmount**: Hooks that use effects include proper cleanup functions

5. **Error handling**: All hooks include try-catch blocks and graceful fallbacks

6. **Logging**: Extensive console logging for debugging (prefix with emoji for easy filtering)

7. **Cache management**: Use `useLazyMapData`'s caching features to improve performance

8. **Avoid duplicate requests**: Hooks implement deduplication to prevent unnecessary API calls

---

## Performance Considerations

- **Caching**: Routes are cached to avoid recalculation
- **Debouncing**: Route calculations are debounced (30-50ms)
- **Pre-calculation**: Multi-floor routes are pre-calculated for instant display
- **Lazy loading**: Floor data loaded only when needed
- **Refs for performance**: Use refs to avoid unnecessary re-renders
- **Infinite scroll**: `useLazyMapData` loads items progressively
- **Smart search**: Search prioritizes type matches for faster results
- **Deduplication**: Automatic removal of duplicate places by name

---

## Troubleshooting

### Route not calculating
- Check if floor data is loaded (`isLoading === false`)
- Verify identifiers exist using `resolveMapItemIdentifier`
- Check console for BFS pathfinding logs

### Multi-floor route not progressing
- Verify `useMultiFloorContinuation` is mounted
- Check if current floor matches expected floor
- Look for "⏳ Waiting for correct floor" log

### Pre-calculated routes not working
- Check pre-calculation logs ("⚡ Pre-calculated")
- Verify floor data was loaded for all required floors
- Ensure route keys match format: "FloorName:from:to"

### Lazy loading not working
- Check if `hasMore` is true
- Verify `loadMore` is being called correctly
- Look for console logs about floor data loading

### Search returning no results
- Ensure query is not empty
- Check if places array is populated
- Verify places have valid names and types

---

## Future Improvements

- Add TypeScript strict mode compliance
- Implement route optimization algorithms (A*, Dijkstra)
- Add support for accessibility routing (wheelchair-accessible paths)
- Cache vertical connector data globally
- Add route recalculation on floor data updates
- Implement route history/undo functionality
- Optimize lazy loading with virtual scrolling
- Add fuzzy search capabilities

---

## Related Files

- **Types**: `@/types/index.ts` - TypeScript interfaces
- **Algorithms**: `@/routing/algorithms/routing.ts` - Pathfinding implementation
- **Utilities**: `@/routing/utils/*` - Helper functions
- **Store**: `@/store/MapStore.ts` - Zustand state management

---

**Last Updated**: October 30, 2025  
**Version**: 1.1.0  
**Maintained by**: Development Team