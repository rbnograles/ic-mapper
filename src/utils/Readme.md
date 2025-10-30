# SVG Map Parser & Data Pipeline

A Node.js-based toolkit for converting SVG floor maps into structured JSON data for navigation and routing systems. This pipeline parses SVG maps, extracts buildings, entrances, pathfinding nodes, and labels, then processes and cleans the data for use in indoor navigation applications.

---

## 📁 Project Structure

```
builder/
├── 1_svgParser2Json.js       # Parse buildings & entrances from SVG
├── 2_parseAndMerge.js         # Extract routing graph (nodes & connections)
├── 3_parseMapLabels.js        # Extract text labels & boundaries
├── addProp.js                 # Add floor property to nodes
├── dataCleanUp.js             # Clean, deduplicate & categorize places
├── findProps.js               # Find places with specific properties
├── categorizefile.js          # Extract building names by type
├── cleanDuplicate.js          # Find duplicate IDs in data
└── removeProps.js             # Remove properties from places

geometry/
├── index.js                   # Geometry utilities (centroid, polygon, distance)

parsers/
├── (utility parsing functions)
```

---

## 🚀 Quick Start

### Prerequisites

```bash
npm install xmldom svg-path-parser svg-path-bounds
```

### Basic Usage

#### 1. Parse Buildings & Entrances from SVG

```bash
node 1_svgParser2Json.js Third
```

**What it does:**
- Extracts buildings from `#BLDG` group
- Extracts non-clickable areas from `#Unclikable` group
- Extracts entrances from `#Entrances` group (paths, circles, ellipses)
- Matches building labels from `#Building Marks` group
- Assigns entrances to buildings based on polygon containment
- Merges with existing JSON data (preserves manual edits)

**Input:** `../assets/AyalaMallsMap/ThirdFloor.svg`  
**Output:** `../Data/AyalaMalls/ThirdFloor/ThirdFloor.json`

---

#### 2. Parse Routing Graph (Nodes & Connections)

```bash
node 2_parseAndMerge.js Third
```

**What it does:**
- Extracts path nodes from `#Paths` group
- Extracts entrance nodes from `#Entrances` group
- Parses circles and ellipses as navigation nodes
- Builds spatial grid index for efficient neighbor detection
- Connects nodes within threshold distance (default: 150px)
- Generates adjacency relationships for pathfinding

**Input:** `../assets/AyalaMallsMap/ThirdFloor.svg`  
**Output:** `../Data/AyalaMalls/ThirdFloor/ThirdFloorNodes.json`

**Threshold:** Adjust the `threshold` parameter to control connection distance:
```javascript
parseSvgToRoutingGraph(svgString, outputPath, 150); // 150px threshold
```

---

#### 3. Parse Map Labels & Boundaries

```bash
node 3_parseMapLabels.js Third
```

**What it does:**
- Extracts building marks from `#Building Marks` group
- Extracts road marks from `#RoadMarks` group
- Extracts map boundaries from `#Map Boundaries` group

**Input:** `../assets/AyalaMallsMap/ThirdFloor.svg`  
**Output:** `../Data/AyalaMalls/ThirdFloor/ThirdFloorLabels.json`

---

#### 4. Add Floor Property to Nodes

```bash
node addProp.js Third
```

**What it does:**
- Adds `floor` property to all nodes
- Prefixes node IDs with floor identifier (e.g., `Third_node1`)
- Removes deprecated `nearNodes` property

**Modifies:** `../Data/AyalaMalls/ThirdFloor/ThirdFloorNodes.json`

---

#### 5. Clean & Categorize Data

```bash
node dataCleanUp.js Third
```

**What it does:**
- **Fixes mojibake/encoding issues** (ÃƒÂ¢, Ã‚, etc.)
- **Removes duplicate paths** (same SVG path data)
- **Removes duplicate centroids** (keeps first occurrence)
- **Auto-classifies place types** using `category.json`:
  - Food & Beverage
  - Retail
  - Services
  - Entertainment
- **Detects special types** from names:
  - Fire Exit
  - Stairs
  - Escalator
  - Elevator
  - Restroom
- **Cleans trailing category suffixes** (e.g., "MASTER SIOMAI - Food & Beverages" → "MASTER SIOMAI")
- **Generates unique IDs** for all places
- **Outputs unmatched names** to `unmatched.json` for review

**Requires:** `../Data/category.json` (category definitions)  
**Modifies:** `../Data/AyalaMalls/ThirdFloor/ThirdFloor.json`  
**Outputs:** `../Data/unmatched.json` (names not matching any category)

---

## 🛠️ Utility Scripts

### Find Places with Specific Properties

```bash
node findProps.js Third
```

Finds places with empty `entranceNodes` (excluding NotClickable types).  
**Output:** `../Data/findResult.json`

---

### Extract Building Names by Type

```bash
node categorizefile.js Third
```

Extracts all building names where `type === "Building"`.  
**Output:** `./catResult.json`

---

### Find Duplicate IDs

```bash
node cleanDuplicate.js Third
```

Scans all arrays in the JSON for duplicate IDs.  
**Output:** `../Data/findResult.json`

---

### Remove Properties

```bash
node removeProps.js Third
```

Remove unwanted properties from all places (example: removes `basefill`).

---

## 📊 Data Schema

### Building/Place Schema (`ThirdFloor.json`)

```json
{
  "maps": [
    {
      "id": "master_siomai",
      "name": "MASTER SIOMAI",
      "type": "Food & Beverage",
      "path": "M 100,200 L 300,200...",
      "centroid": [250.5, 180.3],
      "entranceNodes": ["entr_circle_1", "entr_path_5"],
      "baseFill": "white",
      "description": "Place description goes in here...",
      "floor": "Third",
      "icon": "store"
    }
  ]
}
```

