import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_SECRET_KEY,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_SECRET_KEY,
  SYSTEM_ACCESS_TOKEN_SECRET_KEY,
  SYSTEM_REFRESH_TOKEN_SECRET_KEY,
} from "../../../../config/config.service.js";
import { RoleEnum } from "../../enums/user.enums.js";
import { TokenTypeEnum } from "../../enums/security.enums.js";
import { findOne } from "../../../DB/db.repository.js";
import { randomUUID } from "node:crypto";
import { userModel } from "../../../DB/model/user.model.js";
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "../response/error.response.js";
export const generateToken = async ({
  payload = {},
  secret = ACCESS_TOKEN_SECRET_KEY,
  options = {},
} = {}) => jwt.sign(payload, secret, options);

export const verifyToken = async ({
  token,
  secret = ACCESS_TOKEN_SECRET_KEY,
} = {}) => jwt.verify(token, secret);

export const detectSignatureLevel = async (level) => {
  switch (level) {
    case RoleEnum.ADMIN:
      return {
        accessSignature: SYSTEM_ACCESS_TOKEN_SECRET_KEY,
        refreshSignature: SYSTEM_REFRESH_TOKEN_SECRET_KEY,
      };
    default:
      return {
        accessSignature: ACCESS_TOKEN_SECRET_KEY,
        refreshSignature: REFRESH_TOKEN_SECRET_KEY,
      };
  }
};

export const getTokenSignature = async ({
  tokenType = TokenTypeEnum.Access,
  level,
} = {}) => {
  const { accessSignature, refreshSignature } =
    await detectSignatureLevel(level);
  return tokenType === TokenTypeEnum.Refresh
    ? refreshSignature
    : accessSignature;
};

export const decodeToken = async ({
  token,
  tokenType = TokenTypeEnum.Access,
} = {}) => {
  const decoded = jwt.decode(token);
  if (!decoded?.aud?.length) {
    throw BadRequestException({ message: "Missing token audience" });
  }

  const [tokenApproach, level] = decoded.aud;
  if (tokenType !== tokenApproach) {
    throw ConflictException({
      message: `Unexpected token mechanism, expected ${tokenType} but got ${tokenApproach}`,
    });
  }

  const secret = await getTokenSignature({ tokenType: tokenApproach, level });
  let verifiedData;
  try {
    verifiedData = jwt.verify(token, secret);
  } catch (error) {
    throw UnauthorizedException({ message: error.message });
  }
  const user = await findOne({
    model: userModel,
    filter: { _id: verifiedData.sub },
    select: "-oldPassword -password",
  });
  if (!user) {
    throw NotFoundException({ message: "Not register account" });
  }
  return { user, decoded: verifiedData };
};

export const createLoginCredentials = async (user, issuer) => {
  const { accessSignature, refreshSignature } = await detectSignatureLevel(
    user.role,
  );

  const access_token = await generateToken({
    payload: { sub: user._id },
    secret: accessSignature,
    options: {
      issuer,
      audience: [TokenTypeEnum.Access, user.role],
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    },
  });

  const refresh_token = await generateToken({
    payload: { sub: user._id },
    secret: refreshSignature,
    options: {
      issuer,
      audience: [TokenTypeEnum.Refresh, user.role],
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    },
  });

  return { access_token, refresh_token };
};
