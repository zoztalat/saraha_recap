import mongoose from "mongoose";
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../common/enums/user.enums.js";

export const users = [];
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === ProviderEnum.SYSTEM;
      },
    },
    gender: {
      type: Number,
      enum: Object.values(GenderEnum),
      default: GenderEnum.MALE,
    },
    provider: {
      type: Number,
      enum: Object.values(ProviderEnum),
      default: GenderEnum.MALE,
    },
    role: {
      type: String,
      enum: Object.values(RoleEnum),
      default: RoleEnum.USER,
    },
    gallery: [String],
    profilePicture: String,
    profileCoverPicture: [String],
    changeCredintialsTime: Date,
    oldPassword: [String],
    visitCount: { type: Number, default: 0 },
    phone: String,
    age: Number,
    address: String,
    confirmEmail: Date,
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    validateBeforeSave: true,
    autoIndex: true,
    strict: true,
    strictQuery: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    collection: "SARAHA_USERS",
  },
);

userSchema
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value.split(" ");
    this.set("firstName", firstName);
    this.set("lastName", lastName);
  })
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

export const userModel =
  mongoose.models.USER || mongoose.model("USER", userSchema);
