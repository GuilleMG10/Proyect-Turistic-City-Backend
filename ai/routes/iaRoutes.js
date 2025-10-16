import express from "express";
import { generateResponse } from "../controllers/iaController.js";

const router = express.Router();

router.post("/prompt", generateResponse);

export default router;
