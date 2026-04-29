module.exports = app => {

  const dashboard = require("../controllers/dashboard.controller");

  const router = require("express").Router();

  router.get("/stats", dashboard.getStats);
  router.get("/top-products", dashboard.topProducts);
  router.get("/top-customers", dashboard.topCustomers);
  router.get("/products-by-category", dashboard.productsByCategory);
  router.get("/category-sales", dashboard.categorySales);
  router.get("/revenue-trend", dashboard.revenueTrend);
  router.get("/hourly-heatmap", dashboard.getHourlyHeatmap);
  router.get("/returning-rate", dashboard.getReturningRate);
  router.get("/insights", dashboard.getInsights);
  app.use("/api/dashboard", router);

};