const { getIO } = require("./index");

const sendOrderStatus = (socketId, order) => {
    const io = getIO();
    io.to(socketId).emit("sendStatusOrder", order);
};

const sendListOrder = (socketId, listOrder) => {
    const io = getIO();
    io.to(socketId).emit("sendListOrder", listOrder);
};

module.exports = {
    sendOrderStatus,
    sendListOrder
};