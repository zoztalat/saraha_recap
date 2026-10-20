import { emailEnum } from "../../common/enums/email.enums.js";
import {
  baseRevokeTokenKey,
  blockotpKey,
  deleteKey,
  expire,
  get,
  incr,
  keys,
  maxAttemptotpKey,
  otpKey,
  ProviderEnum,
  set,
  ttl,
} from "../../common/index.js";
import { createNumberOtp } from "../../common/utils/otp.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/utils/response/error.response.js";
import { create, findOne, findOneAndUpdate } from "../../DB/db.repository.js";
import { userModel } from "../../DB/model/user.model.js";
import {
  compareHash,
  createLoginCredentials,
  emailEvent,
  generateEncryption,
  generateHash,
  sendEmail,
  templeteEmail,
} from "./../../common/utils/index.js";

const sendEmailOtp = async ({
  email,
  subject = emailEnum.confirmEmail,
  title = "Confirm Email",
}) => {
  const code = await createNumberOtp();
  await set({
    key: otpKey({ email, subject }),
    value: await generateHash({ plaintext: `${code}` }),
    ttl: 120,
  });
  const attempts = await incr(maxAttemptotpKey({ email, subject }));
  if (attempts === 1) {
    await expire({ key: maxAttemptotpKey({ email, subject }), ttl: 3600 });
  }
  emailEvent.emit("sendEmail", async () => {
    await sendEmail({
      to: email,
      subject,
      html: templeteEmail({ code, title }),
    });
  });
};
export const signup = async (inputs) => {
  const { username, email, password, phone, age } = inputs;
  const checkUserExist = await findOne({
    filter: { email },
    model: userModel,
  });
  if (checkUserExist) {
    throw ConflictException({ message: "This Email Exist" });
  }
  const user = await create({
    data: {
      username,
      email,
      password: await generateHash({ plaintext: password }),
      phone: await generateEncryption(phone),
      age,
    },
    model: userModel,
  });
  await sendEmailOtp({ email });
  return user;
};

export const confirmEmail = async (inputs) => {
  const { email, otp } = inputs;
  const user = await findOne({
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: ProviderEnum.SYSTEM,
    },
    model: userModel,
  });
  if (!user) {
    throw NotFoundException({ message: "Not Matching Account" });
  }
  const hashOtp = await get(otpKey({ email }));
  if (!hashOtp) {
    throw BadRequestException({ message: "OTP expired or not found" });
  }
  if (!(await compareHash({ plaintext: `${otp}`, ciphertext: hashOtp }))) {
    throw BadRequestException({ message: "Invalid OTP" });
  }
  user.confirmEmail = new Date();
  await user.save();
  await deleteKey(await keys(otpKey({ email })));
};

export const resendConfirmEmail = async (inputs) => {
  const { email } = inputs;
  const user = await findOne({
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: ProviderEnum.SYSTEM,
    },
    model: userModel,
  });
  if (!user) {
    throw NotFoundException({ message: "Not Matching Account" });
  }
  const isBlocked = await ttl(blockotpKey({ email }));
  if (isBlocked > 0) {
    throw BadRequestException({
      message: `Sorry We Cannot send a new OTP while blocked, try after ${isBlocked} seconds`,
    });
  }

  const remainingOtpTtl = await ttl(otpKey({ email }));
  if (remainingOtpTtl > 0) {
    throw BadRequestException({ message: "Sorry::The Current Otp Is Active" });
  }

  const attempts = Number(await get(maxAttemptotpKey({ email })));
  if (attempts >= 3) {
    await set({ key: blockotpKey({ email }), value: 1, ttl: 420 });
    await deleteKey(maxAttemptotpKey({ email }));
    throw BadRequestException({ message: "Sorry You Reached Max Attempts" });
  }
  await sendEmailOtp({ email });
};

export const resendForgetPasswordOtp = async (inputs) => {
  const { email } = inputs;
  const subject = emailEnum.forget_password;
  const user = await findOne({
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.SYSTEM,
    },
    model: userModel,
  });
  if (!user) {
    throw NotFoundException({
      message: "Not Matching account",
    });
  }
  const isBlocked = await ttl(blockotpKey({ email, subject }));
  if (isBlocked > 0) {
    throw BadRequestException({ message: `...try after ${isBlocked} seconds` });
  }
  const remainingOtpTtl = await ttl(otpKey({ email, subject }));
  if (remainingOtpTtl > 0) {
    throw BadRequestException({ message: "Sorry::The Current Otp Is Active" });
  }
  const attempts = Number(await get(maxAttemptotpKey({ email, subject })));
  if (attempts >= 3) {
    await set({ key: blockotpKey({ email, subject }), value: 1, ttl: 420 });
    await deleteKey(maxAttemptotpKey({ email, subject }));
    throw BadRequestException({ message: "Sorry You Reached Max Attempts" });
  }
  await sendEmailOtp({
    email,
    subject: emailEnum.forget_password,
    title: "Forget Password",
  });
};
export const verifyresendForgetPasswordOtp = async (inputs) => {
  const { email, otp } = inputs;
  const hashOTP = await get(
    otpKey({ email, subject: emailEnum.forget_password }),
  );
  if (!hashOTP) {
    throw BadRequestException({ message: "OTP expired or not found" });
  }
  if (!(await compareHash({ plaintext: `${otp}`, ciphertext: hashOTP }))) {
    throw BadRequestException({ message: "Invalid OTP" });
  }
  return;
};
export const resetForgetPassword = async (inputs) => {
  const { email, otp, password } = inputs;
  await verifyresendForgetPasswordOtp({ email, otp });
  const user = await findOneAndUpdate({
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.SYSTEM,
    },
    model: userModel,
    update: {
      password: await generateHash({ plaintext: password }),
      changeCredentialsTime: new Date(),
    },
  });
  if (!user) {
    throw NotFoundException({
      message: "not Matched Account",
    });
  }
  const otpKeys = await keys(
    otpKey({ email, subject: emailEnum.forget_password }),
  );
  const tokenKeys = await keys(baseRevokeTokenKey(user._id));
  await deleteKey([...tokenKeys, ...otpKeys]);
  return;
};

export const login = async (inputs, issuer) => {
  const { email, password } = inputs;
  const user = await findOne({
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.SYSTEM,
    },
    model: userModel,
  });
  if (!user) {
    throw NotFoundException({
      message: "Not Matching Account",
    });
  }
  if (
    !(await compareHash({ plaintext: password, ciphertext: user.password }))
  ) {
    throw BadRequestException({ message: "Invalid Login Credintials" });
  }
  return await createLoginCredentials(user, issuer);
};
