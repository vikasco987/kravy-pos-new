const fs = require('fs');
const file = '/Users/vikas/.gemini/antigravity-ide/scratch/kravy-pos-new/src/app/dashboard/menu/view/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the handle Enter on zone input
const searchEnter = 'fetch("/api/profile").then(r => r.json()).then(d => setBusiness(d.profile));\n                              setSelectedAiZone(newAiZone.trim().toUpperCase());';
const replaceEnter = 'const newZ = newAiZone.trim().toUpperCase();\n                              setBusiness((prev: any) => prev ? { ...prev, zones: Array.from(new Set([...(prev.zones || []), newZ])) } : prev);\n                              fetch("/api/profile").then(r => r.json()).then(d => setBusiness(d.profile));\n                              setSelectedAiZone(newZ);';

content = content.replace(searchEnter, replaceEnter);
// There are two identical blocks (one for onKeyDown Enter, one for onClick Save)
content = content.replace(searchEnter, replaceEnter);

fs.writeFileSync(file, content);
console.log("Patched successfully");
