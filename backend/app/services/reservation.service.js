require("dotenv").config();
const db = require("../models");
const Reservation = db.reservation;
const Table = db.table;
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const verifyEmailConfig = async () => {
    try {
        await transporter.verify();
        return true;
    } catch (error) {
        console.error("Email config error:", error);
        return false;
    }
};

const sendConfirmationEmail = async (email, code, name) => {
    const isValid = await verifyEmailConfig();
    if (!isValid) throw new Error("Configuration email không hợp lệ");

    const mailOptions = {
        from: `"Nhà hàng" HeathyFood`,
        to: email,
        subject: "Confirm book table",
        html: `
      <h2>Xin chào ${name},</h2>
      <p>Mã xác nhận của bạn là: <strong>${code}</strong></p>
    `,
    };

    await transporter.sendMail(mailOptions);
};

exports.createReservation = async (auth, data) => {
    const { tableId, specialRequests, use_date, use_time } = data;

    if (!tableId || !use_date || !use_time) {
        throw { status: 400, message: "Thiếu thông tin book table" };
    }

    const table = await Table.findById(tableId);
    if (!table) throw { status: 404, message: "Table không tồn tại" };

    if (!table.isAvailable) {
        throw { status: 400, message: "Table hiện không khả dụng" };
    }

    const existing = await Reservation.findOne({
        tableId,
        use_date,
        use_time,
    });

    if (existing) {
        throw { status: 400, message: "Table has been VNDặt vào thời gian này" };
    }

    const code = Reservation.generateConfirmationCode();

    const reservation = new Reservation({
        customerId: auth.id,
        customerName: `${auth.first_name} ${auth.last_name}`,
        phoneNumber: auth.phone,
        email: auth.email,
        tableId,
        specialRequests,
        use_date,
        use_time,
        reservationTime: new Date(`${use_date}T${use_time}`),
        confirmationCode: code,
        status: "Reserved",
    });

    const saved = await reservation.save();

    table.isAvailable = false;
    table.status = "Reserved";
    await table.save();

    try {
        await sendConfirmationEmail(
            auth.email,
            code,
            `${auth.first_name} ${auth.last_name}`
        );
    } catch (e) {
        console.log("⚠ Không gửi VNDược email:", e.message);
    }

    return saved;
};

exports.completeReservation = async (tableId) => {
    const table = await Table.findById(tableId);
    table.isAvailable = true;
    table.status = "Empty";
    await table.save();

    await Reservation.findOneAndDelete({ tableId });

    return true;
};

exports.getReservationByTableId = async (tableId) => {
    return await Reservation.findOne({ tableId });
};

exports.checkinReservation = async (tableId, confirmationCode) => {
    const table = await Table.findById(tableId);
    if (!table) throw { status: 404, message: "Không tìm thấy bàn" };

    const reservation = await Reservation.findOne({
        tableId,
        confirmationCode,
        status: "Reserved",
    });

    if (!reservation) {
        throw {
            status: 404,
            message: "Mã xác nhận không VNDúng",
        };
    }

    reservation.status = "In Use";
    await reservation.save();

    await Table.findByIdAndUpdate(tableId, {
        status: "In Use",
        isAvailable: false,
    });

    return reservation;
};

exports.checkTableAvailability = async (tableNumber) => {
    const table = await Table.findOne({ tableNumber });
    if (!table) throw { status: 404, message: "Không tìm thấy bàn" };

    const pending = await Reservation.findOne({
        tableId: table._id,
        status: "Reserved",
    });

    if (pending) {
        throw { status: 400, message: "Table has been VNDặt trước", table };
    }

    if (!table.isAvailable) {
        throw { status: 400, message: "Table VNDang VNDược sử dụng", table };
    }

    return table;
};

exports.cancelReservation = async (reservationId) => {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) throw { status: 404, message: "Không tìm thấy book table" };

    if (reservation.status === "In Use") {
        throw { status: 400, message: "Không thể hủy bàn in use" };
    }

    reservation.status = "Cancelled";
    await reservation.save();

    await Table.findByIdAndUpdate(reservation.tableId, {
        isAvailable: true,
        status: "Empty",
    });

    return true;
};

exports.getReservationsByCustomer = async (customerId) => {
    return await Reservation.find({ customerId }).populate("tableId");
};