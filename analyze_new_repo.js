import fs from 'fs';
import path from 'path';

const rootDir = 'c:\\\\Users\\\\RentoBees\\\\Desktop\\\\kravy-pos-new';
const dirsToScan = ['src', 'prisma'];
const ignoreDirs = ['node_modules', '.git', '.next', '.expo'];

let md = '# Kravy POS New - Deep Analysis\n\n';

function scanDir(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (ignoreDirs.includes(file)) continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            md += `\n## Directory: ${prefix}${file}\n\n`;
            scanDir(fullPath, `${prefix}${file}/`);
        } else {
            if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js') && !file.endsWith('.json') && !file.endsWith('.prisma')) continue;
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n').length;
            const sizeKB = (stat.size / 1024).toFixed(2);

            md += `### ${prefix}${file}\n`;
            md += `- **Size**: ${sizeKB} KB\n`;
            md += `- **Lines**: ${lines}\n`;

            const imports = (content.match(/^import .* from/gm) || []).length;
            const exports = (content.match(/export (default |const |function |class |let )/g) || []).length;

            if (imports > 0) md += `- **Imports**: ${imports}\n`;
            if (exports > 0) md += `- **Exports**: ${exports}\n`;
            md += '\n';
        }
    }
}

for (const d of dirsToScan) {
    const fullDir = path.join(rootDir, d);
    if (fs.existsSync(fullDir)) {
        md += `\n## Main Folder: ${d}\n\n`;
        scanDir(fullDir, `${d}/`);
    }
}

fs.writeFileSync(path.join(rootDir, 'new_repo_deep_analysis.md'), md);
console.log('Analysis saved to new_repo_deep_analysis.md');
