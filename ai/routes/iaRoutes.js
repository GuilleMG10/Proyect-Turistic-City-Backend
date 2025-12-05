import express from "express";
import { generateResponse, registerPlaces, evaluateProfilePhoto, generateItinerary } from "../controllers/iaController.js";
import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage(); //memoryStorage() (que configuraste arriba) guarda la imagen solo en memoria RAM, no en disco.
//Una vez procesada, estará disponible en req.file.buffer.
const upload = multer({ storage });
//Middleware que procesa archivos enviados por el cliente, antes de que pase al controlador, lo que hace antes del controlador se describe abajo

router.post("/prompt", generateResponse);
router.post("/places", registerPlaces);
router.post("/vision/profile", upload.single("image"), evaluateProfilePhoto);

//upload.single("image") Lo convierte a req.file.buffer.

router.post("/itinerary", generateItinerary);

export default router;