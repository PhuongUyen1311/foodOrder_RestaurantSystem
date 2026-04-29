const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const imagesDir = path.join(__dirname, '..', 'backend', 'static', 'images');

// Slugify function (matching backend/app/helpers/slugifyVietnamese.js)
function slugify(text = "") {
    if (!text || typeof text !== "string") return "";
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
}

const categoriesMapping = {
    "Salad & Rau củ": "Appetizers",
    "Món đạm ít béo": "Main Courses",
    "Tinh bột": "Pho & Noodles",
    "Súp – canh": "Soups",
    "Tráng miệng": "Desserts",
    "Đồ uống": "Drinks"
};

const productsFile = path.join(dataDir, 'food_order.products.json');
const categoriesFile = path.join(dataDir, 'food_order.categories.json');

if (!fs.existsSync(productsFile) || !fs.existsSync(categoriesFile)) {
    console.error("Data files missing.");
    process.exit(1);
}

const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
const categories = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));

// 1. Rename Category Folders
const folders = fs.readdirSync(imagesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

folders.forEach(folder => {
    const parts = folder.split('_');
    const id = parts[parts.length - 1];
    const cat = categories.find(c => c._id.$oid === id);

    if (cat) {
        const newSlug = slugify(cat.name);
        const newFolderName = `${newSlug}_${id}`;
        if (folder !== newFolderName) {
            const oldPath = path.join(imagesDir, folder);
            const newPath = path.join(imagesDir, newFolderName);
            if (fs.existsSync(oldPath)) {
                if (fs.existsSync(newPath)) {
                    // Merge contents if target exists
                    fs.readdirSync(oldPath).forEach(file => {
                        fs.renameSync(path.join(oldPath, file), path.join(newPath, file));
                    });
                    fs.rmdirSync(oldPath);
                } else {
                    fs.renameSync(oldPath, newPath);
                }
                console.log(`Renamed category folder: ${folder} -> ${newFolderName}`);
            }
        }
    }
});

// 2. Rename Product Images inside folders
products.forEach(prod => {
    const catId = prod.category_id.$oid;
    const cat = categories.find(c => c._id.$oid === catId);
    if (!cat) return;

    const catSlug = slugify(cat.name);
    const catFolderName = `${catSlug}_${catId}`;
    const catPath = path.join(imagesDir, catFolderName);

    if (fs.existsSync(catPath)) {
        const oldImageName = prod.image;
        const newImageName = `${slugify(prod.name)}${path.extname(oldImageName || '.jpg')}`;

        if (oldImageName && oldImageName !== newImageName) {
            const oldImagePath = path.join(catPath, oldImageName);
            const newImagePath = path.join(catPath, newImageName);

            if (fs.existsSync(oldImagePath)) {
                fs.renameSync(oldImagePath, newImagePath);
                console.log(`Renamed product image: ${oldImageName} -> ${newImageName}`);
                // Update product image in memory to save back to JSON
                prod.image = newImageName;
            }
        }
    }
});

// 3. Save updated products JSON
fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
console.log("Updated food_order.products.json with new image names.");
