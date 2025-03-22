import type {
  Request as ExpressRequest,
  Response,
  NextFunction,
} from "express";
import jwt from "jsonwebtoken";

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
  [key: string]: any;
}

const JWT_SECRET = process.env.JWT_SECRET || "secret";

/**
 * Middleware to authenticate requests using JWT tokens
 * Expects token in the 'token' header or in Authorization header as Bearer token
 */
export const authMiddleware = (
  req: ExpressRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from headers
    const token =
      (req.headers.token as string) ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);

    console.log("Token:", token);

    // Check if token exists
    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    console.log("Decoded token:", decoded);

    // Set userId in request object
    req.userId = decoded.id;
    console.log("req.userId:", req.userId);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token." });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired." });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Optional authentication middleware that continues even if no token is present
 * Sets userId if token is valid, otherwise continues without it
 */
export const optionalAuthMiddleware = (
  req: ExpressRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      (req.headers.token as string) ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.userId = decoded.userId;
    }

    next();
  } catch (error) {
    // Continue without setting userId if token validation fails
    next();
  }
};
