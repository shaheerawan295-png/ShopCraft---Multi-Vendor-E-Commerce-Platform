import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Product title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Product description is required"],
  },
price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
    validate: {
      validator: (v) => Number.isFinite(v),
      message: "Price must be a valid number",
    },
  },
  category: {
    type: String,
    required: [true, "Category is required"],
  },
  stock: {
    type: Number,
    required: [true, "Stock count is required"],
    default: 1,
    min: [0, "Stock cannot be negative"],
    validate: {
      validator: (v) => Number.isInteger(v),
      message: "Stock must be a whole number",
    },
  },
  images : [
    {
        type : String,
    },
  ],
  vendor : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "User",
    required : true,
  },
  isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
export default mongoose.model("Product",productSchema);