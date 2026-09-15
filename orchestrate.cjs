const { execSync, spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'src/app/dashboard/menu/view/page.tsx');
const debounceFile = path.join(__dirname, 'src/hooks/useDebounce.ts');
const middlewareFile = path.join(__dirname, 'src/middleware.ts');
const layoutFile = path.join(__dirname, 'src/components/ClientLayout.tsx');

const debounceHookCode = `
import { useState, useEffect } from "react";
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
`;

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function runScenario(scenarioName) {
  console.log(`\n\n=== RUNNING SCENARIO: ${scenarioName} ===`);
  
  console.log("Killing old servers on 3001...");
  try { execSync('kill -9 $(lsof -t -i:3001)'); } catch(e){}
  console.log("Building...");
  const rm = spawnSync('rm', ['-rf', '.next']);
  if (rm.error) {
     console.error("Failed to delete .next", rm.error);
  }
  const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
  
  console.log("Starting Server...");
  const server = spawn('npm', ['run', 'start'], {
    env: { ...process.env, PORT: '3001' },
    detached: true
  });
  
  await wait(8000); // wait for server to bind

  console.log("Running Playwright Benchmark...");
  try {
    execSync(`node strict-benchmark.cjs "${scenarioName}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error("Benchmark failed, aborting further runs:", e.message);
    process.exit(1);
  }
  
  console.log("Killing Server...");
  try { process.kill(-server.pid); } catch(e){}
  await wait(2000);
}

function restoreCode() {
  execSync('git checkout src/app/dashboard/menu/view/page.tsx src/middleware.ts src/components/ClientLayout.tsx');
  if (fs.existsSync(debounceFile)) fs.unlinkSync(debounceFile);
}

function applyAuthBypass() {
  let middleware = fs.readFileSync(middlewareFile, 'utf-8');
  middleware = middleware.replace(/export async function middleware\(request: NextRequest\) \{[\s\S]*?return NextResponse.next\(\);\n\}/, 'export async function middleware(request: NextRequest) { return NextResponse.next(); }');
  fs.writeFileSync(middlewareFile, middleware);

  let layout = fs.readFileSync(layoutFile, 'utf-8');
  layout = layout.replace('if (!authUser) {\n    return <SessionExpiredRedirect />;\n  }', 'if (!authUser) { }');
  fs.writeFileSync(layoutFile, layout);
}

function applyDebounce() {
  if (!fs.existsSync(path.dirname(debounceFile))) {
    fs.mkdirSync(path.dirname(debounceFile), { recursive: true });
  }
  fs.writeFileSync(debounceFile, debounceHookCode);
  let code = fs.readFileSync(pageFile, 'utf-8');
  code = code.replace(
    'import { Plus, Search, ChevronDown, Trash2, Pencil, RotateCcw, Check, X, Sparkles, Image as ImageIcon, Loader2, Globe, Zap, Printer, File, Heart } from "lucide-react";',
    'import { Plus, Search, ChevronDown, Trash2, Pencil, RotateCcw, Check, X, Sparkles, Image as ImageIcon, Loader2, Globe, Zap, Printer, File, Heart, Copy, GripVertical, IndianRupee, Layers, LayoutGrid, ListFilter, Edit2, MonitorSmartphone } from "lucide-react";\nimport { useDebounce } from "@/hooks/useDebounce";'
  );
  code = code.replace(
    '  const [query, setQuery] = useState("");',
    '  const [query, setQuery] = useState("");\n  const debouncedQuery = useDebounce(query, 300);'
  );
  code = code.replace(/query\.trim\(\)/g, 'debouncedQuery.trim()');
  code = code.replace(/, query\]/g, ', debouncedQuery]');
  fs.writeFileSync(pageFile, code);
}

function applyMotionFix() {
  let code = fs.readFileSync(pageFile, 'utf-8');
  code = code.replace(/motion\.div/g, 'div');
  code = code.replace(/layout/g, '');
  code = code.replace(/whileHover=\{\{.*?\}\}/g, '');
  code = code.replace(/initial=\{\{.*?\}\}/g, '');
  code = code.replace(/animate=\{\{.*?\}\}/g, '');
  code = code.replace(/exit=\{\{.*?\}\}/g, '');
  fs.writeFileSync(pageFile, code);
}

async function main() {
  const configs = [
    { name: 'D', debounce: true, motionFix: true }
  ];

  for (const cfg of configs) {
    console.log(`\n=== RUN CONFIG ${cfg.name} ===`);
    restoreCode();
    applyAuthBypass();
    if (cfg.debounce) applyDebounce();
    if (cfg.motionFix) applyMotionFix();
    // Run 3 iterations per config
    for (let run = 1; run <= 3; run++) {
      console.log(`--- Iteration ${run} of config ${cfg.name} ---`);
      await runScenario(`${cfg.name}-${run}`);
      // Cleanup before next iteration / config
      restoreCode();
      applyAuthBypass();
      if (cfg.debounce) applyDebounce();
      if (cfg.motionFix) applyMotionFix();
    }
    // Final cleanup before next config
    restoreCode();
  }

  console.log("=== ALL DONE ===");
}

main().catch(console.error);
