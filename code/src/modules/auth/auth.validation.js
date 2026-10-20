import joi from "joi";
import { generalValidationFields } from "../../common/utils/validation.js";
export const login = {
  body: joi
    .object()
    .keys({
      email: generalValidationFields.email.required(),
      password: generalValidationFields.password.required(),
    })
    .required(),
};
export const signup = {
  body: login.body
    .append({
      username: generalValidationFields.username.required(),
      phone: generalValidationFields.phone.required(),
      confirmPassword: generalValidationFields.confirmPassword().required(),
    })
    .required(),
};

export const reSendConfirmEmail = {
  body: joi
    .object()
    .keys({
      email: generalValidationFields.email.required(),
    })
    .required(),
};

export const confirmEmail = {
  body: reSendConfirmEmail.body
    .append()
    .keys({
      otp: generalValidationFields.otp.required(),
    })
    .required(),
};

export const resendForgetPasswordOtp = {
  body: joi
    .object()
    .keys({
      email: generalValidationFields.email.required(),
    })
    .required(),
};

export const verifyresendForgetPasswordOtp = {
  body: joi
    .object()
    .keys({
      email: generalValidationFields.email.required(),
      otp: generalValidationFields.otp.required(),
    })
    .required(),
};
export const resetPassword = {
  body: joi
    .object()
    .keys({
      email: generalValidationFields.email.required(),
      otp: generalValidationFields.otp.required(),
      password: generalValidationFields.password.required(),
    })
    .required(),
};
