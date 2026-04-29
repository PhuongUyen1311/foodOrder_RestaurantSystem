const db = require("../models");
const Table = db.table;
const QRCode = require('qrcode');
const crypto = require('crypto');

// Lấy thông tin bàn theo mã QR
exports.getTableByQRCode = async (req, res) => {
  try {
    const qrCode = req.params.qrCode;
    const table = await Table.findOne({ qrCode });

    if (!table) {
      return res.status(404).json({ message: 'Table không tồn tại.' });
    }

    if (!table.isAvailable) {
      return res.status(400).json({ message: 'Table has been VNDặt hoặc không thể sử dụng' });
    }

    res.json(table);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error server.' });
  }
};

// Add New Table
exports.addTable = async (req, res) => {
  try {
    const { tableNumber, seatingCapacity, location } = req.body;
    if (!tableNumber || !seatingCapacity || !location) {
      return res.status(400).json({ message: 'Please cung cấp full VNDủ thông tin.' });
    }

    if (seatingCapacity < 1) {
      return res.status(400).json({ message: 'Capacity phải lớn hơn 0.' });
    }
    const session_pin = Math.floor(1000 + Math.random() * 9000).toString(); // Tạo PIN 4 số
    const newTable = new Table({ tableNumber, seatingCapacity, location, session_pin });
    console.log(tableNumber, seatingCapacity, location);
    await newTable.save();
    
    // Tạo URL cho menu cố VNDịnh (Static QR)
    const menuUrl = `${process.env.FRONTEND_URL}/menu?table=${tableNumber}`;

    // Tạo mã QR từ URL menu
    const qrCodeDataURL = await QRCode.toDataURL(menuUrl);

    // Update mã QR vào bảng
    newTable.qrCode = qrCodeDataURL;
    await newTable.save();

    res.status(201).json(newTable);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.tableNumber) {
      return res.status(400).json({ message: 'Table No. VNDã tồn tại' });
    }
    console.error(error);
    res.status(400).json({ message: 'Error khi thêm bàn mới.' });
  }
};

// Edit thông tin bàn
exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    console.log(updatedData);
    const updatedTable = await Table.findByIdAndUpdate(id, updatedData, { new: true });
    if (!updatedTable) {
      return res.status(404).json({ message: 'Table không tồn tại.' });
    }
    res.json(updatedTable);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error khi cập nhật thông tin bàn.' });
  }
};

// Delete bàn
exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTable = await Table.findByIdAndDelete(id);
    if (!deletedTable) {
      return res.status(404).json({ message: 'Table không tồn tại.' });
    }
    res.json({ message: 'Delete bàn thành công.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error khi xóa bàn.' });
  }
};

