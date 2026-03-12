module.exports = mongoose => {
  var ingredientSchema = mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      unit: {
        type: String,
        required: true, // gram | ml | ...
      },
      note: {
        type: String,
        default: "",
      },
      is_active: {
        type: Boolean,
        default: true,
      },
    },
    { timestamps: true }
  );

  ingredientSchema.method("toJSON", function() {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Ingredient = mongoose.model("Ingredient", ingredientSchema);
  return Ingredient;
};
