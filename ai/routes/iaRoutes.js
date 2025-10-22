import express from "express";
import { generateResponse, generateItinerary } from "../controllers/iaController.js";


const router = express.Router();

router.post("/prompt", generateResponse);
router.post("/plan", generateItinerary);



export default router;
