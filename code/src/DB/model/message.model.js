import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: function () {
        return !this.attachments.length;
      },
    },
    attachments: [String],
    reciverID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
      required: true,
    },
    senderID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
    },
  },
  {
    optimisticConcurrency: true,
    strict: true,
    strictQuery: true,
    collection: "ROUTE_MESSAGE",
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

export const messageModel =
  mongoose.models.MESSAGE || mongoose.model("MESSAGE", messageSchema);
