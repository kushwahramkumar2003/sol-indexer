import db from "db/client";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import jwt, { type Secret } from "jsonwebtoken";
import { loginSchema, signUpSchema } from "types";
import { StatusCodes } from "http-status-codes";

const JWT_SECRET = process.env.JWT_SECRET || ("secret" as Secret);
const JWT_EXPIRY = process.env.JWT_EXPIRY || "24h";
const SALT_ROUNDS = 12;

export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = signUpSchema.safeParse(req.body);

    if (!parsedData.success) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: "Invalid input data",
        errors: parsedData.error.errors,
      });
      return;
    }

    const { email, password } = parsedData.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      res
        .status(StatusCodes.CONFLICT)
        .json({ message: "Email already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await db.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    res.status(StatusCodes.CREATED).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Sign up error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred during registration",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = loginSchema.safeParse(req.body);

    if (!parsedData.success) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: "Invalid input data",
        errors: parsedData.error.errors,
      });
      return;
    }

    const { email, password } = parsedData.data;

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

    res.status(StatusCodes.OK).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred during login",
    });
  }
};
