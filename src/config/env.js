import dotenv from 'dotenv';
dotenv.config();

export const envConfig = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_VERIFY: process.env.JWT_VERIFY,
    NODE_ENV: process.env.NODE_ENV,
    nodeMailer: {
        email: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
    },
};
