const fs = require('fs');
require('dotenv').config({path: 'c:/Users/jofob/Desktop/HK2(25-26)/Specialized_Project/DACN/backend/.env'});

async function run() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await res.json();
    fs.writeFileSync('c:/Users/jofob/Desktop/HK2(25-26)/Specialized_Project/DACN/backend/models.json', JSON.stringify(data, null, 2));
  } catch (e) {
    fs.writeFileSync('c:/Users/jofob/Desktop/HK2(25-26)/Specialized_Project/DACN/backend/models.json', JSON.stringify({error: e.message}));
  }
}
run();
