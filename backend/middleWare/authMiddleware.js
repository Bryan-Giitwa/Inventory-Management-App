const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

//protect function(middleware) gives user, route access to the user information to any route that will use it
const protect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    //check if token exist
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }

    //verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    //Get user id from token and check if user exists
    const user = await User.findById(verified.id).select("-password");
    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }
    //save the user from database to request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }
});

module.exports = protect;
