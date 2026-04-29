const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'frontend', 'src');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const fixMap = {
    "Searching...n ăn yêu thích": "Search for favorite dishes",
    "Searching...utton>": "Search</button>",
    "Searching...n ăn yêu thích của bạn...": "Search for your favorite dishes...",
    "Loading... liệu...": "Loading data...",
    "Searching...": "Searching..."
};

walkDir(srcDir, (filePath) => {
    if (path.extname(filePath) === '.jsx') {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        for (let [corrupted, fixed] of Object.entries(fixMap)) {
            content = content.replace(new RegExp(corrupted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fixed);
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content);
            console.log(`Fixed corruption: ${path.relative(srcDir, filePath)}`);
        }
    }
});
