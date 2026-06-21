import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { verifyToken, AuthPayload } from "../middleware/auth.js";

export function parseObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

export function getPaginationParams(req: Request): { skip: number; limit: number } {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  return { skip: (page - 1) * limit, limit };
}

export function extractTokenFromHeader(req: Request): AuthPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  try {
    return verifyToken(header.split(" ")[1]);
  } catch {
    return null;
  }
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
