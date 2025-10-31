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
┌─────────────────────────────────────────────────────────┐
│ 1. Initial Load (useEffect)                             │
│    └─ loadMapData(floor)                                │
│    └─ filterPlaces (remove Unknown/NotClickable)        │
│    └─ Sort by floor priority                            │
│    └─ Set visiblePlaces = first N items                 │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 2. User scrolls → loadMore()                            │
│    └─ Slice next batch from allPlaces                   │
│    └─ If exhausted and floor !== 'all'                  │
│        └─ Load 'all' floors data                        │
│        └─ Merge & deduplicate                           │
│        └─ Re-sort with floor priority                   │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 3. User searches → search(query)                        │
│    └─ Check if query matches any type                   │
│    └─ If yes: filter by type only                       │
│    └─ If no: filter by name OR type                     │
│    └─ Deduplicate results                               │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 4. User selects place → saveToCache(place)              │
│    └─ Add to in-memory cache                            │
│    └─ Persist to localStorage                           │
│    └─ Prevent duplicates                                │
└─────────────────────────────────────────────────────────┘
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
│ 1. !multiFloorRoute.isActive                             │
│ 2. isLoading === true                                    │
│ 3. floorData.maps.length === 0                           │
│ 4. currentStep not found                                 │
│ 5. currentStep.floor !== selectedFloorMap                │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│ Build Pre-calculated Route Key                           │
│ Format: "FloorName:fromId:toId"                          │
│ Example: "Ground Floor:store-1:elevator-a"               │
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
┌────────────────────────────────────────┐
│ Tier 1: Pre-calculated Routes          │
│ (Multi-floor optimization)             │
├────────────────────────────────────────┤
│ Key: "FloorName:from:to"               │
│ Source: multiFloorRoute.preCalculated  │
│ Speed: Instant (synchronous)           │
└────────┬───────────────────────────────┘
         │ Miss
         ▼
┌────────────────────────────────────────┐
│ Tier 2: Route Cache                    │
│ (Previous calculations)                │
├────────────────────────────────────────┤
│ getCachedRoute(floor, from, to)        │
│ - Memory cache (Map)                   │
│ - localStorage fallback                │
│ - Bidirectional (from↔to)              │
│ Speed: Very fast (~1ms)                │
└────────┬───────────────────────────────┘
         │ Miss
         ▼
┌────────────────────────────────────────┐
│ Tier 3: Fresh Calculation              │
│ (BFS pathfinding)                      │
├────────────────────────────────────────┤
│ findPathBetweenPlacesOptimized()       │
│ - Build graph                          │
│ - Run BFS algorithm                    │
│ - Store in cache                       │
│ Speed: ~50-200ms                       │
└────────────────────────────────────────┘
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

**Returns**:
```typescript
{
  getFloorKey: (floorIdentifier: string) => string;
  getFloorKeyFromNode: (nodeId: string) => string;
}
```

**getFloorKey Logic**:

```typescript
getFloorKey(floorIdentifier: string): string
```

Resolution order:
1. **Direct key match**: `floors.find(f => f.key === identifier)`
2. **Name match**: `floors.find(f => f.name.toLowerCase() === identifier)`
3. **Alias match**: `floors.find(f => f.aliases.includes(identifier))`
4. **Fallback**: Return `identifier` unchanged (with warning)

**getFloorKeyFromNode Logic**:

```typescript
getFloorKeyFromNode(nodeId: string): string
```

1. Extract floor part: `nodeId.split('_')[0]`
2. Pass to `getFloorKey()` for resolution

**Usage Example**:
```typescript
const { getFloorKey, getFloorKeyFromNode } = createFloorKeyResolver();

// Various inputs
getFloorKey('ground');           // → 'ground'
getFloorKey('Ground Floor');     // → 'ground'
getFloorKey('GF');              // → 'ground' (if alias exists)
getFloorKey('1st Floor');       // → 'first'
getFloorKey('invalid');         // → 'invalid' (with warning)

// From node IDs
getFloorKeyFromNode('ground_store_123');  // → 'ground'
getFloorKeyFromNode('second_elevator_a'); // → 'second'
```

