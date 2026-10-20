import { Router } from "express";
import {
  confirmEmail,
  login,
  resendConfirmEmail,
  resendForgetPasswordOtp,
  resetForgetPassword,
  signup,
  verifyresendForgetPasswordOtp,
} from "./auth.service.js";
import { successResponce } from "../../common/index.js";
import * as validators from "./auth.validation.js";
import { validation } from "../../middleware/index.js";
const router = Router();
router.post(
  "/signup",
  validation(validators.signup),
  async (req, res, next) => {
    const account = await signup(req.body);
    return successResponce({
      res,
      status: 201,
      message: "Done-Signup",
      data: {
        account,
      },
    });
  },
);
router.post("/login", validation(validators.login), async (req, res, next) => {
  const credintials = await login(req.body, `${req.protocol}://${req.host}`);
  return successResponce({
    res,
    status: 200,
    message: "Done-Login",
    data: {
      ...credintials,
    },
  });
});
router.post(
  "/confirmEmail",
  validation(validators.confirmEmail),
  async (req, res, next) => {
    await confirmEmail(req.body);
    return successResponce({
      res,
      message: "Confirmed Done",
    });
  },
);
router.post(
  "/reconfirmEmail",
  validation(validators.reSendConfirmEmail),
  async (req, res, next) => {
    await resendConfirmEmail(req.body);
    return successResponce({
      res,
      message: "OTP SENDED",
    });
  },
);
router.post(
  "/resendForgetPasswordOtp",
  validation(validators.resendForgetPasswordOtp),
  async (req, res, next) => {
    await resendForgetPasswordOtp(req.body);
    return successResponce({
      res,
      message: "New OTP Sended",
    });
  },
);
router.patch(
  "/resetPassword",
  validation(validators.resetPassword),
  async (req, res, next) => {
    await resetForgetPassword(req.body);
    return successResponce({
      res,
      message: "reset password Successfully",
    });
  },
);
router.post(
  "/verifyresendForgetPasswordOtp",
  validation(validators.verifyresendForgetPasswordOtp),
  async (req, res, next) => {
    await verifyresendForgetPasswordOtp(req.body);
    return successResponce({
      res,
      message: "Verfied Successfully",
    });
  },
);

export default router;
