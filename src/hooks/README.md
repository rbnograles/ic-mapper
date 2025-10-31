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
- [Architecture](#architecture)
- [Hook Dependencies](#hook-dependencies)
- [Hooks Reference](#hooks-reference)
  - [useFloorData](#usefloordata)
  - [useLazyMapData](#uselazymapdata)
  - [useMapItemResolver](#usemapitemresolver)
  - [useMultiFloorContinuation](#usemultifloorcontinuation)
  - [useRouteHandler](#useroutehandler)
- [Helper Functions](#helper-functions)
  - [createRouteCalculation](#createroutecalculation)
  - [createFloorKeyResolver](#createfloorkeyresolver)
  - [createMultiFloorPathfinding](#createmultifloorpathfinding)
  - [createMultiFloorRouteBuilder](#createmultifloorroutebuilder)
  - [createRoutePreCalculation](#createrouteprecalculation)
- [Exported Functions](#exported-functions)
  - [routeMapHandler](#routemaphandler)
  - [handleMultiFloorRoute](#handlemultifloorroute)
- [Usage Patterns](#usage-patterns)
- [Best Practices](#best-practices)
- [Performance Considerations](#performance-considerations)
- [Cross-Platform Compatibility](#cross-platform-compatibility)
- [Troubleshooting](#troubleshooting)

---

## Overview

This hooks system implements a **modular, composable architecture** for indoor navigation with support for:

- ✅ Single-floor routing with intelligent caching
- ✅ Multi-floor navigation with automatic floor transitions
- ✅ Pre-calculated route segments for instant navigation
- ✅ Lazy loading with infinite scroll
- ✅ Smart search with type prioritization
- ✅ Cross-platform compatibility (iOS, Android, Desktop)

### Key Principles

1. **Separation of Concerns**: Each hook/helper has a single, well-defined responsibility
2. **Composability**: Helpers are pure functions that can be combined flexibly
3. **Performance**: Aggressive caching, debouncing, and pre-calculation
4. **Type Safety**: Full TypeScript support with strict types
5. **Cross-Platform**: Special handling for iOS Safari limitations

---

## Architecture

### Hook vs Helper Pattern

The codebase uses two patterns:

#### **React Hooks** (prefixed with `use`)
- Manage component lifecycle and state
- Use React hooks internally (`useState`, `useEffect`, `useCallback`, etc.)
- Must be called from React components
- Examples: `useFloorData`, `useRouteHandler`, `useLazyMapData`

#### **Helper Functions** (prefixed with `create`)
- Pure functions that return utility objects
- No React dependencies
- Can be called anywhere (components, other helpers, async functions)
- Examples: `createRouteCalculation`, `createFloorKeyResolver`

This separation allows:
- Reusability across different contexts
- Easier testing of business logic
- Better performance (helpers don't trigger re-renders)
- Use in non-React contexts (e.g., Web Workers in future)

---

## Hook Dependencies

```
📦 useFloorData (Data Loading)
   └─ Loads floor-specific map data
   └─ Manages loading states

📦 useLazyMapData (Progressive Loading)
   └─ Infinite scroll implementation
   └─ Smart search functionality

📦 useMapItemResolver (ID Resolution)
   └─ Resolves place identifiers

📦 useRouteHandler (Route Orchestration)
   ├─ Uses: createRouteCalculation
   ├─ Uses: routeMapHandler
   ├─ Uses: handleMultiFloorRoute
   └─ Coordinates UI state changes

📦 useMultiFloorContinuation (Route Progression)
   ├─ Watches multi-floor route state
   ├─ Uses: routeMapHandler
   └─ Automatically advances through steps

🔧 createRouteCalculation (Single-Floor Routing)
   ├─ Uses: getCachedRoute, setCachedRoute
   └─ Returns: calculateRoute function

🔧 createFloorKeyResolver (Floor Resolution)
   └─ Returns: getFloorKey, getFloorKeyFromNode

🔧 createMultiFloorPathfinding (BFS Pathfinding)
   └─ Returns: findMultiFloorPath function

🔧 createMultiFloorRouteBuilder (Route Building)
   ├─ Uses: createFloorKeyResolver
   └─ Returns: buildRouteSteps function

🔧 createRoutePreCalculation (Route Pre-calculation)
   └─ Returns: preCalculateMultiFloorRoutes function

📤 routeMapHandler (Exported Function)
   └─ Uses: createRouteCalculation

📤 handleMultiFloorRoute (Exported Function)
   ├─ Uses: createFloorKeyResolver
   ├─ Uses: createMultiFloorPathfinding
   ├─ Uses: createMultiFloorRouteBuilder
   └─ Uses: createRoutePreCalculation
```

---

## Hooks Reference

### useFloorData

**File**: `hooks/useFloorData.ts`

**Purpose**: Core hook for managing floor-specific map data with automatic loading and caching.

**Signature**:
```typescript
function useFloorData(
  selectedFloorMap: string,
  setIsLoading: (loading: boolean) => void
): UseFloorDataReturn
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `selectedFloorMap` | `string` | Floor key (e.g., `'ground'`, `'second'`) |
| `setIsLoading` | `(boolean) => void` | Global loading state updater |

**Returns**:
```typescript
interface UseFloorDataReturn {
  floorData: Omit<FloorData, 'floor'>;      // Current floor's complete data
  floorDataRef: MutableRefObject<...>;       // Ref for async access
  isLoading: boolean;                        // Local loading state
  selectedMapName: string;                   // Human-readable floor name
  loadedFloorsRef: MutableRefObject<Set<string>>; // Loaded floor cache
}
```

**Data Structure**:
```typescript
floorData: {
  maps: IMapItem[];           // All places on this floor
  nodes: INodes[];            // Navigation nodes
  entrances: IEntrances[];    // Entrances/exits
  buidingMarks: ILabels[];    // Building labels
  roadMarks: ILabels[];       // Road labels
  boundaries: ILabels[];      // Boundary markers
}
```

**Key Features**:
- ✅ Automatic data loading on floor change
- ✅ Maintains ref for async operations (prevents stale closures)
- ✅ Tracks loaded floors to avoid redundant loads
- ✅ Resolves floor keys to human-readable names
- ✅ Proper cleanup on unmount

**Internal Logic**:
1. Updates `selectedMapName` when floor changes
2. Triggers data load via `loadMapData(floorKey)`
3. Updates both state and ref with loaded data
4. Marks floor as loaded in `loadedFloorsRef`
5. Handles errors gracefully

**Usage Example**:
```typescript
const {
  floorData,
  floorDataRef,
  isLoading,
  selectedMapName
} = useFloorData(selectedFloorMap, setIsLoading);

// Display loading state
if (isLoading) return <LoadingSpinner floor={selectedMapName} />;

// Use current floor data
<MapBuilder 
  maps={floorData.maps}
  nodes={floorData.nodes}
  entrances={floorData.entrances}
/>

// Access in async callback (won't be stale)
const asyncHandler = async () => {
  const currentData = floorDataRef.current;
  await doSomethingWith(currentData);
};
```

---

### useLazyMapData

**File**: `hooks/useLazyMapData.ts`

**Purpose**: Implements progressive loading (infinite scroll) with intelligent search and caching.

**Signature**:
```typescript
function useLazyMapData(
  floor: string,
  initialLimit?: number
): UseLazyMapDataReturn
```

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `floor` | `string` | - | Floor key to load data for |
| `initialLimit` | `number` | `20` | Initial items to display |

**Returns**:
```typescript
interface UseLazyMapDataReturn {
  visiblePlaces: IMapItem[];                    // Currently visible items
  hasMore: boolean;                             // More items available?
  loadMore: () => void;                         // Load next batch
  search: (query: string) => IMapItem[];        // Search function
  loading: boolean;                             // Loading state
  clearCache: () => void;                       // Clear selection cache
  saveToCache: (place: IMapItem) => void;       // Cache user selection
}
```

**Key Features**:

#### 1. **Progressive Loading**
- Loads `initialLimit` items initially
- `loadMore()` loads `initialLimit` more items
- Automatically merges "all floors" data when floor-specific data exhausted
- Prevents duplicate loads

#### 2. **Smart Search**
```typescript
search(query: string): IMapItem[]
```
- **Type-priority matching**: If query matches a type, show only that type
- **Fallback to name search**: Otherwise search both name and type
- **Automatic deduplication**: By normalized name
- Example:
  ```typescript
  search('coffee')  // Returns all coffee shops
  search('Starbucks') // Returns Starbucks locations
  ```

#### 3. **Intelligent Sorting**
- When `floor !== 'all'`: Prioritizes items from current floor
- Maintains original order within priority groups

#### 4. **Caching System**
- **In-memory cache**: Fast access to frequently selected places
- **localStorage persistence**: Survives page reloads
- **Deduplication**: Prevents duplicate entries by name and ID
- Cache key format: `map-cache-${floor}`

**Internal Logic Flow**:

```
┌─────────────────────────────────────────────────────┐
│ 1. Initial Load (useEffect)                        │
│    └─ loadMapData(floor)                           │
│    └─ filterPlaces (remove Unknown/NotClickable)   │
│    └─ Sort by floor priority                       │
│    └─ Set visiblePlaces = first N items            │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│ 2. User scrolls → loadMore()                       │
│    └─ Slice next batch from allPlaces              │
│    └─ If exhausted and floor !== 'all'             │
│        └─ Load 'all' floors data                   │
│        └─ Merge & deduplicate                      │
│        └─ Re-sort with floor priority              │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│ 3. User searches → search(query)                   │
│    └─ Check if query matches any type              │
│    └─ If yes: filter by type only                  │
│    └─ If no: filter by name OR type                │
│    └─ Deduplicate results                          │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│ 4. User selects place → saveToCache(place)        │
│    └─ Add to in-memory cache                       │
│    └─ Persist to localStorage                      │
│    └─ Prevent duplicates                           │
└─────────────────────────────────────────────────────┘
```

**Usage Example**:
```typescript
const { 
  visiblePlaces, 
  hasMore, 
  loadMore, 
  search, 
  loading,
  saveToCache 
} = useLazyMapData('ground', 20);

// Infinite scroll
<InfiniteScroll
  dataLength={visiblePlaces.length}
  next={loadMore}
  hasMore={hasMore}
  loader={<Spinner />}
>
  {visiblePlaces.map(place => (
    <PlaceCard 
      key={place.id} 
      {...place}
      onClick={() => saveToCache(place)}
    />
  ))}
</InfiniteScroll>

// Search
const handleSearch = (query: string) => {
  const results = search(query);
  setSearchResults(results);
};
```

**Performance Optimization**:
- `filterPlaces` is memoized with `useCallback`
- `mergeUniqueByName` uses `Map` for O(n) deduplication
- `search` caches `allPlaces` via closure
- `loadingAllRef` prevents duplicate "all floors" requests

---

### useMapItemResolver

**File**: `hooks/useMapItemResolver.ts`

**Purpose**: Resolves ambiguous place identifiers to their canonical form.

**Signature**:
```typescript
function useMapItemResolver(
  floorData: Omit<FloorData, 'floor'>
): { resolveMapItemIdentifier: (candidate: string) => string }
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `floorData` | `Omit<FloorData, 'floor'>` | Current floor's map data |

**Returns**:
```typescript
{
  resolveMapItemIdentifier: (candidate: string) => string
}
```

**Resolution Logic**:
```typescript
resolveMapItemIdentifier(candidate: string): string
```

1. **Check if exists as map ID**: `maps.find(m => m.id === candidate)`
2. **Check if exists as entrance ID**: `entrances.find(e => e.id === candidate)`
3. **Return original**: If not found, return `candidate` unchanged (graceful fallback)

**Use Cases**:
- Resolving user input (name) to ID
- Validating entrance references
- Preparing route calculation inputs

**Usage Example**:
```typescript
const { resolveMapItemIdentifier } = useMapItemResolver(floorData);

// Resolve various inputs
const id1 = resolveMapItemIdentifier('store-123');     // Returns 'store-123' if exists
const id2 = resolveMapItemIdentifier('Starbucks');     // Returns 'Starbucks'
const id3 = resolveMapItemIdentifier('entrance-A');    // Returns 'entrance-A' if exists
const id4 = resolveMapItemIdentifier('invalid');       // Returns 'invalid' (fallback)

// Use in routing
const routeFrom = resolveMapItemIdentifier(userInput);
const routeTo = resolveMapItemIdentifier(destination);
await calculateRoute(routeFrom, routeTo);
```

**Note**: This is a simple resolver. For more complex resolution (name → ID lookup, entrance node lookup), use `createRouteCalculation`'s `resolvePlaceCandidate` function.

---

### useMultiFloorContinuation

**File**: `hooks/useMultiFloorContinuation.ts`

**Purpose**: Automatically manages multi-floor route progression as user navigates between floors.

**Signature**:
```typescript
function useMultiFloorContinuation(props: UseMultiFloorContinuationProps): void
```

**Parameters**:
```typescript
interface UseMultiFloorContinuationProps {
  selectedFloorMap: string;                           // Current floor
  isLoading: boolean;                                 // Floor data loading state
  floorData: Omit<FloorData, 'floor'>;               // Current floor data
  floorDataRef: MutableRefObject<...>;                // Ref to floor data
  resolveMapItemIdentifier: (candidate: string) => string; // ID resolver
}
```

**Returns**: `void` (side effects only via Zustand store)

**Key Features**:
- ✅ Watches `multiFloorRoute` state from MapStore
- ✅ Validates floor matches current step
- ✅ Uses pre-calculated routes when available
- ✅ Calculates routes on-the-fly if needed
- ✅ Highlights destination on each floor
- ✅ Proper cleanup on unmount

**State Machine**:

```
┌──────────────────────────────────────────────────────────┐
│ useEffect Dependencies:                                  │
│  - selectedFloorMap                                      │
│  - isLoading                                             │
│  - floorData.maps.length                                 │
│  - floorData.nodes.length                                │
│  - multiFloorRoute.currentStep                           │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│ Guard Conditions (early return if true)                  │
├──────────────────────────────────────────────────────────┤
│ 1. !multiFloorRoute.isActive                            │
│ 2. isLoading === true                                   │
│ 3. floorData.maps.length === 0                          │
│ 4. currentStep not found                                │
│ 5. currentStep.floor !== selectedFloorMap               │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│ Build Pre-calculated Route Key                           │
│ Format: "FloorName:fromId:toId"                         │
│ Example: "Ground Floor:store-1:elevator-a"              │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
              ┌─────────┴─────────┐
              │ Pre-calculated?   │
              └─────────┬─────────┘
                Yes │   │ No
                    │   │
        ┌───────────┘   └───────────┐
        ▼                           ▼
┌──────────────────┐    ┌──────────────────────┐
│ Use Pre-calc     │    │ Calculate Fresh      │
│ Route (instant)  │    │ Route (async)        │
├──────────────────┤    ├──────────────────────┤
│ setActiveNodeIds │    │ resolveMapItemIds    │
│ setCurrentStep   │    │ routeMapHandler()    │
│ highlightDest    │    │ setCurrentStepNodes  │
│ setIsCalculating │    │ highlightDest        │
│   = false        │    │                      │
└──────────────────┘    └──────────────────────┘
```

**Destination Highlighting Logic**:

```typescript
// Priority 1: Exact ID match
if (currentStep.toId) {
  destMap = floorData.maps.find(m => m.id === currentStep.toId);
}

// Priority 2: Entrance lookup
if (!destMap && currentStep.to) {
  const isEntranceId = floorData.entrances.some(e => e.id === currentStep.to);
  if (isEntranceId) {
    destMap = floorData.maps.find(m => 
      m.entranceNodes?.includes(currentStep.to)
    );
  }
}

// Priority 3: Name match (must be unique)
if (!destMap && currentStep.to) {
  const nameMatches = floorData.maps.filter(m => m.name === currentStep.to);
  if (nameMatches.length === 1) {
    destMap = nameMatches[0];
  } else if (nameMatches.length > 1) {
    console.warn('Multiple matches - skipping highlight');
  }
}
```

**Usage Example**:
```typescript
// In IndoorMap.tsx
useMultiFloorContinuation({
  selectedFloorMap,
  isLoading: floorDataLoading,
  floorData,
  floorDataRef,
  resolveMapItemIdentifier,
});

// No direct return value - manages state internally via:
// - useMapStore.getState().setActiveNodeIds()
// - useMapStore.getState().setHighlightedPlace()
// - useMapStore.getState().setIsCalculatingRoute()
```

**Console Logs** (for debugging):
```
🎯 Processing step 2/3
   Floor: second
   Route: Elevator A → Cinema
⚡ Using pre-calculated route (15 nodes)
[highlight] highlighting dest map id=cinema-1 name="Cinema"
```

---

### useRouteHandler

**File**: `hooks/useRouteHandler.ts`

**Purpose**: High-level route orchestrator that handles UI state, drawer closing, and delegates to appropriate routing functions.

**Signature**:
```typescript
function useRouteHandler(props: UseRouteHandlerProps): { handleRoute: Function }
```

**Parameters**:
```typescript
interface UseRouteHandlerProps {
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
  ) => Promise<string[] | null>
}
```

**Routing Decision Tree**:

```
handleRoute(from, to, via?)
         │
         ▼
┌────────────────────┐
│ Set calculating    │
│ = true             │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Close UI           │
│ - setIsExpanded    │
│ - setIsFloorMapOpen│
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Mobile delay?      │
│ (100ms if iOS/And) │
└────────┬───────────┘
         │
         ▼
    ┌────┴────┐
    │from.floor│
    │= to.floor│
    └────┬────┘
      Yes│  │No
    ┌────┘  └────┐
    ▼            ▼
┌─────────┐  ┌──────────┐
│Same Floor│  │Multi Floor│
│          │  │+ via?    │
└────┬────┘  └────┬─────┘
     │            │
     ▼            ▼
┌─────────────┐ ┌────────────────────┐
│routeMap     │ │handleMultiFloor    │
│Handler()    │ │Route()             │
│             │ │                    │
│Returns:     │ │ 1. Build steps     │
│ string[]    │ │ 2. Pre-calculate   │
│             │ │ 3. Set floor       │
│             │ │ 4. Calculate first │
└─────────────┘ └────────────────────┘
```

**Key Features**:

#### 1. **UI State Management**
```typescript
// Close drawer before routing (better UX)
setIsExpanded(false);
setIsFloorMapOpen(false);
```

#### 2. **Mobile-Specific Delays**
```typescript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (isMobile) {
  await new Promise(resolve => setTimeout(resolve, 100));
}
```
- Gives drawer animation time to complete
- Prevents janky UI on mobile devices

#### 3. **Same-Floor Routing**
```typescript
if (from.floor === to.floor) {
  return routeMapHandler(
    from.name,
    to.name,
    floorData.maps,
    floorData.nodes,
    floorData.entrances,
    false  // Use cache
  );
}
```

#### 4. **Multi-Floor Routing**
```typescript
if (via) {
  const steps = await handleMultiFloorRoute(
    from, to, via,
    setMultiFloorRoute,
    setSelectedFloorMap
  );
  
  // Wait for floor data to load
  await waitForFloorData();
  
  // Calculate first segment
  return routeMapHandler(...);
}
```

**Error Handling**:
```typescript
try {
  // Routing logic
} catch (err) {
  console.error('Route handler error:', err);
  useMapStore.getState().setIsCalculatingRoute(false);
  return null;
}
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
const nodes = await handleRoute(
  { name: 'Starbucks', id: 'store-1', floor: 'ground' },
  { name: 'Exit A', id: 'exit-a', floor: 'ground' }
);

// Multi-floor
const nodes = await handleRoute(
  { name: 'Starbucks', id: 'store-1', floor: 'ground' },
  { name: 'Cinema', id: 'cinema-1', floor: 'third' },
  'elevator'  // Via type
);
```

---

## Helper Functions

### createRouteCalculation

**File**: `hooks/helper/createRouteCalculation.ts`

**Purpose**: Core routing engine for single-floor pathfinding with intelligent caching.

**Signature**:
```typescript
function createRouteCalculation(props: CreateRouteCalculationProps): {
  calculateRoute: Function;
  resolvePlaceCandidate: Function;
}
```

**Parameters**:
```typescript
interface CreateRouteCalculationProps {
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

**Caching Strategy** (3-tier):

```
calculateRoute(from, to, forceCalculation?)
         │
         ▼
┌────────────────────────────────────┐
│ Tier 1: Pre-calculated Routes     │
│ (Multi-floor optimization)         │
├────────────────────────────────────┤
│ Key: "FloorName:from:to"          │
│ Source: multiFloorRoute.preCalculated │
│ Speed: Instant (synchronous)       │
└────────┬───────────────────────────┘
         │ Miss
         ▼
┌────────────────────────────────────┐
│ Tier 2: Route Cache                │
│ (Previous calculations)            │
├────────────────────────────────────┤
│ getCachedRoute(floor, from, to)   │
│ - Memory cache (Map)               │
│ - localStorage fallback            │
│ - Bidirectional (from↔to)          │
│ Speed: Very fast (~1ms)            │
└────────┬───────────────────────────┘
         │ Miss
         ▼
┌────────────────────────────────────┐
│ Tier 3: Fresh Calculation          │
│ (BFS pathfinding)                  │
├────────────────────────────────────┤
│ findPathBetweenPlacesOptimized()  │
│ - Build graph                      │
│ - Run BFS algorithm                │
│ - Store in cache                   │
│ Speed: ~50-200ms                   │
└────────────────────────────────────┘
```

**resolvePlaceCandidate Logic**:

```typescript
resolvePlaceCandidate(candidate: string): string
```

Priority order:
1. **Map ID**: `maps.find(m => m.id === candidate)` → return `m.id`
2. **Map Name**: `maps.find(m => m.name === candidate)` → return `m.name`
3. **Entrance Node**: `maps.find(m => m.entranceNodes?.includes(candidate))` → return `m.id`
4. **Fallback**: Return `candidate` unchanged

**Debouncing**:
```typescript
const debounceTime = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 30 : 50;
setTimeout(() => {
  // Calculate route
}, debounceTime);
```
- iOS: 30ms (more aggressive for smoother UX)
- Others: 50ms

**State Updates**:
```typescript
// iOS-compatible: wrapped in queueMicrotask
queueMicrotask(() => {
  setActiveNodeIds(orderedNodes);
  setSelectedId(to);
  setIsCalculatingRoute(false);
});
```

**Deduplication**:
```typescript
const activeCalculations = new Map<string, {}>();
const calculationKey = `${selectedFloorMap}-${from}-${to}`;

if (activeCalculations.has(calculationKey)) {
  activeCalculations.delete(calculationKey); // Cancel previous
}
activeCalculations.set(calculationKey, {});
```

**Usage Example**:
```typescript
const { calculateRoute, resolvePlaceCandidate } = createRouteCalculation({
  maps: floorData.maps,
  nodes: floorData.nodes,
  entrances: floorData.entrances,
  selectedFloorMap: 'ground'
});

// Resolve ambiguous inputs
const from = resolvePlaceCandidate('Starbucks');
const to = resolvePlaceCandidate('exit-a');

// Calculate route
const nodes = await calculateRoute(from, to);
// Returns: ['node1', 'node2', 'node3', ...]

// Force recalculation (bypass cache)
const freshNodes = await calculateRoute(from, to, true);
```

---

### createFloorKeyResolver

**File**: `hooks/helper/createFloorKeyResolver.ts`

**Purpose**: Normalizes various floor identifiers to standardized floor keys.

**Signature**:
```typescript
function createFloorKeyResolver(): {
  getFloorKey: (floorIdentifier: string) => string;
  getFloorKeyFromNode: (nodeId: string) => string;
}
```

**Returns**:
```typescript
{
  getFloorKey: (floorIdentifier: string) => string;
  getFloorKeyFromNode: (nodeId: string) =>