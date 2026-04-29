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

        // Remove text-dark
        content = content.replace(/\btext-dark\b/g, '');
        
        // Clean up multiple spaces
        content = content.replace(/  +/g, ' ');
        content = content.replace(/ \b/g, ' '); // simple trim spaces inside quotes is hard with simple regex, but collapse spaces helps
        content = content.replace(/className="\s+/g, 'className="');
        content = content.replace(/\s+"/g, '"');

        // Replace bg-white and bg-light with bg-dark or remove them depending on context. 
        // For badges, bg-light is often used. We can change it to bg-secondary for better dark theme look.
        content = content.replace(/\bbg-light\b/g, 'bg-secondary');
        content = content.replace(/\bbg-white\b/g, 'bg-dark');

        if (content !== original) {
            fs.writeFileSync(filePath, content);
            console.log(`Cleaned up contrast classes in: ${path.relative(staffPagesDir, filePath)}`);
        }
    }
});
