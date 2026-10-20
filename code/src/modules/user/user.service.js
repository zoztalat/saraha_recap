import {
  BadRequestException,
  baseRevokeTokenKey,
  compareHash,
  ConflictException,
  createLoginCredentials,
  deleteKey,
  generateDecryption,
  generateHash,
  get,
  keys,
  NotFoundException,
  ProviderEnum,
  RoleEnum,
} from "../../common/index.js";
import { resolve } from "node:path";
import { findById, findOne, findOneAndUpdate } from "../../DB/db.repository.js";
import { userModel } from "../../DB/model/user.model.js";
import { unlink } from "node:fs/promises";
export const profile = (user) => {
  return user;
};

export const updatePassword = async (inputs, user, issuer) => {
  const { oldPassword, password } = inputs;

  if (user.provider !== ProviderEnum.SYSTEM) {
    throw BadRequestException({ message: "Invalid Provider" });
  }

  if (
    !(await compareHash({ plaintext: oldPassword, ciphertext: user.password }))
  ) {
    throw BadRequestException({ message: "Invalid old Password" });
  }

  for (const hash of user.oldPassword ?? []) {
    if (await compareHash({ plaintext: password, ciphertext: hash })) {
      throw BadRequestException({
        message: "This Password already used before",
      });
    }
  }

  const account = await findOneAndUpdate({
    model: userModel,
    filter: { _id: user._id },
    update: {
      password: await generateHash({ plaintext: password }),
      changeCredentialsTime: new Date(),
      $push: { oldPassword: user.password },
    },
  });
  if (!account) {
    throw BadRequestException({ message: "Not Matched Account" });
  }
  const tokenKeys = await keys(baseRevokeTokenKey(user._id));
  if (tokenKeys.length) await deleteKey(tokenKeys);
  return createLoginCredentials(account, issuer);
};

export const shareProfileNotLoginnedUser = async (id) => {
  const user = await findById({
    id,
    model: userModel,
    select: "-oldPassword -password",
  });
  if (!user) {
    throw NotFoundException({ message: "Not Matching Account" });
  }
  user.phone = await generateDecryption(user.phone);
  return user;
};
export const shareProfile = async (id, user) => {
  const account = await findOne({
    filter: { _id: id },
    model: userModel,
    select:
      user.role === RoleEnum.ADMIN
        ? "-oldPassword -password"
        : "-oldPassword -password -visitCount",
  });
  if (!account) {
    throw NotFoundException({ message: "Not Matching Account" });
  }
  account.phone = await generateDecryption(account.phone);
  await userModel.updateOne({ _id: id }, { $inc: { visitCount: 1 } });
  return account;
};
export const profileImage = async (user, file) => {
  if (user.profilePicture) {
    user.gallery.push(user.profilePicture);
  }
  user.profilePicture = file.finalPath;
  await user.save();
  return user;
};
export const coverImages = async (files, user) => {
  const totalImages = user.profileCoverPicture.length + files.length;
  if (totalImages !== 2) {
    throw BadRequestException({
      message: "totalImages must be equal only two images",
    });
  }
  user.profileCoverPicture.push(...files.map((file) => file.finalPath));
  await user.save();
  return user;
};
export const deleteImage = async (user) => {
  if (!user.profilePicture) {
    throw BadRequestException({
      message: "There is no picture to delete",
    });
  }
  unlink(resolve("..", user.profilePicture));
  user.profilePicture = undefined;
  await user.save();
};
