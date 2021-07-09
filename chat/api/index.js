const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const conversationRoute = require("./routes/conversations");
const messageRoute = require("./routes/messages");
const router = express.Router();
const path = require("path");
const PORT = process.env.PORT || 8800

dotenv.config();

mongoose.connect(
  "mongodb+srv://admin:admin@sap-dit3a87.airjg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to MongoDB");
  }
);
app.use("/images", express.static(path.join(__dirname, "public/images")));

//middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));


if (process.env.NODE_ENV === "production") {
  app.use(express.static('../client/build'))
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json("You have successfully uploaded a file.");
  } catch (error) {
    console.error(error);
  }
});


app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);

app.listen(PORT, () => {
  console.log("Backend server is running!");
});