exports.getTablesListInternal = async (sortBy, order) => {
  let sortCriteria = { tableNumber: 1 };
  if (sortBy && order) {
    sortCriteria = { [sortBy]: order === 'asc' ? 1 : -1 };
  }

  const tables = await Table.aggregate([
    {
      $lookup: {
        from: 'reservations',
        localField: '_id',
        foreignField: 'tableId',
        as: 'reservationList'
      }
    },
    { $sort: sortCriteria }
  ]);

  // Tìm các lịch book table của ngày hôm nay
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const localISO = new Date(Date.now() - tzoffset).toISOString().split('T')[0];
  const todayDateQuery = new Date(localISO + "T00:00:00.000Z");

  const now = new Date();
  const expiryLimit = new Date(now.getTime() - 30 * 60 * 1000); // Giữ bàn trong 30 phút

  // Tự VNDộng hủy các order book table quá 2 tiếng
  await db.reservation.updateMany(
    {
      use_date: todayDateQuery,
      status: 'Reserved',
      reservationTime: { $lt: expiryLimit }
    },
    { status: 'Cancelled' }
  );

  const todayReservations = await db.reservation.find({
    use_date: todayDateQuery,
    status: { $nin: ['Cancelled', 'Completed'] }
  });

  const fortyFiveMinutesFromNow = new Date(now.getTime() + 45 * 60 * 1000);

  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const recentOrders = await db.order.find({
    order_source: 'table',
    createdAt: { $gte: twelveHoursAgo }
  }).sort({ createdAt: -1 });

  return tables.map(table => {
    // Trong hàm aggregate, document trả về VNDã là plain JS object
    const t = { ...table };
    t.note = ""; // Khởi tạo ghi chú trống
    t.nextReservationTime = null;

    // Tìm reservation của bàn này trong hôm nay (không bao gồm 'Cancelled', 'Completed')
    const res = todayReservations.find(r => r.tableId.toString() === t._id.toString());

    if (res) {
      t.activeReservationId = res._id;
      t.confirmationCode = res.confirmationCode;
      t.customerName = res.customerName;
      t.reservationNote = res.specialRequests;
      const resTime = new Date(res.reservationTime);
      const diffMs = resTime - now;
      const diffMinutes = Math.floor(diffMs / 60000);

      if (res.status === 'In Use') {
        t.note = `"${t.customerName}" bắt VNDầu sử dụng bàn`;
        t.status = 'In Use';
        t.isAvailable = false;
      } else {
        if (resTime <= fortyFiveMinutesFromNow) {
          t.nextReservationTime = res.reservationTime;
          t.holdExpiryTime = new Date(resTime.getTime() + 30 * 60 * 1000);

          if (t.status === 'In Use') {
            t.note = "Sắp to giờ book table của khách, mau chóng xử lý!";
          } else {
            t.status = 'Reserved';
            t.isAvailable = false;
            t.note = "Table VNDang giữ chỗ";
          }
        } else {
          // Ngoài khoảng 45 phút, nếu không in use thì là Empty
          if (t.status !== 'In Use') {
            t.status = 'Empty';
            t.isAvailable = true;
          }
        }
      }
    } else {
      // Không có reservation, nếu không in use thì là Empty
      if (t.status !== 'In Use') {
        t.status = 'Empty';
        t.isAvailable = true;
      }
    }

    // Apply trạng thái kiểm tra thanh toán ngay cả với bàn không có reservation
    // Apply trạng thái kiểm tra thanh toán ngay cả với bàn không có reservation
    if (t.status === 'In Use' && t.session_start) {
      // Tìm các order thuộc bàn này và VNDược tạo SAU KHI bàn bắt VNDầu sử dụng
      const tableOrders = recentOrders.filter(o => 
        String(o.table_number) === String(t.tableNumber) && 
        new Date(o.createdAt) >= new Date(t.session_start)
      );
      
      t.hasOrders = tableOrders.length > 0;
      
      if (t.hasOrders) {
        // Table VNDược coi là Đã thanh toán nếu TẤT CẢ order trong phiên này VNDã payment
        const allPaid = tableOrders.every(o => o.is_payment === true);
        if (allPaid) {
          t.isPaid = true;
          t.note = "Đã thanh toán, chuẩn bị dọn bàn";
        }
      }
    }

    return t;
  });
};

exports.getAllTables = async (req, res) => {
  try {
    const { sortBy, order } = req.query;
    const result = await exports.getTablesListInternal(sortBy, order);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error khi lấy tất cả bàn.' });
  }
};

