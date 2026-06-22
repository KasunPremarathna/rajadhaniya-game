const fs = require('fs');
const code = fs.readFileSync('c:/Apps/rajadhani/web/game_bridge.js', 'utf8');
let open = 0;
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  for (let c of line) {
    if (c === '{') open++;
    if (c === '}') open--;
  }
  if (line.includes('function ')) {
    console.log(`Line ${i + 1}: depth ${open} - ${line.trim()}`);
  }
}
