const db = require("../models");
const Table = db.table;
const QRCode = require("qrcode");

// Lấy bàn theo QR
exports.getTableByQRCode = async (qrCode) => {
    const table = await Table.findOne({ qrCode });

    if (!table) {
        throw { status: 404, message: "Table không tồn tại." };
    }

    if (!table.isAvailable) {
        throw { status: 400, message: "Table has been VNDặt hoặc không thể sử dụng" };
    }

    return table;
};

// Add Table
exports.addTable = async (data) => {
    const { tableNumber, seatingCapacity, location } = data;

    if (!tableNumber || !seatingCapacity || !location) {
        throw { status: 400, message: "Please cung cấp full VNDủ thông tin." };
    }

    if (seatingCapacity < 1) {
        throw { status: 400, message: "Capacity phải lớn hơn 0." };
    }

    const newTable = new Table({ tableNumber, seatingCapacity, location });

    await newTable.save();

    const menuUrl = `${process.env.FRONTEND_URL}/menu?table=${tableNumber}`;
    const qrCodeDataURL = await QRCode.toDataURL(menuUrl);

    newTable.qrCode = qrCodeDataURL;
    await newTable.save();

    return newTable;
};

// Update bàn
exports.updateTable = async (id, data) => {
    const updatedTable = await Table.findByIdAndUpdate(id, data, { new: true });

    if (!updatedTable) {
        throw { status: 404, message: "Table không tồn tại." };
    }

    return updatedTable;
};

// Delete bàn
exports.deleteTable = async (id) => {
    const deletedTable = await Table.findByIdAndDelete(id);

    if (!deletedTable) {
        throw { status: 404, message: "Table không tồn tại." };
    }

    return true;
};

// Lấy tất cả bàn
exports.getAllTables = async () => {
    return await Table.find().sort({ tableNumber: 1 });
};

// Bắt VNDầu sử dụng bàn
exports.startUsingTable = async (id) => {
    const updatedTable = await Table.findByIdAndUpdate(
        id,
        {
            status: "In Use",
            isAvailable: false,
        },
        { new: true }
    );

    if (!updatedTable) {
        throw { status: 404, message: "Table không tồn tại." };
    }

    return updatedTable;
};