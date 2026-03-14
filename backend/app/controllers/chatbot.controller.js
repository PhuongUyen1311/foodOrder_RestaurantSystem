const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../models");
const Product = db.product;
const ProductBOM = require("../models/productBom.model");
const Ingredient = require("../models/ingredient.model");

// Hàm sinh prompt chuẩn bị data
const generateSystemPrompt = async () => {
  try {
    const products = await Product.find({ is_active: true });
    
    // Lấy thông tin thành phần cho từng món
    let menuContext = "Danh sách menu của nhà hàng:\n";
    for (const p of products) {
      const boms = await ProductBOM.find({ product_id: p._id }).populate("ingredient_id");
      let ingredientsStr = boms.map(bom => {
         if (bom.ingredient_id) {
            return `${bom.quantity} ${bom.unit} ${bom.ingredient_id.name}`;
         }
         return "";
      }).filter(Boolean).join(", ");
      
      menuContext += `- Món: ${p.name} | Giá: ${p.price} VND${p.detail ? ` | Chi tiết: ${p.detail}` : ''}\n`;
      if (ingredientsStr) {
          menuContext += `  Công thức (Thành phần nguyên liệu): ${ingredientsStr}\n`;
      }
    }

    const systemPrompt = `
Bạn là chuyên gia dinh dưỡng và nhân viên tư vấn của quán Healthy Food.
Dưới đây là BỐI CẢNH dữ liệu thực đơn DUY NHẤT của nhà hàng (kèm thành phần nguyên liệu nguyên thủy).
Nhiệm vụ của bạn:
1. Chỉ tư vấn và đề xuất các món có trong menu nhà hàng. Tuyệt đối KHÔNG tự bịa ra món khác.
2. Dựa vào công thức nguyên liệu của từng món, hãy phân tích lượng Calories, Protein, Fat, Carbs ước tính một cách khoa học khi khách hàng hỏi hoặc cần so sánh. (Ví dụ 100g ức gà ~ 165 kcal, 31g protein).
3. Nếu khách muốn giảm cân/tăng cơ/... hãy chọn ra các món phù hợp nhất từ menu để gợi ý.
4. Trả lời thân thiện, súc tích, dễ hiểu. Rất hạn chế nói dài dòng.

${menuContext}
`;
    return systemPrompt;
  } catch (error) {
    console.error("Error generating prompt:", error);
    return "Bạn là trợ lý ảo của nhà hàng. Xin lỗi nhưng hiện tại hệ thống dữ liệu đang lỗi.";
  }
};

exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on server. Xin hãy thêm GEMINI_API_KEY vào biến môi trường (.env)." });
    }

    // Initialize Generative AI
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = await generateSystemPrompt();

    // Dùng format history của Gemini
    let formattedHistory = [];
    if (history && Array.isArray(history)) {
       formattedHistory = history.map(h => ({
         role: h.role === 'bot' ? 'model' : 'user',
         parts: [{ text: h.content }]
       }));
    }

    // Inject system prompt under history for Gemini 1.5 because systemInstruction config is sometimes flaky or unsupported depending on package version
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "SYSTEM INSTRUCTION (Read and simulate this role): " + systemInstruction }] },
        { role: "model", parts: [{ text: "Tôi đã hiểu nội dung hướng dẫn và danh sách món ăn. Tôi sẽ bắt đầu tư vấn như một chuyên gia dinh dưỡng của quán." }] },
        ...formattedHistory
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ response: text });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
