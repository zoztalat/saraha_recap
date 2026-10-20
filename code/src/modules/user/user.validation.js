import joi from "joi";
import { generalValidationFields } from "../../common/utils/validation.js";
import { fileFeildValidation } from "../../common/index.js";
export const updatePassword = {
  body: joi.object().keys({
    oldPassword: generalValidationFields.password.required(),
    password: generalValidationFields.password
      .not(joi.ref("oldPassword"))
      .required(),
    confirmPassword: generalValidationFields.confirmPassword().required(),
  }),
};
export const shareProfile = {
  params: joi.object().keys({
    id: generalValidationFields.id.required(),
  }),
};
export const profileImage = {
  file: generalValidationFields.file(fileFeildValidation.Image).required(),
};
export const profileCoverImage = {
  files: joi
    .array()
    .items(generalValidationFields.file(fileFeildValidation.Image).required())
    .min(1)
    .max(5)
    .required(),
};
