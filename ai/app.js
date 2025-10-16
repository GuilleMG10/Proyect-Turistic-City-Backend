import express from "express";
import cors from "cors";
import iaRoutes from "./routes/iaRoutes.js";

const app = express();
const PORT = 3000;

// CORS configuration
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  credentials: true
}));

app.use(express.json());

app.use("/ia", iaRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
