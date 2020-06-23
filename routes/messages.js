const express = require("express");
const Message = require("../models/message");
const { ensureCorrectUser, ensureLoggedIn } = require("../middleware/auth");
const ExpressError = require("../expressError");

let router = new express.Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

 /** Since we don't have access to username in params, have to write an if 
  * statement :(
  */
router.get("/:id", ensureLoggedIn, async (req, res, next) => {
  try {

    const username = req.user.username;
    const msg = await Message.get(req.params.id);

    if (msg.to_user.username !== username 
        && msg.from_user.username !== username) {
      throw new ExpressError("Cannot read this message", 401);
    }

    return res.json({ message : msg });

  } catch (err) {
    return next(err);
  }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", async (req, res, next) => {
  try {
    const { username: from_username } = req.user;
    const { to_username, body } = req.body;
    const message = await Message.create({ from_username, to_username, body });

    return res.json({ message });

  } catch (err) {
    return next(err);
  }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureCorrectUser, async (req, res, next) => {

  try {
    const message = await Message.markRead(req.params.id);

    return res.json({ message })
  
  } catch (err) {
    return next(err);
  }
})


module.exports = router;