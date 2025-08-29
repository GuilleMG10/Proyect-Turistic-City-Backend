import express from "express";
import iaRoutes from "./routes/iaRoutes.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/ia", iaRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
