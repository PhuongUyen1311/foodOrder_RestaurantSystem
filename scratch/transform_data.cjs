const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

const categoriesMapping = {
    "Salad & Rau củ": "Appetizers",
    "Món đạm ít béo": "Main Courses",
    "Tinh bột": "Pho & Noodles",
    "Súp – canh": "Soups",
    "Tráng miệng": "Desserts",
    "Đồ uống": "Drinks"
};

const productsMapping = {
    "Salad ức gà sốt mè rang": { name: "Fried Spring Rolls (Nem Rán)", detail: "Crispy spring rolls with pork and shrimp." },
    "Salad cá ngừ dầu oliu": { name: "Fresh Summer Rolls (Gỏi Cuốn)", detail: "Fresh rice paper rolls with herbs and shrimp." },
    "Salad tôm trứng": { name: "Beef Papaya Salad (Nộm Bò Khô)", detail: "Spicy papaya salad with dried beef." },
    "Salad quinoa rau củ": { name: "Banana Blossom Salad (Nộm Hoa Chuối)", detail: "Traditional salad with chicken and banana blossom." },
    "Salad trứng bơ": { name: "Lotus Root Salad (Gỏi Ngó Sen)", detail: "Refreshing lotus root salad with pork and shrimp." },
    "Ức gà áp chảo không dầu": { name: "Beef Pho (Phở Bò)", detail: "Traditional Vietnamese noodle soup with beef slices." },
    "Cá hồi áp chảo sốt chanh": { name: "Chicken Pho (Phở Gà)", detail: "Vietnamese noodle soup with tender chicken." },
    "Cá basa hấp gừng": { name: "Bun Cha Ha Noi", detail: "Grilled pork patties with vermicelli and herbs." },
    "Đậu hũ non hấp nấm": { name: "Bun Bo Hue", detail: "Spicy beef noodle soup from central Vietnam." },
    "Trứng hấp rau củ": { name: "Quang Style Noodles (Mì Quảng)", detail: "Central Vietnamese noodles with turmeric and shrimp." },
    "Cơm gạo lứt": { name: "Broken Rice with Grilled Pork (Cơm Tấm)", detail: "Broken rice served with grilled pork chop." },
    "Khoai lang nướng": { name: "Claypot Fish (Cá Kho Tộ)", detail: "Caramelized fish cooked in a traditional claypot." },
    "Yến mạch nấu sữa hạt": { name: "Chicken Claypot Rice (Cơm Gà Hội An)", detail: "Hoi An style chicken rice." },
    "Bún gạo lứt trộn rau": { name: "Beef Luc Lac (Shaking Beef)", detail: "Sautéed beef cubes with onions and peppers." },
    "Mì gạo lứt trộn ức gà": { name: "Banh Mi Special", detail: "Vietnamese baguette with assorted meats and pate." },
    "Canh rong biển": { name: "Sweet & Sour Soup (Canh Chua)", detail: "Vietnamese sweet and sour soup with fish and pineapple." },
    "Canh bí đỏ hầm xương": { name: "Bitter Melon Soup (Canh Khổ Qua)", detail: "Stuffed bitter melon soup." },
    "Canh rau củ thập cẩm": { name: "Crab Asparagus Soup (Súp Cua)", detail: "Thick soup with crab meat and asparagus." },
    "Canh súp lơ": { name: "Lotus Seed Soup", detail: "Healthy soup with lotus seeds and pork." },
    "Canh cà chua trứng": { name: "Tomato Egg Soup", detail: "Light soup with tomato and egg." },
    "Sữa chua Hy Lạp trái cây": { name: "Flan Cake", detail: "Caramel custard pudding." },
    "Trái cây tươi ": { name: "Tropical Fruit Platter", detail: "Assorted fresh seasonal fruits." },
    "Bánh táo quế": { name: "Mango Sticky Rice", detail: "Sweet sticky rice with fresh mango and coconut milk." },
    "Chè hạt sen long nhãn": { name: "Lotus Seed & Longan Sweet Soup", detail: "Refreshing traditional sweet soup." },
    "Pudding hạt chia sữa hạnh nhân": { name: "Mixed Beans Sweet Soup (Chè Thập Cẩm)", detail: "Assorted beans with coconut milk." },
    "Nước ép cam cà rốt": { name: "Vietnamese Iced Coffee (Cà Phê Sữa Đá)", detail: "Strong drip coffee with condensed milk." },
    "Sinh tố kiwi": { name: "Iced Lime Juice", detail: "Freshly squeezed lime juice." },
    "Sinh tố dâu": { name: "Fresh Coconut Water", detail: "Natural sweet coconut water." },
    "Sinh tố xoài sữa chua": { name: "Lotus Tea", detail: "Fragrant Vietnamese tea infused with lotus." },
    "Rau má đậu xanh": { name: "Artichoke Tea", detail: "Healthy herbal tea from Da Lat." }
};

