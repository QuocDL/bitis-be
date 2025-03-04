import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import Cart from "./cart.js";
import { ROLE } from "../constants/role.js";
import "dotenv/config";


const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 30,
    },
    phone: {
      type: String,
      default: "Chưa cập nhật",
    },
    role: {
      type: String,
      enum: Object.values(ROLE),
      default: ROLE.USER,
    },
    isActive: {
      type: Boolean,
      default: false
    },
    avatar: {
      type: String,
      default: "https://firebasestorage.googleapis.com/v0/b/morata-a9eba.appspot.com/o/default-avatar-icon-of-social-media-user-vector.jpg?alt=media&token=2b109a33-e31c-4d60-92df-d80f3b4dc123",
    },
    imageUrlRef: { type: String },
    wishList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: [] }],
  },
  { timestamps: true, versionKey: false }
);

userSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("password")) {
    await Cart.create({ userId: this._id });
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  next();
});

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", userSchema);
