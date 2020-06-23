const express = require("express");
let router = new express.Router();
const jwt = require("jsonwebtoken");

const ExpressError = require("../expressError")
const { SECRET_KEY } = require("../config");
const User = require("../models/user");


function _generateToken(username) {
  const payload = {username};
  const token = jwt.sign(payload, SECRET_KEY);

  return token;
}

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    const authenticated = await User.authenticate(username, password);
    
    if(authenticated) {
      await User.updateLoginTimestamp(username);
      const token = _generateToken(username);
      return res.json({token});
    } 
    throw new ExpressError("Invalid username/password.", 400);
  } catch(err) {
    return next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async (req, res, next) => {
  try {
    const resp = await User.register(req.body);

    // log in the user and return token
    await User.updateLoginTimestamp(resp.username);
    const token = _generateToken(resp.username);

    // issue the response
    return res.json({token});
  } catch(err) {
    return next(err);
  }
});

module.exports = router;