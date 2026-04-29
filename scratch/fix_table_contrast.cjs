const fs = require('fs');
const path = require('path');

const staffPagesDir = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Staff');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(staffPagesDir, (filePath) => {
    if (path.extname(filePath) === '.jsx') {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Replace all <Table that don't already have variant="dark"
        // This uses a negative lookahead to skip those that already have it
        content = content.replace(/<Table(?![^>]*variant="dark")/g, '<Table variant="dark"');

        if (content !== original) {
            fs.writeFileSync(filePath, content);
            console.log(`Fixed Table contrast in: ${path.relative(staffPagesDir, filePath)}`);
        }
    }
});
