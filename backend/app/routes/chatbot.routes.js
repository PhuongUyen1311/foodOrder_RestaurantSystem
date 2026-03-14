module.exports = app => {
    const chatbot = require("../controllers/chatbot.controller.js");
    var router = require("express").Router();
  
    // POST /api/chatbot/chat
    router.post("/chat", chatbot.chat);
  
    app.use("/api/chatbot", router);
};