**Console Output**:
```
🔑 Resolved "Ground Floor" → key: "ground"
⚠️  Could not resolve floor: "invalid-floor"
```

---

### createMultiFloorPathfinding

**File**: `hooks/helper/createMultiFloorPathfinding.ts`

**Purpose**: BFS-based pathfinding for navigating between floors using vertical connectors (elevators, stairs, escalators).

**Signature**:
```typescript
function createMultiFloorPathfinding(): {
  findMultiFloorPath: Function;
  getFloorKeyFromIdentifier: Function;
}
```

**Returns**:
```typescript
{
  findMultiFloorPath: (
    verticalsData: any,
    fromFloor: string,
    toFloor: string,
    viaType: string
  ) => any[] | null;
  
  getFloorKeyFromIdentifier: (identifier: string) => string;
}
```

**Algorithm**: Breadth-First Search (BFS)

**Why BFS?**
- Guarantees shortest path (minimum floor transitions)
- Handles complex multi-floor buildings
- Works with any vertical connector topology

**Graph Construction**:

```
Verticals Data:
[
  { type: 'elevator', from: 'ground_elev_a', to: 'second_elev_a' },
  { type: 'elevator', from: 'second_elev_a', to: 'third_elev_a' },
  { type: 'stairs', from: 'ground_stairs_b', to: 'second_stairs_b' }
]

Adjacency List (bidirectional):
{
  'ground': [
    { vertical: {...}, neighbor: 'second', direction: 'up' },
    { vertical: {...}, neighbor: 'second', direction: 'up' }
  ],
  'second': [
    { vertical: {...}, neighbor: 'ground', direction: 'down' },
    { vertical: {...}, neighbor: 'third', direction: 'up' },
    { vertical: {...}, neighbor: 'ground', direction: 'down' }
  ],
  'third': [
    { vertical: {...}, neighbor: 'second', direction: 'down' }
  ]
}
```

**Path Reconstruction**:

```typescript
// Stores parent relationships
parent: Map<string, { from: string; vertical: any; direction: 'up' | 'down' }>

// Traces back from target to start
path = [];
current = targetFloor;
while (current !== startFloor) {
  const p = parent.get(current);
  // Build connector with correct direction
  connector = {
    ...p.vertical,
    from: p.direction === 'down' ? p.vertical.to : p.vertical.from,
    to: p.direction === 'down' ? p.vertical.from : p.vertical.to,
    direction: p.direction
  };
  path.unshift(connector);
  current = p.from;
}
```

**Type Filtering**:
```typescript
// Only considers verticals of specified type
if (v.type.toLowerCase() !== viaType.toLowerCase()) continue;
```

**Edge Cases**:
- **Same floor**: Returns `null` (no path needed)
- **No verticals**: Returns `null`
- **Unreachable**: Returns `null` (e.g., separate buildings)
- **Multiple paths**: Returns shortest (BFS guarantees this)

**Usage Example**:
```typescript
const { findMultiFloorPath } = createMultiFloorPathfinding();

const verticalsData = {
  verticals: [
    { type: 'elevator', from: 'ground_elev_a', to: 'second_elev_a', labelFrom: 'Elevator A', labelTo: 'Elevator A' },
    { type: 'elevator', from: 'second_elev_a', to: 'third_elev_a', labelFrom: 'Elevator A', labelTo: 'Elevator A' }
  ]
};

const path = findMultiFloorPath(verticalsData, 'ground', 'third', 'elevator');

// Returns:
[
  {
    type: 'elevator',
    from: 'ground_elev_a',
    to: 'second_elev_a',
    labelFrom: 'Elevator A',
    labelTo: 'Elevator A',
    direction: 'up'
  },
  {
    type: 'elevator',
    from: 'second_elev_a',
    to: 'third_elev_a',
    labelFrom: 'Elevator A',
    labelTo: 'Elevator A',
    direction: 'up'
  }
]
```

