import { Router } from "express";
import {
  deleteMessage,
  getAllMessages,
  getMessage,
  sendMessage,
} from "./message.services.js";
import {
  decodeToken,
  fileFeildValidation,
  localFileUpload,
  successResponce,
  TokenTypeEnum,
} from "../../common/index.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./messages.validation.js";
import { authentication } from "../../middleware/authentication.middleware.js";
const router = Router();
router.post(
  "/sendMessage/:reciverID",
  async (req, res, next) => {
    if (req.headers.authorization) {
      const { user, decoded } = await decodeToken({
        token: req.headers.authorization.split(" ")[1],
        tokenType: TokenTypeEnum.Access,
      });
      req.user = user;
      req.decoded = decoded;
    }
    next();
  },
  localFileUpload({
    customPath: "messages/pictures",
    validation: fileFeildValidation.Image,
    maxSize: 10,
  }).array("attachments", 2),
  validation(validators.sendMessage),
  async (req, res, next) => {
    const message = await sendMessage(
      req.params.reciverID,
      req.files,
      req.body,
      req.user,
    );
    return successResponce({
      res,
      status: 201,
      message: "Message sent successfully",
      data: { message },
    });
  },
);
router.get(
  "/getMessage/:messageID",
  authentication(),
  async (req, res, next) => {
    const message = await getMessage(req.params.messageID, req.user);
    return successResponce({
      res,
      status: 200,
      data: { message },
    });
  },
);
router.get("/getAllMessages/", authentication(), async (req, res, next) => {
  const message = await getAllMessages(req.user);
  return successResponce({
    res,
    status: 200,
    data: { message },
  });
});
router.delete(
  "/deleteMessage/:messageID",
  authentication(),
  async (req, res, next) => {
    await deleteMessage(req.params.messageID, req.user);
    return successResponce({
      res,
      message: "Message Deleted Successfull",
    });
  },
);
export default router;
