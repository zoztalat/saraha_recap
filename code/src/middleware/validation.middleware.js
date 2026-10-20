import { BadRequestException } from "../common/utils/index.js";

export const validation = (schema) => {
  return async (req, res, next) => {
    const errors = [];
    for (const key of Object.keys(schema)) {
      const validationResult = schema[key].validate(req[key], {
        abortEarly: false,
      });
      if (validationResult.error) {
        errors.push({
          [key]: validationResult.error.details.map((err) => err.message),
        });
      }
    }
    if (errors.length > 0) {
      throw BadRequestException({
        message: "Validation Error",
        extra: errors,
      });
    }
    next();
  };
};
