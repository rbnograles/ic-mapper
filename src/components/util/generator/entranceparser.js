import fs from "fs";
import parse from "svg-path-parser";

// --- convert SVG path into polygon points ---
function parsePathToPolygon(pathStr) {
  const commands = parse(pathStr);
  const pts = [];
  let start = null;
  let current = { x: 0, y: 0 };

  for (const cmd of commands) {
    switch (cmd.code) {
      case "M": // MoveTo
      case "L": // LineTo
        current = { x: cmd.x, y: cmd.y };
        if (!start) start = { ...current };
        pts.push(current);
        break;
      case "H": // Horizontal line
        current = { x: cmd.x, y: current.y };
        pts.push(current);
        break;
      case "V": // Vertical line
        current = { x: current.x, y: cmd.y };
        pts.push(current);
        break;
      case "Z": // ClosePath
        if (start) pts.push({ ...start });
        break;
      default:
        // curves → take endpoint only
        if (cmd.x !== undefined && cmd.y !== undefined) {
          current = { x: cmd.x, y: cmd.y };
          pts.push(current);
        }
        break;
    }
  }
  return pts;
}

// --- point-in-polygon (ray casting) ---
function isPointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// --- ellipse center check ---
function isEllipseInsidePlace(place, ellipse) {
  const polygon = parsePathToPolygon(place.path);
  const center = { x: ellipse.cx, y: ellipse.cy };
  return isPointInPolygon(center, polygon);
}

// --- main ---
function updateEntranceNodes(jsonPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const places = data.places || data;
  const ellipses = data.nodes || [];

  for (const place of places) {
    const insideEllipses = [];

    for (const ellipse of ellipses) {
      if (isEllipseInsidePlace(place, ellipse)) {
        insideEllipses.push(ellipse.id);
      }
    }

    // Update place.entranceNodes (create if missing)
    if (insideEllipses.length > 0) {
      place.entranceNodes = insideEllipses;
    }
  }

  // Write back to file
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ Updated ${jsonPath} with entranceNodes`);
}

updateEntranceNodes("../../Data/GroupFloor.json");
