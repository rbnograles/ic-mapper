import fs from 'fs';
import { DOMParser } from 'xmldom';

function parseSvgToJson(svgFile) {
  const svgContent = fs.readFileSync(svgFile, 'utf-8');
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');

  // --- labels ---
  const labelGroup = doc.getElementById('Building Marks');
  const labelPaths = labelGroup.getElementsByTagName('path');
  let labels = [];

  for (let i = 0; i < labelPaths.length; i++) {
    const pathNode = labelPaths.item(i);
    const id = pathNode.getAttribute('id');
    const d = pathNode.getAttribute('d');
    const fill = pathNode.getAttribute('fill');
    labels.push({ name: id, path: d, fill: fill });
  }

  const boundaryLabelsGroup = doc.getElementById('Map Boundaries');
  const boundaryLabelsPaths = boundaryLabelsGroup.getElementsByTagName('path');
  let boundaryLabels = [];

  for (let i = 0; i < boundaryLabelsPaths.length; i++) {
    const pathNode = boundaryLabelsPaths.item(i);
    const id = pathNode.getAttribute('id');
    const d = pathNode.getAttribute('d');
    const fill = pathNode.getAttribute('fill');
    boundaryLabels.push({ name: id, path: d, fill: fill });
  }

   let roadMarksLabels = [];

  const roadMarksLabelsGroup = doc.getElementById('RoadMarks');
 if(roadMarksLabelsGroup){
   const roadMarksLabelsPaths = roadMarksLabelsGroup.getElementsByTagName('path');
   

    for (let i = 0; i < roadMarksLabelsPaths.length; i++) {
      const pathNode = roadMarksLabelsPaths.item(i);
      const id = pathNode.getAttribute('id');
      const d = pathNode.getAttribute('d');
      const fill = pathNode.getAttribute('fill');
      roadMarksLabels.push({ name: id, path: d, fill: fill });
    }
 }

    return {
      buildingMarks: labels.length ? labels : [],
      roadMarks: roadMarksLabels.length ? roadMarksLabels : [],
      mapBoundaries: boundaryLabels.length ? boundaryLabels : [],
    };
}

// --- run ---
const args = process.argv.slice(2);
const svgPath = `../assets/malls/ayala/${args[0]}Floor.svg`;
const outputPath = `../../Data/AyalaMalls/${args[0]}Floor/${args[0]}FloorLabels.json`;

const result = parseSvgToJson(svgPath);

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      buildingMarks: result.buildingMarks,
      roadMarks: result.roadMarks || [],
      mapBoundaries: result.mapBoundaries || [],
    },
    null,
    2
  )
);

console.log(`Parsing successfull on ${outputPath}`)