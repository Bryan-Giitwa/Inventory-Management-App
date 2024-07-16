const asyncHandler = require("express-async-handler");
const User = require("../models/userModel"); //user model
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

//GENERATE A WEB JSON TOKEN(JWT)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

//REGISTER A NEW USER
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  //validation to check if all fields are filled
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please add all fields");
  }
  //password atleast 6 characters
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }
  //check if user email already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  //create a new user in the database
  const user = await User.create({
    name,
    email,
    password,
  });

  //Generate token and assign to the user
  const token = generateToken(user._id);

  //Send the token as HTTP-only-Cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), //Cookie expires in one day
    sameSite: "none",
    secure: true,
  });

  //Check if user is created and return the data of the user
  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

//LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body; //Destructure from request body
  //validate request to check if there is no email or password and if true throw an error
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }
  //check if user exists
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    res.status(400);
    throw new Error("User not found please signup!");
  }

  //if user exists check if password is correct
  const passwordMatch = await bcrypt.compare(password, user.password);
  //Generate token and assign to user
  const token = generateToken(user._id);
  //Send the token as HTTP-only-Cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), //Cookie expires in one day
    sameSite: "none",
    secure: true,
  });
  if (user && passwordMatch) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid Email or Password");
  }
});

//LOGOUT USER
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  res.status(200).json({ message: "successfully logged out" });
});

//GET USER DATA
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
    });
  } else {
    res.status(400);
    throw new Error("User not found");
  }
});

//CHECK IF USER LOGIN STATUS
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  //user is not loggedin return false
  if (!token) {
    return res.json(false);
  }
  //verify token if is valid
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  //user is loggedin return true
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

//UPDATE USER
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.bio = req.body.bio || bio;
    user.photo = req.body.photo || photo;

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

//CHANGE PASSWORD
const changePassword = asyncHandler(async (req, res) => {
  // Find the user by ID and explicitly include the password field
  const user = await User.findById(req.user._id).select("+password");
  const { currentPassword, newPassword } = req.body;
  //check if user exists
  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }

  //check if user has submitted password
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Please add current password and new password");
  }

  //check if current password is correct
  const passwordIsCorrect = await bcrypt.compare(
    currentPassword,
    user.password
  );
  if (user && passwordIsCorrect) {
    user.password = newPassword;
    await user.save();
    res.status(200).send("Password change successful");
  } else {
    res.status(400);
    throw new Error("Current password is incorrect");
  }
});

//FORGOT PASSWORD AND SEND EMAIL
const forgotPassword = asyncHandler(async (req, res) => {
  //Destructure email from the request body
  const { email } = req.body;

  //check if email is in database
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  //Delete token if exist
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  //create reset token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken); //console the generated token

  //hash the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken) //Hash the reset token
    .digest("hex");
  // console.log(hashedToken); //console the generated hashed token

  //save hashed token in database
  await Token.create({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), //Token will expire 30 min from current time
  });

  //construct reset url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  //Reset Email
  const message = `
  <h2>Hello ${user.name}</h2>
  <p>Please use the link below to reset your password</p>
  <p>This reset link is valid for only 30 minutes</p>
  <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
  <p>Regards...</p>
  <h5>Inventory Management Team</h5>
  `;

  const subject = "Password Reset Request";
  const send_to = user.email;
  const from_email = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, from_email);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

//RESET PASSWORD
const resetPassword = asyncHandler(async (req, res) => {
  //Destructure token and Password
  const { Password } = req.body;
  const { resetToken } = req.params;

  //Hash token, then compare to Token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //find token in DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() }, //check if greater than current time
  });

  if (!userToken) {
    res.status(400);
    throw new Error("Invalid or Expired token, please try again");
  }
  //find user in DB
  const user = await User.findById(userToken.userId);
  user.password = Password;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password reset successful please Login",
  });
});
module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