**Console Output**:
```
🔍 BFS: "ground" → "third"
   Available floors: ['ground', 'second', 'third']
✅ Found path with 2 hop(s)
```

---

### createMultiFloorRouteBuilder

**File**: `hooks/helper/createMultiFloorRouteBuilder.ts`

**Purpose**: Converts connector path into structured route steps with proper floor transitions.

**Signature**:
```typescript
function createMultiFloorRouteBuilder(): {
  buildRouteSteps: Function;
}
```

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

**Route Step Structure**:
```typescript
interface RouteStep {
  floor: string;              // Floor key (e.g., 'ground', 'second')
  from: string;               // Human-readable source
  fromId: string;             // Node ID for routing
  to: string;                 // Human-readable destination
  toId: string;               // Node ID for routing
  isVerticalTransition: boolean; // Always false (transitions handled implicitly)
}
```

**Building Logic**:

```
Input:
  from: { name: 'Starbucks', id: 'store-1', floor: 'ground' }
  to: { name: 'Cinema', id: 'cinema-1', floor: 'third' }
  via: 'elevator'
  connectorPath: [
    { from: 'ground_elev_a', to: 'second_elev_a', direction: 'up' },
    { from: 'second_elev_a', to: 'third_elev_a', direction: 'up' }
  ]

Output Steps:
[
  // Step 1: Origin floor → First connector
  {
    floor: 'ground',
    from: 'Starbucks',
    fromId: 'store-1',
    to: 'elevator',
    toId: 'ground_elev_a',
    isVerticalTransition: false
  },
  
  // Step 2: Intermediate floor (connector → connector)
  {
    floor: 'second',
    from: 'Elevator A',
    fromId: 'second_elev_a',
    to: 'Elevator A',
    toId: 'second_elev_a',
    isVerticalTransition: false
  },
  
  // Step 3: Final floor (last connector → destination)
  {
    floor: 'third',
    from: 'Elevator A',
    fromId: 'third_elev_a',
    to: 'Cinema',
    toId: 'cinema-1',
    isVerticalTransition: false
  }
]
```

**Step Categories**:

1. **Origin Step**: User's location → First vertical connector
2. **Intermediate Steps**: Between connectors on pass-through floors
3. **Final Step**: Last connector → Final destination

**Label Resolution**:
```typescript
// Uses human-readable labels if available
from: connector.labelFrom || connector.from
to: connector.labelTo || connector.to
```

**Usage Example**:
```typescript
const { buildRouteSteps } = createMultiFloorRouteBuilder();

const steps = buildRouteSteps(
  { name: 'Store A', id: 'store-a', floor: 'ground' },
  { name: 'Office B', id: 'office-b', floor: 'fifth' },
  'elevator',
  connectorPath
);

console.log(steps);
// [
//   { floor: 'ground', from: 'Store A', to: 'elevator', ... },
//   { floor: 'second', from: 'Elevator', to: 'Elevator', ... },
//   { floor: 'third', from: 'Elevator', to: 'Elevator', ... },
//   { floor: 'fourth', from: 'Elevator', to: 'Elevator', ... },
//   { floor: 'fifth', from: 'Elevator', to: 'Office B', ... }
// ]
```

**Console Output**:
```
   [1] Ground Floor: Starbucks → Elevator A
[2] ground → second: elevator (up)
   [2] Second Floor: second_elev_a → second_elev_a (connector-to-connector)
[3] second → third: elevator (up)
   [3] Third Floor: third_elev_a → Cinema (final)
✅ Multi-floor route created: 3 steps
```

---

### createRoutePreCalculation

**File**: `hooks/helper/createRoutePreCalculation.ts`

**Purpose**: Pre-calculates all route segments for instant navigation during multi-floor traversal.

**Signature**:
```typescript
function createRoutePreCalculation(): {
  preCalculateMultiFloorRoutes: Function;
}
```

**Returns**:
```typescript
{
  preCalculateMultiFloorRoutes: (
    steps: RouteStep[],
    allFloorsData: Map<string, FloorData>
  ) => Promise<Map<string, string[]>>;
}
```