### Node/Routing Graph Schema (`ThirdFloorNodes.json`)

```json
{
  "nodes": [
    {
      "id": "Third_node_1",
      "x": 250.5,
      "y": 180.3,
      "rx": 5.0,
      "ry": 5.0,
      "type": "circle",
      "floor": "Third",
      "neighbors": ["Third_node_2", "Third_entr_circle_1"]
    }
  ],
  "entrances": [
    {
      "id": "entr_circle_1",
      "x": 255.0,
      "y": 185.0,
      "rx": 3.0,
      "ry": 3.0,
      "type": "entrance",
      "neighbors": ["Third_node_1", "Third_node_5"]
    }
  ]
}
```

### Labels Schema (`ThirdFloorLabels.json`)

```json
{
  "buildingMarks": [
    {
      "name": "MASTER SIOMAI",
      "path": "M 100,200...",
      "fill": "#000000"
    }
  ],
  "roadMarks": [...],
  "mapBoundaries": [...]
}
```

---

## 🎯 SVG Requirements

Your SVG map must follow this structure:

```xml
<svg>
  <!-- Buildings -->
  <g id="BLDG">
    <path id="BLDG_1" d="..." />
    <path id="BLDG_2" d="..." />
  </g>

  <!-- Non-clickable areas -->
  <g id="Unclikable">
    <path id="wall_1" d="..." />
  </g>

  <!-- Building labels -->
  <g id="Building Marks">
    <path id="MASTER SIOMAI" d="..." />
  </g>

  <!-- Entrances -->
  <g id="Entrances">
    <circle id="entr_1" cx="250" cy="180" r="5" />
    <ellipse id="entr_2" cx="300" cy="200" rx="8" ry="5" />
    <path id="entr_3" d="..." />
  </g>

  <!-- Routing nodes -->
  <g id="Paths">
    <path id="path_1" d="..." />
    <path id="path_2" d="..." />
  </g>

  <!-- Road markings (optional) -->
  <g id="RoadMarks">
    <path id="road_1" d="..." />
  </g>

  <!-- Map boundaries (optional) -->
  <g id="Map Boundaries">
    <path id="boundary_1" d="..." />
  </g>
</svg>
```

---

## 📝 Category Configuration

Create `../Data/category.json` with your place categories:

```json
{
  "categories": {
    "Food & Beverage": [
      "Restaurant",
      "Cafe",
      "Food Court",
      "Siomai",
      "Coffee"
    ],
    "Retail": [
      "Store",
      "Shop",
      "Boutique",
      "Fashion"
    ],
    "Services": [
      "Bank",
      "ATM",
      "Salon",
      "Clinic"
    ],
    "Entertainment": [
      "Cinema",
      "Arcade",
      "Gym"
    ]
  }
}
```

---

## 🔧 Advanced Configuration

### Adjust Neighbor Detection Threshold

In `2_parseAndMerge.js`:

```javascript
// Increase threshold for larger spaces
parseSvgToRoutingGraph(svgString, outputPath, 200); // 200px

// Decrease for dense areas
parseSvgToRoutingGraph(svgString, outputPath, 100); // 100px
```

### Adjust Entrance-to-Building Tolerance

In `1_svgParser2Json.js`:

```javascript
if (isPointInPolygon(pt, poly, 15)) { // 15px tolerance
  // Increase for looser matching
  // Decrease for stricter matching
}
```

---

## 🐛 Troubleshooting

### Problem: Entrances not assigned to buildings
**Solution:** Check if entrance centroids are close to building polygons. Increase tolerance in `isPointInPolygon`.

### Problem: Too many/few neighbor connections
**Solution:** Adjust threshold in `2_parseAndMerge.js` (line 267).

### Problem: Building names have garbage characters
**Solution:** Run `dataCleanUp.js` which fixes mojibake encoding issues.

### Problem: Duplicate buildings appearing
**Solution:** `dataCleanUp.js` removes duplicates based on path and centroid matching.

---

## 🔄 Recommended Workflow

1. **Export your floor plan as SVG** with proper layer structure
2. **Parse buildings & entrances:** `node 1_svgParser2Json.js Third`
3. **Parse routing graph:** `node 2_parseAndMerge.js Third`
4. **Parse labels:** `node 3_parseMapLabels.js Third`
5. **Add floor property:** `node addProp.js Third`
6. **Clean & categorize:** `node dataCleanUp.js Third`
7. **Review unmatched names** in `../Data/unmatched.json`
8. **Check for issues:** `node findProps.js Third` or `node cleanDuplicate.js Third`

---

## 📦 Output Files

After running the pipeline, you'll have:

```
Data/AyalaMalls/ThirdFloor/
├── ThirdFloor.json          # Buildings, places, entrances
├── ThirdFloorNodes.json     # Routing graph (nodes & connections)
└── ThirdFloorLabels.json    # Text labels & boundaries
```

---

## 🤝 Integration with Routing System

Use the generated JSON files with the `GraphRouter` class:

```typescript
import { GraphRouter } from '@/routing';
import buildingsData from './ThirdFloor.json';
import nodesData from './ThirdFloorNodes.json';

const graph = {
  maps: buildingsData.maps,
  nodes: nodesData.nodes,
  entrances: nodesData.entrances,
};

const router = new GraphRouter(graph);
const path = router.findPathBetweenPlaces('MASTER SIOMAI', 'Fire Exit');
```

---

## 📄 License

MIT

---

## 🙋 Support

For issues or questions, please check:
- SVG layer structure matches requirements
- Category configuration is properly set up
- File paths are correct for your environment