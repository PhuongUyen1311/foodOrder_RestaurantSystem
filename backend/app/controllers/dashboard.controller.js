const dashboardHelper = require("../helpers/dashboard.helper");
const db = require("../models");

exports.getStats = async (req, res) => {
  try {
    const stats = await dashboardHelper.getStats();
    res.send(stats);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Error retrieving dashboard statistics"
    });
  }
};

exports.topProducts = async (req, res) => {
  try {
    const OrderItem = db.order_item;
    const data = await OrderItem.aggregate([
      {
        $match: { is_active: true }
      },
      {
        $group: {
          _id: "$product_id",
          name: { $first: "$product_name" },
          image: { $first: "$product_image" },
          totalSold: { $sum: "$qty" }
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          product_id: "$_id",
          name: 1,
          image: 1,
          totalSold: 1
        }
      }
    ]);

    res.status(200).json(data);

  } catch (err) {
    console.error("Top products error:", err);
    res.status(500).json({
      message: "Error retrieving top products",
      error: err.message
    });
  }
};

exports.topCustomers = async (req, res) => {
  try {
    const Order = db.order;

    const data = await Order.aggregate([
      { $match: { is_active: true } },

      {
        $group: {
          _id: "$customer_id",
          first_name: { $first: "$first_name" },
          last_name: { $first: "$last_name" },
          totalSpent: { $sum: "$total_price" }
        }
      },

      { $sort: { totalSpent: -1 } },

      { $limit: 5 },

      {
        $project: {
          _id: 0,
          customer_id: "$_id",
          name: {
            $concat: ["$first_name", " ", "$last_name"]
          },
          totalSpent: 1
        }
      }
    ]);

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};
exports.productsByCategory = async (req, res) => {
  try {
    const Product = db.product;

    const data = await Product.aggregate([
      {
        $match: { is_active: true }
      },

      {
        $group: {
          _id: "$category_id",
          count: { $sum: 1 }
        }
      },

      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },

      { $unwind: "$category" },

      {
        $project: {
          _id: 0,
          category_id: "$_id",
          name: "$category.name",
          count: 1
        }
      }
    ]);

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

exports.categorySales = async (req, res) => {
  try {
    const OrderItem = db.order_item;

    const data = await OrderItem.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },

      {
        $group: {
          _id: "$product.category_id",
          totalSold: { $sum: "$qty" }
        }
      },

      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },

      { $unwind: "$category" },

      {
        $project: {
          name: "$category.name",
          totalSold: 1
        }
      },

      { $sort: { totalSold: -1 } }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).send(err);
  }
};
exports.revenueTrend = async (req, res) => {
  try {
    const Order = db.order;

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const data = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start },
          is_active: true
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          revenue: { $sum: "$total_price" }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.getHourlyHeatmap = async (req, res) => {
  try {
    const Order = db.order;
    const data = await Order.aggregate([
      {
        $match: { status: "COMPLETED", is_active: true }
      },
      {
        $project: {
          hour: { $hour: { date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } },
          dayOfWeek: { $dayOfWeek: { date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } }
        }
      },
      {
        $group: {
          _id: { dayOfWeek: "$dayOfWeek", hour: "$hour" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          dayOfWeek: "$_id.dayOfWeek",
          hour: "$_id.hour",
          count: 1
        }
      }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.getReturningRate = async (req, res) => {
  try {
    const Order = db.order;
    const data = await Order.aggregate([
      {
        $match: { status: "COMPLETED", is_active: true }
      },
      {
        $group: {
          _id: "$customer_id",
          orderCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: { $cond: [{ $gt: ["$orderCount", 1] }, "Returning", "New"] },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.getInsights = async (req, res) => {
  try {
    const OrderItem = db.order_item;
    const Order = db.order;

    const insights = [];
    const recommendations = [];

    const topCategory = await OrderItem.aggregate([
      { $lookup: { from: "products", localField: "product_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $group: { _id: "$product.category_id", totalSold: { $sum: "$qty" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      { $sort: { totalSold: -1 } },
      { $limit: 1 }
    ]);

    if (topCategory.length > 0) {
      insights.push(`The most popular category is ${topCategory[0].category.name} with ${topCategory[0].totalSold} items sold.`);
      recommendations.push(`Consider creating combo meals featuring ${topCategory[0].category.name} items to boost overall average order value.`);
    }

    const busyHour = await Order.aggregate([
      { $match: { status: "COMPLETED", is_active: true } },
      { $project: { hour: { $hour: { date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } } } },
      { $group: { _id: "$hour", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    if (busyHour.length > 0) {
      insights.push(`Your peak hours are around ${busyHour[0]._id}:00 with the most orders placed.`);
      recommendations.push(`Ensure maximum staff availability and ingredient prep during the ${busyHour[0]._id}:00 peak window.`);
    }

    const customers = await Order.aggregate([
      { $match: { status: "COMPLETED", is_active: true } },
      { $group: { _id: "$customer_id", orderCount: { $sum: 1 } } },
      { $group: { _id: { $cond: [{ $gt: ["$orderCount", 1] }, "Returning", "New"] }, count: { $sum: 1 } } }
    ]);

    const newCust = customers.find(c => c._id === "New")?.count || 0;
    const retCust = customers.find(c => c._id === "Returning")?.count || 0;
    const totalCust = newCust + retCust;
    
    if (totalCust > 0) {
      const retRate = Math.round((retCust / totalCust) * 100);
      insights.push(`Your customer retention rate is ${retRate}%.`);
      if (retRate < 30) {
        recommendations.push("Implement a loyalty program to encourage more repeat visits from new customers.");
      } else {
        recommendations.push("Your retention rate is healthy. Keep engaging returning customers with special promotions.");
      }
    }

    // 4. Average Order Value (AOV) Insight
    const aovData = await Order.aggregate([
      { $match: { status: "COMPLETED", is_active: true } },
      { $group: { _id: null, totalRevenue: { $sum: "$total_price" }, count: { $sum: 1 } } }
    ]);
    
    if (aovData.length > 0 && aovData[0].count > 0) {
      const aov = Math.round(aovData[0].totalRevenue / aovData[0].count);
      insights.push(`Your Average Order Value (AOV) is ${aov.toLocaleString()} VND.`);
      if (aov < 150000) {
        recommendations.push("Consider upselling sides and drinks to increase your average order value.");
      }
    }

    res.json({ insights, recommendations });
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};