import { randomInt } from "node:crypto";

export const createNumberOtp = () => {
  return randomInt(100000, 1000000);
};
