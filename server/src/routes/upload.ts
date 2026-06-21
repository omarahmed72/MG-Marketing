import { Router, Request, Response } from "express";
import { upload } from "../config/cloudinary.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.post("/", upload.single("file"), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const file = req.file as unknown as { path: string; originalname: string; mimetype: string };
    res.json({
      url: file.path,
      name: file.originalname,
      type: file.mimetype.startsWith("image/") ? "image" : "file",
    });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