const ingredientsMapping = {
    "Ức gà": "Chicken Breast",
    "Xà lách": "Lettuce",
    "Sốt mè rang": "Sesame Dressing",
    "Cá ngừ": "Tuna",
    "Dầu oliu": "Olive Oil",
    "Tôm": "Shrimp",
    "Trứng gà": "Egg",
    "Quinoa": "Quinoa",
    "Rau củ luộc": "Boiled Vegetables",
    "Bơ": "Avocado",
    "Cá hồi": "Salmon",
    "Cá basa": "Basa Fish",
    "Đậu hũ non": "Soft Tofu",
    "Nấm": "Mushroom",
    "Gừng": "Ginger",
    "Chanh": "Lime",
    "Rau củ hỗn hợp": "Mixed Vegetables",
    "Gạo lứt": "Brown Rice",
    "Khoai lang": "Sweet Potato",
    "Yến mạch": "Oats",
    "Sữa hạt": "Nut Milk",
    "Bún gạo lứt": "Brown Rice Vermicelli",
    "Mì gạo lứt": "Brown Rice Noodles",
    "Rong biển": "Seaweed",
    "Bí đỏ": "Pumpkin",
    "Xương heo": "Pork Bones",
    "Súp lơ xanh": "Broccoli",
    "Cà chua": "Tomato",
    "Hạt sen": "Lotus Seed",
    "Long nhãn": "Longan",
    "Đường phèn": "Rock Sugar",
    "Sữa chua Hy Lạp": "Greek Yogurt",
    "Táo": "Apple",
    "Bột mì": "Flour",
    "Bột quế": "Cinnamon Powder",
    "Hạt chia": "Chia Seeds",
    "Sữa hạnh nhân": "Almond Milk",
    "Cam": "Orange",
    "Cà rốt": "Carrot",
    "Kiwi": "Kiwi",
    "Dâu tây": "Strawberry",
    "Xoài": "Mango",
    "Rau má": "Pennywort",
    "Đậu xanh": "Mung Bean"
};

// 1. Transform Categories
const categoryFile = path.join(dataDir, 'food_order.categories.json');
if (fs.existsSync(categoryFile)) {
    let data = JSON.parse(fs.readFileSync(categoryFile, 'utf8'));
    data = data.map(item => ({ ...item, name: categoriesMapping[item.name] || item.name }));
    fs.writeFileSync(categoryFile, JSON.stringify(data, null, 2));
    console.log('Categories updated.');
}

// 2. Transform Products
const productFile = path.join(dataDir, 'food_order.products.json');
if (fs.existsSync(productFile)) {
    let data = JSON.parse(fs.readFileSync(productFile, 'utf8'));
    data = data.map(item => {
        const mapped = productsMapping[item.name];
        if (mapped) {
            return { ...item, name: mapped.name, detail: mapped.detail };
        }
        return item;
    });
    fs.writeFileSync(productFile, JSON.stringify(data, null, 2));
    console.log('Products updated.');
}

// 3. Transform Ingredients
const ingredientFile = path.join(dataDir, 'food_order.ingredients.json');
if (fs.existsSync(ingredientFile)) {
    let data = JSON.parse(fs.readFileSync(ingredientFile, 'utf8'));
    data = data.map(item => ({ ...item, name: ingredientsMapping[item.name] || item.name }));
    fs.writeFileSync(ingredientFile, JSON.stringify(data, null, 2));
    console.log('Ingredients updated.');
}

// 4. Transform BOMs
const bomFile = path.join(dataDir, 'food_order.product_boms.json');
if (fs.existsSync(bomFile)) {
    let data = JSON.parse(fs.readFileSync(bomFile, 'utf8'));
    data = data.map(item => {
        const mapped = productsMapping[item.product_name];
        if (mapped) {
            return { ...item, product_name: mapped.name };
        }
        return item;
    });
    fs.writeFileSync(bomFile, JSON.stringify(data, null, 2));
    console.log('BOMs updated.');
}

// 5. Transform Tables
const tableFile = path.join(dataDir, 'food_order.tables.json');
if (fs.existsSync(tableFile)) {
    let data = JSON.parse(fs.readFileSync(tableFile, 'utf8'));
    const statusMap = {
        "Đang sử dụng": "In Use",
        "Trống": "Empty",
        "Đã đặt": "Reserved",
        "Hoàn thành": "Completed",
        "Đã hủy": "Cancelled"
    };
    const locationMap = {
        "Tầng 1 trong nhà": "1st Floor Indoor",
        "Tầng 2 trong nhà": "2nd Floor Indoor",
        "Tầng 1 ngoài trời": "1st Floor Outdoor",
        "Tầng 2 ngoài trời": "2nd Floor Outdoor"
    };
    data = data.map(item => ({
        ...item,
        status: statusMap[item.status] || item.status,
        location: locationMap[item.location] || item.location
    }));
    fs.writeFileSync(tableFile, JSON.stringify(data, null, 2));
    console.log('Tables updated.');
}

console.log("All data files transformed to Vietnamese Cuisine theme.");

