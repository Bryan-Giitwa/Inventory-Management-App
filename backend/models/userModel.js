//MODEL FOR USER
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Create a model or table
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please add a name"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Please add a email"],
      unique: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "password must be at least 6 characters"],
      select: false,
    },
    photo: {
      type: String,
      default:
        "https://res.cloudinary.com/dpcrhvlzq/image/upload/v1621863640/default_uomk2t.png",
    },
    phone: {
      type: String,
      default: "+254",
    },
    bio: {
      type: String,
      maxlength: [250, "Bio must not be more than 250 characters"],
      default: "bio",
    },
  },
  {
    timestamps: true,
  }
);

//HASH THE PASSWORD
//pre-hook to hash the password before saving it to the database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

// Write a const to hold the schema "user" is the name of the collection/table which will be plural
const User = mongoose.model("User", userSchema);

module.exports = User;
