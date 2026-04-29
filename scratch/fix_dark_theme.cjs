const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Staff');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(pagesDir, (filePath) => {
    if (path.extname(filePath) === '.jsx') {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Replace bg-white with bg-dark and add text-white if not present
        content = content.replace(/className="([^"]*)bg-white([^"]*)"/g, (match, p1, p2) => {
            let classes = p1 + "bg-dark text-white" + p2;
            return `className="${classes.trim()}"`;
        });

        // Specific fix for table-light
        content = content.replace(/table-light/g, 'table-dark');

        if (content !== original) {
            fs.writeFileSync(filePath, content);
            console.log(`Updated theme classes: ${path.relative(pagesDir, filePath)}`);
        }
    }
});