exports.getAvailableTables = async (req, res) => {
  try {
    const tables = await exports.getTablesListInternal();
    const availableTables = tables.filter(t =>
      t.isAvailable === true &&
      t.status !== 'In Use' &&
      !t.merged_into
    );
    res.json(availableTables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error khi lấy danh sách bàn trống.' });
  }
};

exports.startUsingTable = async (req, res) => {
  try {
    const { id } = req.params;

    // Update trạng thái reservation nếu có cho ngày hôm nay
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISO = new Date(Date.now() - tzoffset).toISOString().split('T')[0];
    const todayDateQuery = new Date(localISO + "T00:00:00.000Z");
    const now = new Date();
    const fortyFiveMinutesFromNow = new Date(now.getTime() + 45 * 60 * 1000);

    const reservation = await db.reservation.findOne({
      tableId: id,
      use_date: todayDateQuery,
      status: 'Reserved',
      reservationTime: { $lte: fortyFiveMinutesFromNow }
    });

    if (reservation) {
      const now = new Date();
      const expiryTime = new Date(reservation.reservationTime.getTime() + 30 * 60 * 1000);

      if (now > expiryTime) {
        reservation.status = 'Cancelled';
        await reservation.save();
        return res.status(400).json({ message: 'Đã quá thời gian nhận bàn (quá 30 phút).' });
      }

      reservation.status = 'In Use';
      await reservation.save();
    }

    const session_pin = Math.floor(1000 + Math.random() * 9000).toString();

    const updatedTable = await Table.findByIdAndUpdate(
      id,
      {
        status: 'In Use',
        isAvailable: false,
        session_pin: session_pin,
        session_start: new Date()
      },
      { new: true }
    );

    if (!updatedTable) {
      return res.status(404).json({ message: 'Table không tồn tại.' });
    }

    res.json(updatedTable);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error khi cập nhật trạng thái bàn.' });
  }
};

exports.mergeTable = async (req, res) => {
  try {
    const { fromTable, toTable } = req.body;

    if (!fromTable || !toTable) {
      return res.status(400).json({ success: false, message: 'Please cung cấp bàn cần gộp và bàn VNDích.' });
    }

    const from = await Table.findOne({ tableNumber: Number(fromTable) });
    const to = await Table.findOne({ tableNumber: Number(toTable) });

    if (!from || !to) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bàn.' });
    }

    if (from.tableNumber === to.tableNumber) {
      return res.status(400).json({ success: false, message: 'Không thể gộp bàn vào chính nó.' });
    }

    // Ràng buộc 1: Table gộp VNDi (From) không VNDược VNDang là Master của bàn khác
    const isMaster = await Table.findOne({ merged_into: from.tableNumber });
    if (isMaster) {
      return res.status(400).json({ success: false, message: `Table ${from.tableNumber} VNDang là bàn Master của bàn khác. Please rã gộp bàn VNDó trước.` });
    }

    // Ràng buộc 2: Table VNDích (To) không VNDược VNDang là Slave của bàn khác
    if (to.merged_into) {
      return res.status(400).json({ success: false, message: `Table ${to.tableNumber} VNDang là bàn Slave của bàn ${to.merged_into}. Không thể gộp lồng.` });
    }

    // Ràng buộc 3: Table nguồn (From) chưa bị merge vào bàn nào khác
    if (from.merged_into) {
      return res.status(400).json({ success: false, message: 'Table này has been gộp vào bàn khác.' });
    }

    // Thực hiện gộp
    from.merged_into = to.tableNumber;
    from.status = 'In Use';
    from.isAvailable = false;
    from.session_pin = null; // Table slave không cần mã PIN riêng
    await from.save();

    to.status = 'In Use';
    to.isAvailable = false;
    // Nếu bàn Master chưa có PIN (VNDang Empty), tạo PIN mới
    if (!to.session_pin) {
      to.session_pin = Math.floor(1000 + Math.random() * 9000).toString();
      to.session_start = new Date();
    }
    await to.save();

    res.json({ success: true, message: 'Merge Table thành công.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error server khi gộp bàn.' });
  }
};