**Why Pre-calculate?**
- **Instant navigation**: No waiting when changing floors
- **Better UX**: Smooth transitions between floors
- **Reduced load**: Calculate once, use multiple times
- **Offline capability**: Routes work even if network fails mid-journey

**Key Format**:
```typescript
// Format: "FloorName:fromId:toId"
"Ground Floor:store-1:ground_elev_a"
"Second Floor:second_elev_a:cinema-1"
```

**Resolution Strategy**:

```typescript
// Special handling for last step (destination)
const isLastItem = idx === lastIndex;

const resolvedFrom = isLastItem && step.fromId 
  ? step.fromId 
  : resolveIdentifier(from);

const resolvedTo = isLastItem && step.toId 
  ? step.toId 
  : resolveIdentifier(to);
```

**resolveIdentifier Logic**:
1. Check if exists as map ID
2. Check if exists as map name
3. Check if referenced by entrance node
4. Check if exists as entrance ID
5. Return unchanged as fallback

**Parallel Processing**:
```typescript
// Calculates all steps concurrently
for (const step of steps) {
  if (step.isVerticalTransition) continue;
  
  // Calculate route for this step
  const path = findPathBetweenPlacesOptimized(floorMap, from, to);
  
  if (path?.nodes?.length > 0) {
    preCalculated.set(key, path.nodes);
  }
}
```

**Usage Example**:
```typescript
const { preCalculateMultiFloorRoutes } = createRoutePreCalculation();

const steps = [
  { floor: 'ground', from: 'Store A', fromId: 'store-a', to: 'elevator', toId: 'ground_elev_a', isVerticalTransition: false },
  { floor: 'second', from: 'Elevator', fromId: 'second_elev_a', to: 'Cinema', toId: 'cinema-1', isVerticalTransition: false }
];

const allFloorsData = new Map([
  ['ground', { maps: [...], nodes: [...], entrances: [...] }],
  ['second', { maps: [...], nodes: [...], entrances: [...] }]
]);

const preCalculated = await preCalculateMultiFloorRoutes(steps, allFloorsData);

// Returns:
// Map {
//   "Ground Floor:store-a:ground_elev_a" => ['node1', 'node2', 'node3'],
//   "Second Floor:second_elev_a:cinema-1" => ['node4', 'node5', 'node6']
// }
```

**Console Output**:
```
   ⚡ Pre-calculated: Ground Floor:store-a:ground_elev_a (15 nodes)
   ⚡ Pre-calculated: Second Floor:second_elev_a:cinema-1 (8 nodes)
   ⚠️  Failed to pre-calculate Third Floor:invalid:invalid: No path found
```

**Error Handling**:
- Logs warnings for missing floor data
- Continues processing other steps if one fails
- Returns partial results (not all-or-nothing)

---

## Exported Functions

### routeMapHandler

**File**: `hooks/useRouteMapHandler.ts`

**Purpose**: Standalone function for single-floor routing without React context.

**Signature**:
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

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `from` | `string` | - | Source location (ID or name) |
| `to` | `string` | - | Destination (ID or name) |
| `maps` | `IMapItem[]` | - | Floor's place data |
| `nodes` | `INodes[]` | - | Navigation nodes |
| `entrances` | `IEntrances[]` | - | Entrance points |
| `forceCalculation` | `boolean` | `false` | Bypass cache? |

**Returns**: `Promise<string[] | null>`
- **Success**: Array of node IDs representing the path
- **Failure**: `null`

**When to Use**:
- ✅ Need routing outside React components
- ✅ Testing routing logic
- ✅ Server-side route calculation
- ✅ Web Workers (future)

**Usage Example**:
```typescript
import { routeMapHandler } from '@/hooks/useRouteMapHandler';

// In non-React context
const path = await routeMapHandler(
  'store-1',
  'exit-a',
  floorMaps,
  floorNodes,
  floorEntrances,
  false
);

if (path) {
  console.log(`Route found: ${path.length} nodes`);
} else {
  console.log('No route available');
}
```

---

