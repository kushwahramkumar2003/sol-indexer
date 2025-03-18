import express from "express";
import routes from "./routes";

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(3000, () => {
  console.log("App is running on port 3000");
});
