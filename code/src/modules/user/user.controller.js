import { Router } from "express";
import {
  coverImages,
  deleteImage,
  profile,
  profileImage,
  shareProfile,
  shareProfileNotLoginnedUser,
  updatePassword,
} from "./user.service.js";
import { authentication } from "../../middleware/authentication.middleware.js";
import {
  fileFeildValidation,
  localFileUpload,
  successResponce,
} from "../../common/utils/index.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./user.validation.js";
const router = Router();

router.get("/", authentication(), async (req, res, next) => {
  const account = await profile(req.user);
  return successResponce({
    res,
    data: { account },
  });
});
router.patch(
  "/update-password",
  authentication(),
  validation(validators.updatePassword),
  async (req, res, next) => {
    const credintials = await updatePassword(
      req.body,
      req.user,
      `${req.protocol}://${req.host}`,
    );
    return successResponce({
      res,
      message: "password updated successfully",
      data: { ...credintials },
    });
  },
);
router.get(
  "/:id",
  authentication(),
  validation(validators.shareProfile),
  async (req, res, next) => {
    const account = await shareProfile(req.params.id, req.user);
    return successResponce({
      res,
      data: { account },
    });
  },
);
router.get(
  "/:id/profile",
  validation(validators.shareProfile),
  async (req, res, next) => {
    const account = await shareProfileNotLoginnedUser(req.params.id);
    return successResponce({
      res,
      data: { account },
    });
  },
);
router.post(
  "/profileImage",
  authentication(),
  localFileUpload({
    customPath: "user/profilePictures",
    validation: fileFeildValidation.Image,
    maxSize: 10,
  }).single("attachment"),
  validation(validators.profileImage),
  async (req, res, next) => {
    const account = await profileImage(req.user, req.file);
    return successResponce({
      res,
      data: { account },
    });
  },
);

router.patch(
  "/cover-image",
  authentication(),
  localFileUpload({
    customPath: "users/coverImages",
    validation: fileFeildValidation.Image,
    maxSize: 10,
  }).array("attachements", 2),
  validation(validators.profileCoverImage),
  async (req, res, next) => {
    const account = await coverImages(req.files, req.user);
    return successResponce({
      res,
      message: "cover picture",
      data: { account },
    });
  },
);

router.delete("/delImage", authentication(), async (req, res, next) => {
  await deleteImage(req.user);
  return successResponce({
    res,
    message: "profile Image Deleted Successfully",
  });
});

export default router;
