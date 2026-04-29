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

        // Replace <thead> with <thead className="table-dark">
        content = content.replace(/<thead>/g, '<thead className="table-dark">');
        
        // Replace <thead className="..."> if it doesn't have table-dark
        content = content.replace(/<thead className="(?![^"]*table-dark)([^"]*)"/g, '<thead className="$1 table-dark"');

        // Fix specific style overrides for thead
        content = content.replace(/<thead style=\{\{ backgroundColor: '[^']*' \}\}>/g, '<thead className="table-dark">');

        if (content !== original) {
            fs.writeFileSync(filePath, content);
            console.log(`Unified Table header: ${path.relative(staffPagesDir, filePath)}`);
        }
    }
});
