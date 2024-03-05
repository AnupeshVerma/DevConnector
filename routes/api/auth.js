const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const UserModel = require("../../models/User");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get("/", auth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-password"); // minus password
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/auth
// @desc    Authenticate user and & get token
// @access  Public
router.post(
  "/",
  [
    check("email", "Please include a valid email.").isEmail(),
    check("password", "Password is required.").exists(),
  ],
  //   Check data is valid or not
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      // See if user exists
      let user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "Invalid credentials." });
      }

      // Get users gravatar
      const avatar = gravatar.url(email, {
        s: "200", // Size of string
        r: "pg", // Rating (suitable for websites with general audience)
        d: "mm", // Default (mystery man, if no image found)
      });

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: "Invalid credentials." });
      }

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
