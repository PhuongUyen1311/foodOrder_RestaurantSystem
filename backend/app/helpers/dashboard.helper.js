const db = require("../models");

const Product = db.product;
const Customer = db.customer;
const Order = db.order;

exports.getStats = async () => {

  // tổng món ăn
  const totalProducts = await Product.countDocuments({
    is_active: true
  });

  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  // khách hàng mới trong tháng
  const newCustomersMonth = await Customer.countDocuments({
    createdAt: { $gte: startOfMonth }
  });

  // tổng khách hàng (to hiển thị nếu cần)
  const totalCustomers = await Customer.countDocuments();

  // order hoàn thành (paid)
  const paidOrdersCount = await Order.countDocuments({
    is_payment: true
  });

  // tổng order (không tính hủy)
  const totalOrders = await Order.countDocuments({
    status: { $ne: "CANCELED" }
  });

  // doanh thu tổng của các order paid
  const revenueTotal = await Order.aggregate([
    {
      $match: {
        is_payment: true
      }
    },
    {
      $group: {
        _id: null,
        totalRevenuePaid: { $sum: "$total_price" }
      }
    }
  ]);

  return {
    totalProducts,
    totalCustomers,
    newCustomersMonth,
    paidOrdersCount,
    totalOrders,
    totalRevenuePaid: revenueTotal.length ? revenueTotal[0].totalRevenuePaid : 0
  };
};