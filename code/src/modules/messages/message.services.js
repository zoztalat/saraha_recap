import { NotFoundException } from "../../common/index.js";
import {
  create,
  find,
  findOne,
  findOneAndDelete,
} from "../../DB/db.repository.js";
import { messageModel, userModel } from "../../DB/model/index.js";

export const sendMessage = async (reciverID, files = [], inputs, user) => {
  const { content } = inputs;
  const account = await findOne({
    filter: { _id: reciverID },
    model: userModel,
  });
  if (!account) {
    throw NotFoundException({
      message: "Not Matching Account",
    });
  }
  const message = await create({
    model: messageModel,
    data: {
      content,
      attachments: files.map((file) => file.finalPath),
      reciverID,
      senderID: user ? user._id : undefined,
    },
  });
  return message;
};

export const getMessage = async (messageID, user) => {
  const message = await findOne({
    filter: {
      _id: messageID,
      $or: [{ reciverID: user._id }, { senderID: user._id }],
    },
    model: messageModel,
    select: "-senderID",
  });
  if (!message) {
    throw NotFoundException({ message: "There is no Message Like that" });
  }
  return message;
};

export const getAllMessages = async (user) => {
  const messages = await find({
    filter: { $or: [{ reciverID: user._id }, { senderID: user._id }] },
    model: messageModel,
    select: "-senderID",
  });
  return messages;
};

export const deleteMessage = async (messageID, user) => {
  const message = await findOneAndDelete({
    filter: {
      _id: messageID,
      $or: [{ reciverID: user._id }, { senderID: user._id }],
    },
    model: messageModel,
  });
  if (!message) {
    throw NotFoundException({ message: "There is no Message Like that" });
  }
  return;
};
