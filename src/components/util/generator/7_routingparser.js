import fs from "fs";

function parseSvgToJson(svgString, outputPath, threshold = 50) {
  const circleRegex = /<circle[^>]*id="([^"]+)"[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"/g;
  const nodes = [];
  let match;

  // Extract circles
  while ((match = circleRegex.exec(svgString)) !== null) {
    const [_, id, cx, cy] = match;
    nodes.push({
      id,
      x: Math.round(parseFloat(cx) * 100) / 100, // round 2 decimals
      y: Math.round(parseFloat(cy) * 100) / 100,
      neighbors: [],
    });
  }

  // --- Spatial grid index
  const grid = new Map();
  const cellSize = threshold;

  function getCellKey(x, y) {
    return `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
  }

  // Put nodes into grid
  for (const node of nodes) {
    const key = getCellKey(node.x, node.y);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(node);
  }

  // Find neighbors (only in nearby cells)
  for (const node of nodes) {
    const cx = Math.floor(node.x / cellSize);
    const cy = Math.floor(node.y / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cx + dx},${cy + dy}`;
        const bucket = grid.get(key) || [];
        for (const other of bucket) {
          if (other.id === node.id) continue;
          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          if (dist <= threshold) {
            if (!node.neighbors.includes(other.id)) {
              node.neighbors.push(other.id);
            }
          }
        }
      }
    }
  }

  const graph = { nodes };

  fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2), "utf-8");
  console.log(`✅ JSON data written to ${outputPath}`);
}


