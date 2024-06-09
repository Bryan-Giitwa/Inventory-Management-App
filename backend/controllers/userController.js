const asyncHandler = require("express-async-handler");
const User = require("../models/userModel"); //user model
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
  res.send("CHANGE PASSWORD ");
});

module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
};
