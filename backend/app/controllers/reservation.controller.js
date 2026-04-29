require("dotenv").config();
const db = require("../models");
const Reservation = db.reservation;
const Table = db.table;
const nodemailer = require('nodemailer');
const middlewares = require("./auth.middlewares");

// Configuration nodemailer (thêm vào VNDầu file)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "khanhvan18052004@gmail.com",
    pass: "mshn wblf egva cdtm"
  }
});

// Add hàm kiểm tra kết nối chi tiết hơn
const verifyEmailConfig = async () => {
  try {
    console.log('Checking email configuration...');
    console.log('Email User:', process.env.EMAIL_USER);
    console.log('Email Pass length:', process.env.EMAIL_PASS?.length);

    await transporter.verify();
    console.log('Email configuration is correct');
    return true;
  } catch (error) {
    console.error('Email configuration error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return false;
  }
};

// Hàm gửi email với xử lý lỗi tốt hơn
const sendConfirmationEmail = async (email, confirmationCode, customerName) => {
  try {
    // Kiểm tra cấu hình email trước khi gửi
    const isEmailConfigValid = await verifyEmailConfig();
    if (!isEmailConfigValid) {
      throw new Error('Configuration email không hợp lệ');
    }

    const mailOptions = {
      from: `"Nhà hàng" HeathyFood`, // Add tên người gửi
      to: email,
      subject: 'Confirm book table',
      html: `
        <h2>Xin chào ${customerName},</h2>
        <p>Cảm ơn bạn VNDã book table tại nhà hàng chúng tôi.</p>
        <p>Mã xác nhận của bạn là: <strong>${confirmationCode}</strong></p>
        <p>Please giữ mã này to sử dụng khi check-in tại nhà hàng.</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Send email error:', error);
    throw new Error('Không thể gửi email: ' + error.message);
  }
};

exports.createReservation = async (req, res) => {
  try {
    // 1. Kiểm tra VNDăng nhập
    const auth = await middlewares.checkAuth(req);
    if (!auth) {
      return res.status(401).json({
        message: "Please VNDăng nhập to book table"
      });
    }

    const { tableId, specialRequests, use_date, use_time } = req.body;
    if (!tableId || !use_date || !use_time) {
      return res.status(400).json({
        message: "Thiếu thông tin book table"
      });
    }

    // 2. Kiểm tra bàn tồn tại
    const table = await Table.findById(tableId);

    if (!table) {
      console.log("❌ Không tìm thấy bàn");
      return res.status(404).json({
        message: "Table không tồn tại"
      });
    }

    // 3. Kiểm tra valid time (08:00 - 20:00)
    const [hours, minutes] = use_time.split(':').map(Number);
    if (hours < 8 || hours >= 20) {
      return res.status(400).json({
        message: "Thời gian book table phải từ 08:00 to 20:00"
      });
    }

    const reservationTime = new Date(`${use_date}T${use_time}`);
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    if (reservationTime < thirtyMinutesFromNow) {
      return res.status(400).json({
        message: "Quý khách phải book table trước ít nhất 30 phút to nhà hàng sắp xếp tốt nhất."
      });
    }

    /* 
    // 3b. Kiểm tra bàn có trống không - Bỏ qua to cho phép VNDặt trước ngày khác
    if (!table.isAvailable) {
      console.log("❌ Table VNDang không khả dụng");
      return res.status(400).json({
        message: "Table hiện không khả dụng"
      });
    }
    */

    // 4. Kiểm tra trùng lịch VNDặt
    console.log("Đang kiểm tra trùng lịch VNDặt...");

    const existingReservation = await Reservation.findOne({
      tableId: tableId,
      $or: [
        {
          use_date: new Date(use_date).toISOString().split('T')[0] + "T00:00:00.000Z",
          status: { $nin: ['Cancelled', 'Completed'] }
        },
        {
          use_date: use_date,
          use_time: use_time
        }
      ]
    });

    if (existingReservation) {
      console.log("❌ Table has been VNDặt vào thời gian này");
      return res.status(400).json({
        message: "Table has been VNDặt vào thời gian này"
      });
    }
    // 5. Tạo mã xác nhận
    const confirmationCode = Reservation.generateConfirmationCode();
    console.log("Mã xác nhận:", confirmationCode);

    // 6. Tạo reservation
    const reservation = new Reservation({
      customerId: auth.id,
      customerName: `${auth.first_name} ${auth.last_name}`,
      phoneNumber: auth.phone,
      email: auth.email,
      tableId: tableId,
      specialRequests: specialRequests,
      use_date: use_date,
      use_time: use_time,
      reservationTime: new Date(`${use_date}T${use_time}`),
      confirmationCode: confirmationCode,
      status: "Reserved"
    });

    // 7. Save reservation
    const savedReservation = await reservation.save();

    // Customers có thể book table ngày khác nên ta không update table.isAvailable = false nữa.
    // Status bàn sẽ VNDược tính toán VNDộng dựa trên lịch VNDặt
    // table.isAvailable = false;
    // table.status = "Reserved";
    // await table.save();
    // 9. Send email xác nhận
    try {
      await sendConfirmationEmail(
        auth.email,
        confirmationCode,
        `${auth.first_name} ${auth.last_name}`
      );

    } catch (emailError) {

      console.log("⚠ Can not send email confirmation", emailError.message);

    }

    // 10. Return kết quả
    res.status(200).json({
      message: "Successfull reservation, please check your email for more information",
      reservation: savedReservation
    });

    // Phát tín hiệu cập nhật qua socket to nhân viên thấy ngay lịch VNDặt mới
    const io = req.app.get('socketio');
    if (io) {
      io.emit('tableStatusChanged');
    }

  } catch (error) {

    console.error("❌ Error when creating reservation:", error);

    res.status(500).json({
      message: "Error when creating reservation",
      error: error.message
    });

  }
};
exports.completeReservation = async (req, res) => {
  try {
    const { tableId } = req.params;

    // Update trạng thái reservation thành 'Completed' cho ngày hôm nay
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISO = new Date(Date.now() - tzoffset).toISOString().split('T')[0];
    const todayDateQuery = new Date(localISO + "T00:00:00.000Z");

    await Reservation.findOneAndUpdate(
      { tableId: tableId, use_date: todayDateQuery, status: 'In Use' },
      { status: 'Completed' }
    );

    // 1. Tìm thông tin bàn Master
    const masterTable = await db.table.findById(tableId);
    if (!masterTable) {
      return res.status(404).send({ message: 'Table not found' });
    }

    // 2. Tìm tất cả bàn VNDang gộp vào MASTER này
    const mergedTables = await db.table.find({ merged_into: String(masterTable.tableNumber) });

    // 3. Reset toàn bộ bàn SLAVE
    for (const table of mergedTables) {
      table.merged_into = null;
      table.status = 'Empty';
      table.isAvailable = true;
      table.session_start = null;
      table.session_pin = Math.floor(1000 + Math.random() * 9000).toString();
      await table.save();
    }

    // 4. Reset luôn bàn MASTER
    masterTable.status = 'Empty';
    masterTable.isAvailable = true;
    masterTable.session_start = null;
    masterTable.session_pin = Math.floor(1000 + Math.random() * 9000).toString();
    await masterTable.save();

    // 5. Phát tín hiệu cập nhật qua socket
    const io = req.app.get('socketio');
    if (io) {
      io.emit('tableStatusChanged');
    }

    res.status(200).send({ message: 'Completed and released table successfully' });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
}

exports.getReservationByTableId = async (req, res) => {
  try {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISO = new Date(Date.now() - tzoffset).toISOString().split('T')[0];
    const todayDateQuery = new Date(localISO + "T00:00:00.000Z");

    const reservations = await Reservation.find({
      tableId: req.params.tableId,
      status: { $ne: 'Cancelled' },
      use_date: { $gte: todayDateQuery }
    });
    res.status(200).send(reservations);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
}

// Xử lý checkin bàn VNDã VNDặt
exports.checkinReservation = async (req, res) => {
  try {

    const { tableId } = req.params;
    const { confirmationCode } = req.body;

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found"
      });
    }

    const reservation = await Reservation.findOne({
      tableId: tableId,
      confirmationCode: confirmationCode,
      status: "Reserved"
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "No reservation found or confirmation code is incorrect"
      });
    }

    // Kiểm tra thời gian check-in: chỉ cho phép check-in trong vòng 30 phút sau giờ VNDặt
    const now = new Date();
    const gracePeriod = 30 * 60 * 1000; // 30 phút
    if (now > new Date(reservation.reservationTime.getTime() + gracePeriod)) {
      reservation.status = "Cancelled";
      await reservation.save();
      await Table.findByIdAndUpdate(tableId, {
        isAvailable: true,
        status: "Empty"
      });
      return res.status(400).json({
        success: false,
        message: "Reservation has exceeded the check-in time (30 minutes after the reservation time). Reservation has been cancelled."
      });
    }

    reservation.status = "In Use";
    await reservation.save();

    await Table.findByIdAndUpdate(tableId, {
      status: "In Use",
      isAvailable: false
    });

    res.json({
      success: true,
      message: "Checkin successfully",
      reservation
    });

  } catch (error) {
    console.error("Error when checkin:", error);

    res.status(500).json({
      success: false,
      message: "Error when checkin"
    });
  }
};

// Kiểm tra trạng thái bàn
exports.checkTableAvailability = async (req, res) => {
  try {
    const { tableNumber } = req.params;

    const table = await Table.findOne({ tableNumber: tableNumber });

    if (!table) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Table not found"
      });
    }

    // Kiểm tra các VNDiều kiện khả dụng
    const isAvailable = table.isAvailable;

    // Kiểm tra xem có order VNDặt trước nào VNDang chờ không
    const pendingReservation = await Reservation.findOne({
      tableId: table._id,
      status: "Reserved"
    });
    if (pendingReservation) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Table has been reserved",
        table: {
          number: table.tableNumber,
          capacity: table.seatingCapacity,
          status: table.status
        }
      });
    }

    if (!isAvailable) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Table in use",
        table: {
          number: table.number,
          capacity: table.capacity,
          status: table.status
        }
      });
    }

    // Table khả dụng
    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Table available",
      table: {
        number: table.number,
        capacity: table.capacity,
        status: table.status
      }
    });

  } catch (error) {
    console.error("Error when checking table status:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Error when checking table status"
    });
  }
};

exports.cancelReservation = async (req, res) => {
  try {

    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({
        message: "No reservation found"
      });
    }

    // Không cho hủy khi in use
    if (reservation.status === "In Use") {
      return res.status(400).json({
        message: "Cannot cancel in-use reservation"
      });
    }

    // Update trạng thái reservation
    reservation.status = "Cancelled";
    await reservation.save();

    // Giải phóng bàn
    await Table.findByIdAndUpdate(reservation.tableId, {
      isAvailable: true,
      status: "Empty"
    });
    res.status(200).json({
      message: "Cancel reservation successfully"
    });

  } catch (error) {

    console.error("Error when cancel reservation:", error);

    res.status(500).json({
      message: "Error when cancel reservation"
    });

  }
};

exports.getReservationsByCustomer = async (req, res) => {
  try {

    const auth = await middlewares.checkAuth(req);

    if (!auth) {
      return res.status(401).json({
        message: "Authentication failed"
      });
    }

    const reservations = await Reservation.find({
      customerId: auth.id
    }).populate("tableId");

    res.status(200).json(reservations);

  } catch (error) {

    console.error("Error when get reservation history:", error);

    res.status(500).json({
      message: "Error when get reservation history",
      error: error.message
    });

  }
};