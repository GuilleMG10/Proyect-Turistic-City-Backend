import express from "express";
import { generateResponse, registerPlaces } from "../controllers/iaController.js";


const router = express.Router();

router.post("/prompt", generateResponse);
router.post("/places", registerPlaces);




export default router;
