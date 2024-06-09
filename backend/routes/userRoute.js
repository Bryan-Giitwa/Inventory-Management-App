const express = require("express");
const {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");
const protect = require("../middleWare/authMiddleware");
const router = express.Router();

router.post("/register", registerUser); //Route to register a new user
router.post("/login", loginUser); //Route to login a registered user
router.get("/logout", logout); //Route to logout user
//protect function(middleware) gives user, route access to the user information to any route that will use it when they are logged in
router.get("/getuser", protect, getUser); //Route to get user
router.get("/loggedin", loginStatus); //Route to track if user is logged in
router.patch("/updateuser", protect, updateUser); //Route to update user
router.patch("/changepassword", protect, changePassword); //Route to change password
router.post("/forgotpassword", forgotPassword); //Route to send reset password email
router.put("/resetpassword/:resetToken", resetPassword); //Route to change password

module.exports = router;
