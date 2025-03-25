import type {
  Request as ExpressRequest,
  Response,
  NextFunction,
} from "express";
import jwt from "jsonwebtoken";


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


export const authMiddleware = (
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

    console.log("Token:", token);

  
    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }


    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    console.log("Decoded token:", decoded);


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
    
    next();
  }
};
