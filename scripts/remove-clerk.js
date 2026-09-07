const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src/app/api');
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Remove Clerk imports
    content = content.replace(/import\s+\{\s*auth\s*\}\s+from\s+['"]@clerk\/nextjs\/server['"];?\n?/g, '');
    content = content.replace(/import\s+\{\s*auth\s*,\s*currentUser\s*\}\s+from\s+['"]@clerk\/nextjs\/server['"];?\n?/g, '');
    content = content.replace(/import\s+\{\s*auth\s*,\s*clerkClient\s*\}\s+from\s+['"]@clerk\/nextjs\/server['"];?\n?/g, 'import { clerkClient } from "@clerk/nextjs/server";\n');
    content = content.replace(/import\s+\{\s*getAuth\s*\}\s+from\s+['"]@clerk\/nextjs\/server['"];?\n?/g, '');
    content = content.replace(/\/\/\s*import\s+\{\s*auth\s*\}\s+from\s+['"]@clerk\/nextjs\/server['"];?\n?/g, '');
    content = content.replace(/\/\/\s*import\s+\{\s*clerkClient\s*\}\s+from\s+['"]@clerk\/nextjs\/server['"];?\n?/g, '');
    content = content.replace(/\/\/\s*import\s+\{\s*getAuth\s*\}\s+from\s+['"]@clerk\/nextjs\/server['"].*?\n?/g, '');
    
    // Replace const { userId } = await auth(); with getEffectiveClerkId
    if (content.includes('auth()') && !content.includes('getEffectiveClerkId')) {
        content = `import { getEffectiveClerkId } from "@/lib/auth-utils";\n` + content;
    }
    content = content.replace(/const\s+\{\s*userId\s*\}\s*=\s*await\s*auth\(\);/g, 'const userId = await getEffectiveClerkId();');

    // Replace getAuth(req) with getEffectiveClerkId
    content = content.replace(/const\s+\{\s*userId\s*\}\s*=\s*getAuth\(req\);/g, 'const userId = await getEffectiveClerkId();');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Modified ${modifiedCount} files.`);
