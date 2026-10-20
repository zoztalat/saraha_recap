import { generalValidationFields } from "../../common/utils/validation.js";
import joi from "joi";
export const sendMessage = {
  body: joi.object({
    content: generalValidationFields.content.required(),
  }),
};
