import express from "express";
import routes from "./routes";
import cors from "cors";
import { config } from "./config";
import prisma from "db/client";

prisma.$connect();

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(config.port, () => {
  console.log("App is running on port 3000");
});
