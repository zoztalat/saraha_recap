import { ForbiddenException } from "../common/utils/index.js";

export const authorization = (accessRoles = []) => {
  return async (req, res, next) => {
    if (!accessRoles.includes(req.user.role)) {
      throw ForbiddenException({
        message: "Not Auhtorized Account",
      });
    }
  };
};
