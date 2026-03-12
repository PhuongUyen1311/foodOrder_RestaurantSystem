module.exports = mongoose => {
  var productBomSchema = mongoose.Schema(
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      ingredient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ingredient",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  );

  productBomSchema.method("toJSON", function() {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const ProductBOM = mongoose.model("ProductBOM", productBomSchema);
  return ProductBOM;
}
