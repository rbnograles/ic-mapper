// generateAMGroundFloor.js
import fs from "fs";
import { parse } from "node-html-parser";
import prettier from "prettier";

const SRC = "../../assets/AyalaMallsMap/GroundFloor.svg";
const DEST = "../../components/Maps/AM.GroundFloor2.tsx";
const HIGHLIGHT_COLOR = "#FFD54F";
const DEFAULT_COLOR = "#CBD1E8";

const svg = fs.readFileSync(SRC, "utf8");
const root = parse(svg);
const svgTag = root.querySelector("svg");
const svgAttrs = svgTag.attributes;
const paths = svgTag.querySelectorAll("path");

const jsxPaths = paths
  .map((p, i) => {
    const id = p.getAttribute("id")?.trim() || `path-${i}`;
    const d = p.getAttribute("d");
    const stroke = p.getAttribute("stroke") || "#ADA6A6";
    const strokeWidth = p.getAttribute("stroke-width") || "1";
    const filter = p.getAttribute("filter");
    const filterProp = filter ? ` filter="${filter}"` : "";

    return `<path
      id="${id}"
      d="${d}"
      fill={highlightId === "${id}" ? "${HIGHLIGHT_COLOR}" : "${DEFAULT_COLOR}"}
      stroke="${stroke}"
      strokeWidth="${strokeWidth}"${filterProp}
    />`;
  })
  .join("\n\n");

const component = `
import React from "react";

export default function AMGroundFloor({ highlightId }: { highlightId: string | null }) {
  return (
    <svg
      viewBox="${svgAttrs.viewBox}"
      style={{ width: '100%', height: 'auto' }}
      fill="none"
      preserveAspectRatio="${svgAttrs.preserveAspectRatio || "xMidYMid meet"}"
    >
      ${jsxPaths}
    </svg>
  );
}
`;

// ✅ prettier.format() is async when using ESM
const formatted = await prettier.format(component, { parser: "typescript" });

fs.writeFileSync(DEST, formatted, "utf8");
console.log(`✅ Generated React component at ${DEST}`);
