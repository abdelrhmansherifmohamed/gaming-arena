const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);

app.get("/", (req, res) => {
  res.send("Gaming Arena API");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
