import { TokenTypeEnum } from "../common/enums/security.enums.js";
import { BadRequestException, decodeToken } from "../common/utils/index.js";

export const authentication = (tokenType = TokenTypeEnum.Access) => {
  return async (req, res, next) => {
    try {
      const { authorization } = req.headers;
      if (!authorization) {
        throw BadRequestException({ message: "Missing authorization header" });
      }
      const [schema, credentials] = authorization.split(" ");
      if (!credentials) {
        throw BadRequestException({
          message: "Malformed authorization header",
        });
      }
      switch (schema) {
        case "Basic": {
          const [email, password] =
            Buffer.from(credentials, "base64").toString().split(":") || [];
          req.credentials = await login(
            { email, password },
            `${req.protocol}://${req.host}`,
          );
          break;
        }
        case "Bearer": {
          const { user, decoded } = await decodeToken({
            token: credentials,
            tokenType,
          });
          req.user = user;
          req.decoded = decoded;
          break;
        }
        default:
          throw BadRequestException({
            message: "Unsupported authentication schema",
          });
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
};
