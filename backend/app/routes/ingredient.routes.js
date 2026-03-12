module.exports = app => {
    const ingredient = require("../controllers/ingredient.controller.js");

    var router = require("express").Router();

    router.get("/", ingredient.getAll);

    router.get("/:id", ingredient.getById);

    router.post("/", ingredient.create);

    router.put("/:id", ingredient.update);

    router.delete("/:id", ingredient.remove);

    app.use("/api/ingredient", router);
  };