### handleMultiFloorRoute

**File**: `hooks/useRouteMapHandler.ts`

**Purpose**: Complete multi-floor routing orchestrator with pre-calculation.

**Signature**:
```typescript
async function handleMultiFloorRoute(
  from: IMapItem,
  to: IMapItem,
  via: string,
  setMultiFloorRoute: Function,
  setSelectedFloorMap: Function
): Promise<RouteStep[] | null>
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | `IMapItem` | Starting location |
| `to` | `IMapItem` | Final destination |
| `via` | `string` | Vertical connector type ('elevator', 'stairs', 'escalator') |
| `setMultiFloorRoute` | `Function` | Zustand action to set route state |
| `setSelectedFloorMap` | `Function` | Function to change active floor |

**Returns**: `Promise<RouteStep[] | null>`
- **Success**: Array of route steps
- **Failure**: `null`

**Complete Flow**:

```
handleMultiFloorRoute(from, to, via)
         │
         ▼
┌────────────────────────┐
│ 1. Load Verticals Data │
│    (elevators, stairs) │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ 2. Find Path (BFS)     │
│    createMultiFloor    │
│    Pathfinding()       │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ 3. Build Route Steps   │
│    createMultiFloor    │
│    RouteBuilder()      │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ 4. Load All Floor Data │
│    (parallel)          │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ 5. Pre-calculate       │
│    All Segments        │
│    createRoutePre      │
│    Calculation()       │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ 6. Setup Store State   │
│    - setMultiFloorRoute│
│    - setSelectedFloorMap│
└────────────────────────┘
```

**Usage Example**:
```typescript
import { handleMultiFloorRoute } from '@/hooks/useRouteMapHandler';
import useMapStore from '@/store/MapStore';

const steps = await handleMultiFloorRoute(
  { name: 'Starbucks', id: 'store-1', floor: 'ground' },
  { name: 'Cinema', id: 'cinema-1', floor: 'third' },
  'elevator',
  useMapStore.getState().setMultiFloorRoute,
  setSelectedFloorMap
);

if (steps) {
  console.log(`Multi-floor route created: ${steps.length} steps`);
} else {
  console.log('Could not create multi-floor route');
}
```

**Console Output**:
```
🎯 Starting multi-floor route creation...
   From: Starbucks (ground)
   To: Cinema (third)
   Via: elevator
🔍 BFS: "ground" → "third"
   Available floors: ['ground', 'second', 'third']
✅ Found path with 2 hop(s)
   Direction: ⬆️ Upward
   [1] Ground Floor: Starbucks → Elevator A
[2] ground → second: elevator (up)
   [2] Second Floor: second_elev_a → second_elev_a (connector-to-connector)
[3] second → third: elevator (up)
   [3] Third Floor: third_elev_a → Cinema (final)
✅ Multi-floor route created: 3 steps
   Loading data for floors: ['ground', 'second', 'third']
   ✅ Loaded data for floor key: ground
   ✅ Loaded data for floor key: second
   ✅ Loaded data for floor key: third
   ⚡ Pre-calculated: Ground Floor:store-1:ground_elev_a (15 nodes)
   ⚡ Pre-calculated: Second Floor:second_elev_a:second_elev_a (3 nodes)
   ⚡ Pre-calculated: Third Floor:third_elev_a:cinema-1 (8 nodes)
✅ Pre-calculated 3 route segments
✅ Multi-floor route setup complete. Starting on floor: ground
```

---

## Usage Patterns

### Pattern 1: Basic Single-Floor Navigation

```typescript
import { useFloorData } from '@/hooks/useFloorData';
import { useRouteHandler } from '@/hooks/useRouteHandler';