// Example usage:
const svgData = `
<g id="Paths">
<circle id="Ellipse 2" cx="2900.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 3" cx="2966.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 4" cx="3032.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 5" cx="3098.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 6" cx="3164.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 7" cx="3230.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 8" cx="3296.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 9" cx="3362.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 10" cx="3428.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 316" cx="3494.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 317" cx="3560.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 318" cx="3626.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 319" cx="3692.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 320" cx="3758.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 321" cx="3824.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 322" cx="3890.5" cy="5022.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 323" cx="3941.5" cy="4981.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 324" cx="3992.5" cy="4940.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 325" cx="4043.5" cy="4899.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 326" cx="4094.5" cy="4858.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 327" cx="4145.5" cy="4817.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 328" cx="4196.5" cy="4776.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 329" cx="4247.5" cy="4735.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 330" cx="4298.5" cy="4694.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 331" cx="4349.5" cy="4653.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 332" cx="4397.5" cy="4653.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 333" cx="4445.5" cy="4653.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 334" cx="4493.5" cy="4653.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 335" cx="4542.5" cy="4643.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 336" cx="4591.5" cy="4613.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 337" cx="4644.5" cy="4587.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 338" cx="4697.5" cy="4561.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 339" cx="4769.5" cy="4551.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 340" cx="4841.5" cy="4541.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 341" cx="4913.5" cy="4551.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 342" cx="4985.5" cy="4569.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 195" cx="3428.5" cy="5068.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 196" cx="3428.5" cy="5114.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 197" cx="3428.5" cy="5160.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 198" cx="3428.5" cy="5206.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 199" cx="3428.5" cy="5252.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 200" cx="3445.5" cy="5297.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 201" cx="3478.5" cy="5339.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 202" cx="3511.5" cy="5381.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 203" cx="3544.5" cy="5423.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 204" cx="3577.5" cy="5465.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 205" cx="3610.5" cy="5507.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 270" cx="3577.5" cy="5565.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 271" cx="3544.5" cy="5623.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 272" cx="3511.5" cy="5681.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 273" cx="3478.5" cy="5739.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 274" cx="3478.5" cy="5816.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 275" cx="3478.5" cy="5893.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 276" cx="3478.5" cy="5970.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 277" cx="3511.5" cy="6033.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 278" cx="3511.5" cy="6120.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 279" cx="3511.5" cy="6197.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 280" cx="3511.5" cy="6274.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 281" cx="3511.5" cy="6351.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 282" cx="3511.5" cy="6428.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 283" cx="3511.5" cy="6505.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 284" cx="3511.5" cy="6582.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 285" cx="3511.5" cy="6659.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 286" cx="3511.5" cy="6736.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 287" cx="3511.5" cy="6813.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 288" cx="3511.5" cy="6890.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 289" cx="3511.5" cy="6967.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 290" cx="3511.5" cy="7044.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 291" cx="3511.5" cy="7121.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 292" cx="3511.5" cy="7198.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 293" cx="3511.5" cy="7275.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 294" cx="3511.5" cy="7352.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 295" cx="3511.5" cy="7429.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 296" cx="3511.5" cy="7506.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 297" cx="3511.5" cy="7583.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 298" cx="3511.5" cy="7660.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 299" cx="3511.5" cy="7737.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 300" cx="3511.5" cy="7814.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 301" cx="3511.5" cy="7891.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 302" cx="3511.5" cy="7968.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 303" cx="3511.5" cy="8045.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 304" cx="3511.5" cy="8122.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 305" cx="3511.5" cy="8199.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 306" cx="3511.5" cy="8276.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 307" cx="3511.5" cy="8353.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 308" cx="3511.5" cy="8430.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 309" cx="3511.5" cy="8507.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 310" cx="3511.5" cy="8584.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 311" cx="3511.5" cy="8661.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 312" cx="3511.5" cy="8738.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 313" cx="3511.5" cy="8815.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 314" cx="3511.5" cy="8892.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 315" cx="3511.5" cy="8969.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 206" cx="3643.5" cy="5549.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 207" cx="3676.5" cy="5591.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 208" cx="3729.5" cy="5607.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 209" cx="3782.5" cy="5623.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 210" cx="3782.5" cy="5679.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 211" cx="3782.5" cy="5735.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 212" cx="3782.5" cy="5791.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 213" cx="3782.5" cy="5847.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 214" cx="3782.5" cy="5903.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 215" cx="3782.5" cy="5959.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 216" cx="3782.5" cy="6015.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 217" cx="3782.5" cy="6071.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 218" cx="3782.5" cy="6127.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 219" cx="3782.5" cy="6183.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 220" cx="3782.5" cy="6239.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 221" cx="3782.5" cy="6295.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 222" cx="3782.5" cy="6351.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 223" cx="3782.5" cy="6407.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 224" cx="3782.5" cy="6463.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 225" cx="3782.5" cy="6519.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 226" cx="3782.5" cy="6575.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 227" cx="3782.5" cy="6631.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 228" cx="3782.5" cy="6687.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 229" cx="3782.5" cy="6743.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 230" cx="3782.5" cy="6799.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 231" cx="3782.5" cy="6855.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 232" cx="3782.5" cy="6911.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 233" cx="3782.5" cy="6967.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 234" cx="3782.5" cy="7023.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 235" cx="3782.5" cy="7079.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 236" cx="3782.5" cy="7135.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 237" cx="3782.5" cy="7191.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 238" cx="3782.5" cy="7247.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 239" cx="3782.5" cy="7303.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 240" cx="3782.5" cy="7359.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 241" cx="3782.5" cy="7415.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 242" cx="3782.5" cy="7471.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 243" cx="3782.5" cy="7527.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 244" cx="3782.5" cy="7583.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 245" cx="3782.5" cy="7639.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 246" cx="3782.5" cy="7695.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 247" cx="3782.5" cy="7751.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 248" cx="3782.5" cy="7807.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 249" cx="3782.5" cy="7863.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 250" cx="3782.5" cy="7919.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 251" cx="3782.5" cy="7975.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 252" cx="3782.5" cy="8031.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 253" cx="3782.5" cy="8087.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 254" cx="3782.5" cy="8143.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 255" cx="3782.5" cy="8199.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 256" cx="3782.5" cy="8255.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 257" cx="3782.5" cy="8311.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 258" cx="3782.5" cy="8367.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 259" cx="3782.5" cy="8423.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 260" cx="3782.5" cy="8479.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 261" cx="3782.5" cy="8535.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 262" cx="3782.5" cy="8591.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 263" cx="3782.5" cy="8647.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 264" cx="3782.5" cy="8703.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 265" cx="3782.5" cy="8759.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 266" cx="3782.5" cy="8815.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 267" cx="3749.5" cy="8862.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 268" cx="3716.5" cy="8909.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 269" cx="3683.5" cy="8956.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 11" cx="3428.5" cy="4976.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 12" cx="3428.5" cy="4930.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 13" cx="3428.5" cy="4884.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 14" cx="3428.5" cy="4838.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 15" cx="3428.5" cy="4792.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 16" cx="3428.5" cy="4746.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 17" cx="3428.5" cy="4700.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 18" cx="3461.5" cy="4667.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 19" cx="3494.5" cy="4634.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 20" cx="3527.5" cy="4601.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 121" cx="3573.5" cy="4568.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 122" cx="3619.5" cy="4535.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 123" cx="3665.5" cy="4502.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 124" cx="3711.5" cy="4469.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 125" cx="3757.5" cy="4436.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 126" cx="3773.5" cy="4378.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 127" cx="3773.5" cy="4317.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 128" cx="3773.5" cy="4256.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 129" cx="3773.5" cy="4195.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 130" cx="3773.5" cy="4134.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 131" cx="3773.5" cy="4073.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 132" cx="3773.5" cy="4012.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 133" cx="3773.5" cy="3951.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 134" cx="3773.5" cy="3890.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 135" cx="3773.5" cy="3829.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 136" cx="3773.5" cy="3768.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 137" cx="3773.5" cy="3707.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 138" cx="3773.5" cy="3646.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 139" cx="3773.5" cy="3585.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 140" cx="3773.5" cy="3524.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 141" cx="3773.5" cy="3463.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 142" cx="3773.5" cy="3402.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 143" cx="3773.5" cy="3341.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 144" cx="3773.5" cy="3280.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 145" cx="3773.5" cy="3219.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 146" cx="3812.5" cy="3174.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 147" cx="3851.5" cy="3129.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 148" cx="3895.5" cy="3097.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 149" cx="3932.5" cy="3064.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 150" cx="3969.5" cy="3031.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 151" cx="4006.5" cy="2998.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 152" cx="4043.5" cy="2965.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 153" cx="4080.5" cy="2932.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 154" cx="4117.5" cy="2899.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 155" cx="4149.5" cy="2861.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 156" cx="4181.5" cy="2823.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 157" cx="4213.5" cy="2785.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 158" cx="4245.5" cy="2747.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 159" cx="4291.5" cy="2712.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 160" cx="4337.5" cy="2677.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 161" cx="4383.5" cy="2642.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 162" cx="4429.5" cy="2607.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 163" cx="4475.5" cy="2572.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 164" cx="4521.5" cy="2537.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 165" cx="4564.5" cy="2491.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 166" cx="4607.5" cy="2445.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 167" cx="4650.5" cy="2399.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 168" cx="4693.5" cy="2353.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 169" cx="4736.5" cy="2307.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 170" cx="4779.5" cy="2261.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 171" cx="4822.5" cy="2215.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 172" cx="4865.5" cy="2169.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 173" cx="4908.5" cy="2123.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 174" cx="4951.5" cy="2077.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 175" cx="4994.5" cy="2031.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 176" cx="5037.5" cy="1985.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 177" cx="5106.5" cy="1983.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 178" cx="5175.5" cy="1981.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 179" cx="5244.5" cy="1979.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 180" cx="5313.5" cy="1977.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 181" cx="5382.5" cy="1975.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 182" cx="5451.5" cy="1973.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 183" cx="5520.5" cy="1971.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 184" cx="5589.5" cy="1969.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 185" cx="5658.5" cy="1967.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 186" cx="5727.5" cy="1965.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 187" cx="5796.5" cy="1963.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 188" cx="5865.5" cy="1961.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 189" cx="5934.5" cy="1959.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 190" cx="6003.5" cy="1957.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 191" cx="6072.5" cy="1955.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 192" cx="6123.5" cy="1933.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 193" cx="6174.5" cy="1911.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 194" cx="6225.5" cy="1889.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 21" cx="3527.5" cy="4507.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 23" cx="3527.5" cy="4461.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 24" cx="3527.5" cy="4415.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 25" cx="3527.5" cy="4369.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 26" cx="3527.5" cy="4323.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 27" cx="3527.5" cy="4277.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 28" cx="3527.5" cy="4231.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 29" cx="3527.5" cy="4185.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 30" cx="3527.5" cy="4139.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 31" cx="3527.5" cy="4093.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 32" cx="3527.5" cy="4047.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 33" cx="3527.5" cy="4001.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 34" cx="3527.5" cy="3955.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 35" cx="3527.5" cy="3909.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 36" cx="3527.5" cy="3863.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 37" cx="3527.5" cy="3817.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 38" cx="3527.5" cy="3771.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 39" cx="3527.5" cy="3725.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 40" cx="3527.5" cy="3679.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 41" cx="3527.5" cy="3633.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 42" cx="3527.5" cy="3587.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 43" cx="3527.5" cy="3541.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 44" cx="3527.5" cy="3495.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 45" cx="3527.5" cy="3449.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 46" cx="3527.5" cy="3403.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 47" cx="3527.5" cy="3357.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 48" cx="3527.5" cy="3311.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 49" cx="3527.5" cy="3265.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 50" cx="3527.5" cy="3219.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 51" cx="3527.5" cy="3173.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 52" cx="3544.5" cy="3125.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 53" cx="3561.5" cy="3073.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 54" cx="3588.5" cy="3035.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 55" cx="3615.5" cy="2997.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 56" cx="3650.5" cy="2964.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 57" cx="3685.5" cy="2931.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 58" cx="3720.5" cy="2898.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 59" cx="3755.5" cy="2865.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 60" cx="3790.5" cy="2832.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 61" cx="3825.5" cy="2799.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 62" cx="3860.5" cy="2766.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 63" cx="3895.5" cy="2733.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 64" cx="3930.5" cy="2700.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 65" cx="3965.5" cy="2667.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 66" cx="4000.5" cy="2634.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 67" cx="4035.5" cy="2601.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 68" cx="4070.5" cy="2568.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 69" cx="4105.5" cy="2535.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 70" cx="4140.5" cy="2502.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 71" cx="4175.5" cy="2469.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 72" cx="4210.5" cy="2436.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 73" cx="4245.5" cy="2403.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 74" cx="4280.5" cy="2370.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 75" cx="4315.5" cy="2337.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 76" cx="4350.5" cy="2304.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 77" cx="4385.5" cy="2271.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 78" cx="4420.5" cy="2238.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 79" cx="4455.5" cy="2205.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 80" cx="4490.5" cy="2172.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 81" cx="4525.5" cy="2139.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 82" cx="4560.5" cy="2106.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 83" cx="4595.5" cy="2073.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 84" cx="4630.5" cy="2040.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 85" cx="4665.5" cy="2007.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 86" cx="4700.5" cy="1974.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 87" cx="4735.5" cy="1941.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 88" cx="4770.5" cy="1908.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 89" cx="4805.5" cy="1875.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 90" cx="4840.5" cy="1842.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 91" cx="4875.5" cy="1809.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 92" cx="4910.5" cy="1776.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 93" cx="4945.5" cy="1743.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 94" cx="4980.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 95" cx="5029.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 96" cx="5078.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 97" cx="5127.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 98" cx="5176.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 99" cx="5225.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 100" cx="5274.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 101" cx="5323.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 102" cx="5372.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 103" cx="5421.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 104" cx="5470.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 105" cx="5519.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 106" cx="5568.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 107" cx="5617.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 108" cx="5666.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 109" cx="5715.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 110" cx="5764.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 111" cx="5813.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 112" cx="5862.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 113" cx="5911.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 114" cx="5960.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 115" cx="6009.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 116" cx="6058.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 117" cx="6107.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 118" cx="6156.5" cy="1710.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 119" cx="6189.5" cy="1743.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 120" cx="6222.5" cy="1776.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 22" cx="3527.5" cy="4553.5" r="30" fill="#FF3A3A"/>
<circle id="Ellipse 343" cx="3527.5" cy="4947" r="30" fill="#D9D9D9"/>
<circle id="Ellipse 347" cx="3428.5" cy="5782"  r="30" fill="#D9D9D9"/>
<circle id="Ellipse 348" cx="3427.5" cy="5998"  r="30" fill="#D9D9D9"/>
<circle id="Ellipse 349" cx="3435.5" cy="6159"  r="30" fill="#D9D9D9"/>
<circle id="Ellipse 350" cx="3432.5" cy="6496"  r="30" fill="#D9D9D9"/>
<circle id="Ellipse 351" cx="3425.5" cy="7118"  r="30" fill="#D9D9D9"/>
<circle id="Ellipse 352" cx="3426.5" cy="7567"  r="30" fill="#D9D9D9"/>
<circle id="Ellipse 353" cx="3837.5" cy="7536"  r="30" fill="#D9D9D9"/>
<circle id="Ellipse 354" cx="3844.5" cy="7122"  r="30" fill="#D9D9D9"/>
<circle id="Ellipse 355" cx="3844.5" cy="6474"  r="30" fill="#D9D9D9"/>
<circle id="Ellipse 344" cx="3428.5" cy="5544"  r="30" fill="#D9D9D9"/>
<circle id="Ellipse 346" cx="3850.5" cy="5640"  r="30" fill="#D9D9D9"/>
<circle id="Ellipse 345" cx="3438.5" cy="4548"  r="30" fill="#D9D9D9"/>
</g>
`;

parseSvgToJson(svgData, '../../Data/routingNodes.json', 80);
