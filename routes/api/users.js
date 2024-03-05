const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const UserModel = require("../../models/User");

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  "/",
  [
    check("name", "Name is required.").not().isEmpty(),
    check("email", "Please include a valid email.").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters."
    ).isLength({ min: 6 }),
  ],
  //   Check data is valid or not
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password } = req.body;
      // See if user exists
      let user = await UserModel.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      // Get users gravatar
      const avatar = gravatar.url(email, {
        s: "200", // Size of string
        r: "pg", // Rating (suitable for websites with general audience)
        d: "mm", // Default (mystery man, if no image found)
      });

      //   Create instance of user
      user = new UserModel({
        name,
        email,
        password,
        avatar,
      });

      // Encrypt password using Bcrypt before saving
      const salt = await bcrypt.genSalt(10); // 10 is cost factor ( more cost factor->more secure but slower)
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return jsonwebtoken ( in order to logged in user have this token)

      const payload = {
        user: { id: user.id },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
      //   res.send("User registered");
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
