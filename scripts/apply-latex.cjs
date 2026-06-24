const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix imports
    content = content.replace(/import\s+\{\s*BlockMath,\s*InlineMath\s*\}\s+from\s+"@\/components\/ui\/math";\n?/g, 'import Latex from "react-latex-next";\n');
    content = content.replace(/import\s+\{\s*InlineMath\s*\}\s+from\s+"@\/components\/ui\/math";\n?/g, 'import Latex from "react-latex-next";\n');
    content = content.replace(/import\s+\{\s*BlockMath\s*\}\s+from\s+"@\/components\/ui\/math";\n?/g, 'import Latex from "react-latex-next";\n');
    
    content = content.replace(/import\s+\{\s*BlockMath,\s*InlineMath\s*\}\s+from\s+"react-katex";\n?/g, 'import Latex from "react-latex-next";\n');
    content = content.replace(/import\s+\{\s*InlineMath\s*\}\s+from\s+"react-katex";\n?/g, 'import Latex from "react-latex-next";\n');
    content = content.replace(/import\s+\{\s*BlockMath\s*\}\s+from\s+"react-katex";\n?/g, 'import Latex from "react-latex-next";\n');
    
    content = content.replace(/import\s+"katex\/dist\/katex\.min\.css";\n?/g, '');

    // Replace InlineMath
    content = content.replace(/<InlineMath\s+math=\{String\.raw`([^`]+)`\}\s*\/>/g, '<Latex>{String.raw`$$$1$$`}</Latex>');
    content = content.replace(/<InlineMath\s+math="([^"]+)"\s*\/>/g, '<Latex>{String.raw`$$$1$$`}</Latex>');
    content = content.replace(/<InlineMath\s+math=\{'([^']+)'\}\s*\/>/g, '<Latex>{String.raw`$$$1$$`}</Latex>');
    // fallback for variables: <InlineMath math={variable} />
    content = content.replace(/<InlineMath\s+math=\{([^}]+)\}\s*\/>/g, '<Latex>{`$$${$1}$$`}</Latex>'); 
    
    // Replace BlockMath
    content = content.replace(/<BlockMath\s+math=\{String\.raw`([^`]+)`\}\s*\/>/g, '<Latex>{String.raw`$$$$$1$$$$`}</Latex>');
    content = content.replace(/<BlockMath\s+math="([^"]+)"\s*\/>/g, '<Latex>{String.raw`$$$$$1$$$$`}</Latex>');
    content = content.replace(/<BlockMath\s+math=\{'([^']+)'\}\s*\/>/g, '<Latex>{String.raw`$$$$$1$$$$`}</Latex>');
    // fallback for variables: <BlockMath math={variable} />
    content = content.replace(/<BlockMath\s+math=\{([^}]+)\}\s*\/>/g, '<Latex>{`$$$$${$1}$$$$`}</Latex>'); 

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

processDir('src');

// Update index.html
const indexFile = 'index.html';
let indexContent = fs.readFileSync(indexFile, 'utf8');
if (!indexContent.includes('katex.min.css')) {
    indexContent = indexContent.replace('</head>', '  <link href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.css" rel="stylesheet">\n  </head>');
    fs.writeFileSync(indexFile, indexContent, 'utf8');
    console.log('Updated index.html');
}
