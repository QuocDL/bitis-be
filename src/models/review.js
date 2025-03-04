import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Variant",
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  content: {
    type: String,
  },
});

reviewSchema.index({ productId: 1 });

export default mongoose.model("Review", reviewSchema);
