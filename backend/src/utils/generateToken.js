import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || "dev_jwt_secret";
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

export default generateToken;