function NavigationComponent() {
  const [selectedFloorMap, setSelectedFloorMap] = useState('ground');
  
  const { floorData, isLoading } = useFloorData(
    selectedFloorMap,
    setIsLoading
  );
  
  const { handleRoute } = useRouteHandler({
    floorData,
    setSelectedFloorMap,
    // ... other props
  });
  
  const navigateToStore = async () => {
    await handleRoute(
      { name: 'Current Location', id: 'loc-1', floor: 'ground' },
      { name: 'Starbucks', id: 'store-1', floor: 'ground' }
    );
  };
  
  return <button onClick={navigateToStore}>Go to Starbucks</button>;
}
```

---

### Pattern 2: Multi-Floor Navigation with Pre-calculation

```typescript
import { useFloorData } from '@/hooks/useFloorData';
import { useRouteHandler } from '@/hooks/useRouteHandler';
import { useMultiFloorContinuation } from '@/hooks/useMultiFloorContinuation';

function MultiFloorNavigationComponent() {
  const { floorData, floorDataRef, isLoading } = useFloorData(
    selectedFloorMap,
    setIsLoading
  );
  
  const { handleRoute } = useRouteHandler({
    floorData,
    floorDataRef,
    setSelectedFloorMap,
    // ... other props
  });
  
  // Automatically continues route when floor changes
  useMultiFloorContinuation({
    selectedFloorMap,
    isLoading,
    floorData,
    floorDataRef,
    resolveMapItemIdentifier
  });
  
  const navigateMultiFloor = async () => {
    await handleRoute(
      { name: 'Store', id: 'store-1', floor: 'ground' },
      { name: 'Cinema', id: 'cinema-1', floor: 'third' },
      'elevator'  // Via type
    );
  };
  
  return <button onClick={navigateMultiFloor}>Go to Cinema</button>;
}
```

---

### Pattern 3: Progressive Loading with Search

```typescript
import { useLazyMapData } from '@/hooks/useLazyMapData';
import InfiniteScroll from 'react-infinite-scroll-component';

function PlaceListComponent() {
  const { 
    visiblePlaces, 
    hasMore, 
    loadMore, 
    search,
    saveToCache 
  } = useLazyMapData('ground', 20);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IMapItem[]>([]);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setSearchResults(search(query));
    }
  };
  
  const displayPlaces = searchQuery ? searchResults : visiblePlaces;
  
  return (
    <div>
      <input 
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search places..."
      />
      
      <InfiniteScroll
        dataLength={displayPlaces.length}
        next={loadMore}
        hasMore={!searchQuery && hasMore}
        loader={<LoadingSpinner />}
      >
        {displayPlaces.map(place => (
          <PlaceCard
            key={place.id}
            {...place}
            onClick={() => {
              saveToCache(place);
              handleNavigation(place);
            }}
          />
        ))}
      </InfiniteScroll>
    </div>
  );
}
```

---

### Pattern 4: Standalone Routing (Non-React)

```typescript
import { routeMapHandler } from '@/hooks/useRouteMapHandler';

// In a service or utility
export async function calculateRouteForAPI(
  from: string,
  to: string,
  floor: string
) {
  const { maps, nodes, entrances } = await loadMapData(floor);
  
  const path = await routeMapHandler(
    from,
    to,
    maps,
    nodes,
    entrances,
    false
  );
  
  return path;
}

// Usage
const nodes = await calculateRouteForAPI('store-1', 'exit-a', 'ground');
```

---

## Best Practices

### 1. Always Use Refs for Async Operations

```typescript
// ❌ Bad: Uses stale state in async callback
const calculateRoute = async () => {
  await delay(1000);
  return floorData.nodes; // Might be stale!
};

// ✅ Good: Uses ref
const calculateRoute = async () => {
  await delay(1000);
  return floorDataRef.current.nodes; // Always current
};
```

### 2. Handle Loading States Properly

```typescript
// ✅ Good: Guards against incomplete data
useEffect(() => {
  if (isLoading) return;
  if (!floorData.maps.length) return;
  
  // Safe to proceed
  calculateRoute();
}, [isLoading, floorData.maps.length]);
```

### 3. Cleanup Async Operations

```typescript
useEffect(() => {
  let cancelled = false;
  
  (async () => {
    const result = await expensiveOperation();
    if (!cancelled) {
      updateState(result);
    }
  })();
  
  return () => {
    cancelled = true;
  };
}, [deps]);
```

### 4. Use Pre-calculation for Multi-Floor Routes

```typescript
// ✅ Good: Pre-calculate all segments
await handleMultiFloorRoute(from, to, via, ...);
// All segments ready instantly