exports.unmergeAllSlaves = async (req, res) => {
  try {
    const { masterTableNumber } = req.body;
    if (!masterTableNumber) return res.status(400).json({ success: false, message: 'Thiếu mã bàn chủ.' });

    const Table = db.table;
    
    // 1. Tìm và cập nhật tất cả bàn SLAVE của Master này
    const result = await Table.updateMany(
      { merged_into: String(masterTableNumber) },
      { 
        merged_into: null,
        status: 'Empty',
        isAvailable: true
      }
    );

    // 2. Update Table chủ (MASTER) - Table chủ vẫn giữ trạng thái 'In Use' 
    // vì nó mang session chính. Staff sẽ tự click 'Giải phóng' sau.
    // Không cần thay VNDổi gì ở VNDây.

    const listSocket = require('../socket');
    if (listSocket && listSocket.updateOrder) {
      listSocket.updateOrder.emit('tableMerged', { master: masterTableNumber, action: 'unmergeAll' });
    }

    res.status(200).json({ 
      success: true, 
      message: `Đã phân rã thành công ${result.modifiedCount} bàn con.` 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error server khi phân rã bàn.' });
  }
};

exports.unmergeTable = async (req, res) => {
  try {
    const { tableNumber } = req.body;
    if (!tableNumber) return res.status(400).json({ success: false, message: 'Thiếu mã bàn.' });

    const Table = db.table;
    const slaveTable = await Table.findOne({ tableNumber: Number(tableNumber) });

    if (!slaveTable) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn.' });
    if (!slaveTable.merged_into) return res.status(400).json({ success: false, message: 'Table này VNDang không bị gộp.' });

    const masterTableNumber = slaveTable.merged_into;

    // 1. Update Table bị gộp (SLAVE)
    slaveTable.merged_into = null;
    slaveTable.status = 'Empty';
    slaveTable.isAvailable = true;
    await slaveTable.save();

    // 2. Update Table chủ (MASTER)
    // Table Master vẫn giữ nguyên trạng thái hiện tại (In Use/Đã thanh toán) 
    // vì nó là bàn chứa order/session. 
    // Chỉ khi nhân viên nhấn "Giải phóng" thì bàn Master mới về Empty.

    const listSocket = require('../socket');
    if (listSocket && listSocket.updateOrder) {
      listSocket.updateOrder.emit('tableMerged', { unmerged: tableNumber, master: masterTableNumber });
    }

    res.status(200).json({ success: true, message: 'Split Table thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error server khi tách bàn' });
  }
};

exports.refreshTableSession = async (tableNumber) => {
  try {
    const table = await Table.findOne({ tableNumber: Number(tableNumber) });
    if (!table) return;

    const session_pin = Math.floor(1000 + Math.random() * 9000).toString();
    
    table.session_pin = session_pin;
    // QR code giữ nguyên URL tĩnh, không cần tạo lại DataURL trừ khi muốn VNDổi URL
    
    // Khi reset session, thường bàn sẽ trống
    table.status = 'Empty';
    table.isAvailable = true;
    table.session_start = null;
    await table.save();
    
    console.log(`Refreshed session for table ${tableNumber}. New PIN: ${session_pin}`);
  } catch (error) {
    console.error(`Error refreshing table session:`, error);
  }
};

exports.verifyPIN = async (req, res) => {
  try {
    const { tableNumber, pin } = req.body;
    const table = await Table.findOne({ tableNumber: Number(tableNumber) });
    
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table không tồn tại.' });
    }

    if (table.session_pin === pin) {
      return res.status(200).json({ success: true, message: 'PIN hợp lệ.' });
    } else {
      return res.status(403).json({ success: false, message: 'PIN Code không chính xác.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error server khi xác thực PIN.' });
  }
};

exports.moveTable = async (req, res) => {
  try {
    const { fromTable, toTable } = req.body;
    if (!fromTable || !toTable) {
      return res.status(400).json({ success: false, message: 'Please cung cấp bàn nguồn và bàn VNDích.' });
    }

    const from = await Table.findOne({ tableNumber: Number(fromTable) });
    const to = await Table.findOne({ tableNumber: Number(toTable) });

    if (!from || !to) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bàn.' });
    }

    if (to.status !== 'Empty' || !to.isAvailable || to.merged_into) {
      return res.status(400).json({ success: false, message: 'Table VNDích phải là bàn trống và không bị gộp.' });
    }

    // 1. Chuyển toàn bộ order chưa thanh toán sang bàn mới
    await db.order.updateMany(
      { table_number: String(fromTable), is_payment: false },
      { table_number: String(toTable) }
    );

    // 2. Chuyển session data (PIN, start time)
    to.session_pin = from.session_pin;
    to.session_start = from.session_start;
    to.status = 'In Use';
    to.isAvailable = false;
    await to.save();

    // 3. Giải phóng bàn cũ
    from.status = 'Empty';
    from.isAvailable = true;
    from.session_pin = null;
    from.session_start = null;
    from.merged_into = null;
    await from.save();

    res.json({ success: true, message: `Đã chuyển toàn bộ dữ liệu từ bàn ${fromTable} sang bàn ${toTable}.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error server khi chuyển bàn.' });
  }
};