import "dotenv/config";
import express from "express";
import cors from "cors";
import reportsRouter from "./routes/reports";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/reports", reportsRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