// ❌ Bad: Calculate on-demand
// User waits at each floor transition
```

### 5. Leverage Caching

```typescript
// ✅ Good: Respects cache
await calculateRoute(from, to, false);

// ❌ Bad: Forces recalculation unnecessarily
await calculateRoute(from, to, true);
```

---

## Performance Considerations

### Caching Strategy

The hooks system uses a **3-tier caching strategy**:

1. **Pre-calculated Routes** (Tier 1)
   - **Speed**: Instant (synchronous)
   - **Scope**: Multi-floor route segments
   - **Storage**: Zustand store (memory)
   - **Lifetime**: Duration of multi-floor journey

2. **Route Cache** (Tier 2)
   - **Speed**: Very fast (~1ms)
   - **Scope**: All previously calculated routes
   - **Storage**: Memory + localStorage
   - **Lifetime**: Session + persistent

3. **Fresh Calculation** (Tier 3)
   - **Speed**: ~50-200ms
   - **Scope**: First-time routes
   - **Storage**: N/A (calculates then caches)
   - **Lifetime**: One-time

### Memory Management

```typescript
// Lazy loading prevents memory bloat
useLazyMapData('ground', 20); // Only loads 20 items initially

// Cleanup on unmount
useEffect(() => {
  return () => {
    // Clear subscriptions, cancel requests
  };
}, []);
```

### Debouncing

```typescript
// iOS: More aggressive debouncing for smoother UX
const debounceTime = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 30 : 50;
```

### Parallel Processing

```typescript
// Load all floor data concurrently
await Promise.all(
  uniqueFloorKeys.map(async (floorKey) => {
    const data = await loadMapData(floorKey);
    allFloorsData.set(floorKey, data);
  })
);
```

---

## Cross-Platform Compatibility

### iOS Safari Quirks

#### 1. State Updates Must Use queueMicrotask

```typescript
// ❌ Doesn't work reliably on iOS
setActiveNodeIds(nodes);
setIsCalculatingRoute(false);

// ✅ Works on iOS
queueMicrotask(() => {
  setActiveNodeIds(nodes);
  setIsCalculatingRoute(false);
});
```

#### 2. Shorter Debounce Times

```typescript
const debounceTime = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 30 : 50;
```

#### 3. Animation Delays

```typescript
// Give drawer time to close on mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (isMobile) {
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### Android Compatibility

- Uses same mobile detection as iOS
- Slightly longer debounce acceptable
- No special quirks beyond standard mobile considerations

---

## Troubleshooting

### Issue: Route not calculating

**Symptoms**: `calculateRoute()` returns `null`

**Causes**:
1. Floor data not loaded
2. Invalid from/to identifiers
3. No path exists between locations

**Solutions**:
```typescript
// Check floor data
if (!floorData.maps.length || !floorData.nodes.length) {
  console.error('Floor data not ready');
  return;
}

// Verify identifiers
const resolvedFrom = resolvePlaceCandidate(from);
const resolvedTo = resolvePlaceCandidate(to);
console.log('Resolved:', { from: resolvedFrom, to: resolvedTo });

// Check if path exists
const path = findPathBetweenPlacesOptimized(graph, resolvedFrom, resolvedTo);
if (!path) {
  console.error('No path exists between these locations');
}
```

---

### Issue: Multi-floor route doesn't continue

**Symptoms**: Route stops after floor change

**Causes**:
1. `useMultiFloorContinuation` not called
2. Floor mismatch
3. Pre-calculated routes missing

**Solutions**:
```typescript
// Ensure hook is active
useMultiFloorContinuation({
  selectedFloorMap,
  isLoading,
  floorData,
  floorDataRef,
  resolveMapItemIdentifier
});

// Check console logs
console.log('Current step:', multiFloorRoute.currentStep);
console.log('Steps:', multiFloorRoute.steps