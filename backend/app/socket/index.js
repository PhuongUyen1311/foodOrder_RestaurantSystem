const { Server } = require("socket.io");
const actionHelper = require("../helpers/action.helper.js");
const tableController = require("../controllers/table.controller.js");

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("userConnect", (userId) => {
      actionHelper.updateSocket(userId, socket.id);
      socket.join("users_room");
    });

    socket.on("adminConnect", (userId) => {
      actionHelper.updateAdminSocket(userId, socket.id);
      socket.join("admins_room");
    });

    // --- CHAT SYSTEM EVENTS ---
    socket.on("sendMessage", async (data) => {
      try {
        const { sender, senderModel, receiver, receiverModel, type, content, fileUrl, orderId, conversationType } = data;
        
        const db = require("../models");
        const Message = db.message;
        const Admin = db.admin;
        const Customer = db.customer;

        // 1. Save message to database
        const newMessage = new Message({
          sender, senderModel, receiver, receiverModel, type, content, fileUrl, orderId, conversationType
        });
        const savedMessage = await newMessage.save();
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate('orderId')
          .populate('sender', 'first_name last_name avatar');

        // 2. Find receiver's socket_id or use broadcast
        if (!receiver && conversationType === 'customer') {
          // Broadcast to all admins (Client-to-Staff Queue)
          io.to("admins_room").emit("receiveMessage", populatedMessage);
        } else {
          // targeted message
          let receiverInfo = null;
          if (receiverModel === 'admin') {
            receiverInfo = await Admin.findById(receiver);
          } else {
            receiverInfo = await Customer.findById(receiver);
          }

          if (receiverInfo && receiverInfo.socket_id) {
            io.to(receiverInfo.socket_id).emit("receiveMessage", populatedMessage);
          }

          // [ADDITION] If staff is sending to customer, also broadcast to OTHER admins
          if (senderModel === 'admin' && receiverModel === 'customer' && conversationType === 'customer') {
            socket.to("admins_room").emit("receiveMessage", populatedMessage);
          }
        }

        // 4. Emit back to sender
        socket.emit("messageSent", populatedMessage);

      } catch (error) {
        console.error("Socket sendMessage error:", error);
      }
    });

    socket.on("typing", async (data) => {
      const { receiver, receiverModel, isTyping, senderId, senderName, conversationType } = data;
      
      // If it's a customer typing (sender is customer), notify ALL admins
      if (conversationType === 'customer' && receiverModel === 'admin') {
        socket.to("admins_room").emit("displayTyping", { senderId, senderName, isTyping, conversationType: 'customer' });
        return;
      }

      // If it's a staff typing to customer, notify other admins for coordination
      if (conversationType === 'customer' && receiverModel === 'customer') {
          socket.to("admins_room").emit("staffTyping", { staffName: senderName, customerId: receiver, isTyping });
      }

      // Existing 1-1 typing logic
      const db = require("../models");
      let receiverInfo = null;
      if (receiverModel === 'admin') {
        receiverInfo = await db.admin.findById(receiver);
      } else {
        receiverInfo = await db.customer.findById(receiver);
      }

      if (receiverInfo && receiverInfo.socket_id) {
        io.to(receiverInfo.socket_id).emit("displayTyping", { senderId, senderName, isTyping });
      }
    });

    socket.on("tableChange", async () => {
      try {
        const tables = await tableController.getTablesListInternal();
        io.emit("tableUpdated", tables);
      } catch (error) {
        console.error("Error fetching tables:", error);
      }
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);
      const db = require("../models");
      // Find who disconnected and clear their socket_id
      try {
        const admin = await db.admin.findOneAndUpdate({ socket_id: socket.id }, { socket_id: null });
        const customer = await db.customer.findOneAndUpdate({ socket_id: socket.id }, { socket_id: null });
      } catch (err) {
        console.error("Socket disconnect error:", err);
      }
    });
  });

  // Tự động kiểm tra và giải phóng bàn sau mỗi 1 phút
  setInterval(async () => {
    try {
      // Hàm này đã bao gồm logic updateMany để hủy các đơn quá hạn
      const tables = await tableController.getTablesListInternal();
      // Luôn phát sóng để đảm bảo UI khách hàng và admin đồng bộ theo thời gian thực
      io.emit("tableUpdated", tables);
    } catch (error) {
      console.error("Error in auto-cleanup interval:", error);
    }
  }, 60000);

  // attach io to the the export itself so it can be dynamically accessed by controllers later
  module.exports.io = io;
  module.exports.updateOrder = require("./process.order.js")(io);

  return io;
};
