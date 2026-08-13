import { Project, SyntaxKind, ArrowFunction, FunctionDeclaration, Node } from "ts-morph";

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.tsx");
project.addSourceFilesAtPaths("src/**/*.ts");

let changedFilesCount = 0;

project.getSourceFiles().forEach((sourceFile) => {
    let hasConfirmCall = false;
    let needsImport = false;
    let hasUseConfirmHook = false;

    // Check if useConfirm is already imported
    const imports = sourceFile.getImportDeclarations();
    const hasImport = imports.some(imp => 
        imp.getModuleSpecifierValue() === "@/components/ConfirmContext" &&
        imp.getNamedImports().some(n => n.getName() === "useConfirm")
    );

    // Find all 'confirm' calls
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    
    // We must process them in reverse or grab references first because replaceWithText forgets nodes.
    const nodesToReplace: { node: any, isWindow: boolean, funcToAsync: any }[] = [];

    callExpressions.forEach((callExpr) => {
        const expression = callExpr.getExpression();
        const text = expression.getText();
        
        if (text === "confirm" || text === "window.confirm") {
            const parent = callExpr.getParent();
            const isAwaited = parent.getKind() === SyntaxKind.AwaitExpression;
            
            if (!isAwaited) {
               let func = callExpr.getFirstAncestorByKind(SyntaxKind.ArrowFunction) || 
                          callExpr.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) ||
                          callExpr.getFirstAncestorByKind(SyntaxKind.FunctionExpression);
               
               nodesToReplace.push({ node: callExpr, isWindow: text === "window.confirm", funcToAsync: func });
            } else if (text === "window.confirm") {
               nodesToReplace.push({ node: callExpr, isWindow: true, funcToAsync: null });
            }
        }
    });

    if (nodesToReplace.length > 0) {
        hasConfirmCall = true;
        needsImport = !hasImport;
        hasUseConfirmHook = true;

        // Perform modifications safely
        nodesToReplace.forEach(({ node, isWindow, funcToAsync }) => {
            if (funcToAsync && !funcToAsync.isAsync()) {
                funcToAsync.setIsAsync(true);
            }
            
            const args = node.getArguments().map((a: any) => a.getText()).join(", ");
            // For await to work it has to be inside an async function. We just made it async.
            node.replaceWithText(`await confirm(${args})`);
        });
    }

    if (hasConfirmCall || hasUseConfirmHook) {
        // Inject import if needed
        if (needsImport && !hasImport) {
            sourceFile.addImportDeclaration({
                namedImports: ["useConfirm"],
                moduleSpecifier: "@/components/ConfirmContext"
            });
        }

        const functions = sourceFile.getFunctions();
        const arrowFuncs = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
        const allFuncs = [...functions, ...sourceFile.getVariableDeclarations().map(v => v.getInitializerIfKind(SyntaxKind.ArrowFunction)).filter(Boolean)];
        
        let injected = false;
        
        for (const func of allFuncs) {
            if (!func) continue;
            try {
                const body = (func as any).getBody ? (func as any).getBody() : undefined;
                if (body && Node.isBlock(body)) {
                     const bodyText = body.getText();
                     if (!bodyText.includes("useConfirm()") && bodyText.includes("await confirm(")) {
                         body.insertStatements(0, "const { confirm } = useConfirm();");
                         injected = true;
                     }
                }
            } catch (e) {
                // Ignore error if node forgotten
            }
        }
        
        sourceFile.saveSync();
        console.log(`Updated ${sourceFile.getFilePath()}`);
        changedFilesCount++;
    }
});

console.log(`Total files updated: ${changedFilesCount}`);
