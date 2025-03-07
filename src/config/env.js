import dotenv from "dotenv";
dotenv.config();

export const envConfig = {
    JWT_SECRET:process.env.JWT_SECRET,
    NODE_ENV:process.env.NODE_ENV
}