module.exports = app => {
    const customer = require("../controllers/customer.controller.js");
  
    var router = require("express").Router();

    // update
    router.post("/", customer.updateCustomer);
    router.post("/init-guest", customer.initGuest);

    app.use("/api/customer", router);
  };
  