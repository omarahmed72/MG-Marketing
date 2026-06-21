import { Router, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { generateToken } from "../middleware/auth.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ADMIN_EMAILS = ["mostafakassab572@gmail.com"];

router.post("/google", async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ error: "Google credential required" });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      res.status(401).json({ error: "Invalid Google token" });
      return;
    }

    const isAdmin = ADMIN_EMAILS.includes(payload.email) || payload.email?.includes("admin");

    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        name: payload.name || "عضو مساحة جديد",
        email: payload.email,
        photoURL: payload.picture,
        role: isAdmin ? "admin" : "member",
        status: isAdmin ? "active" : "pending",
        specialty: isAdmin ? "إدارة التسويق" : "غير محدد",
      });
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
        status: user.status,
        specialty: user.specialty,
        workload: user.workload,
        overallRating: user.overallRating,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
});

router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      role: user.role,
      status: user.status,
      specialty: user.specialty,
      workload: user.workload,
      overallRating: user.overallRating,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/demo", async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    let user: typeof User.prototype | null = null;

    if (role === "member") {
      user = await User.findOne({ role: "member", status: "active" });
    }
    if (!user) {
      user = await User.findOne({ role: "admin" });
    }
    if (!user) {
      user = await User.findOne();
    }
    if (!user) {
      res.status(404).json({ error: "No users found. Please seed the database first." });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
        status: user.status,
        specialty: user.specialty,
        workload: user.workload,
        overallRating: user.overallRating,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Demo auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

export default router;
