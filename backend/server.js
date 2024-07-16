require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const userRoute = require("./routes/userRoute");
const errorHandler = require("./middleWare/errorMiddleware");
const cookieparser = require("cookie-parser");

// app config
const app = express();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieparser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

//ROUTES MIDDLEWARE
app.use("/api/users", userRoute);

//routes
app.get("/", (req, res) => {
  res.send("Hello World");
});

//error middleware
app.use(errorHandler);

// connect to DB, start server and console if connected to DB
const port = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`server running on port ${port}`);
      console.log("Connected to DB");
    });
  })
  .catch((err) => console.log(err));
