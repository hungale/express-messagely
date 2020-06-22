/** User class for message.ly */

const db = require("../db");
const ExpressError = require("../expressError");

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    // check if user already exists
    const user = await db.query(
      `SELECT username
      FROM users
      WHERE username=$1`,
      [username]
    );
      
    if(user.rows.length) {
      // const err = new Error("User already exists.");
      // err.status = 404;
      const err = new ExpressError("User already exists.", 404);
      return next(err);
    }

    // const date = Date.now();
    // const date = new Date("2011-01-01 12:00:00");
    const currentTime = new Date(Date.now()).toUTCString();

    // insert the user into the database
    const response = await db.query(
      `INSERT INTO users
        (username, password, first_name, last_name, phone, join_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING username, password, first_name, last_name, phone`,
      [username, password, first_name, last_name, phone, currentTime]
    );
    // console.log("IN INSERTION:", response.rows[0]);
    return response.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const response = await db.query(
      `SELECT username, password
      FROM users
      WHERE username=$1`,
      [username]
    );

    if(!response.rows.length) {
      const err = new ExpressError("No such user.", 404);
      return next(err);
    }
    
    const dbPassword = response.rows[0].password;

    return password === dbPassword;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const currentTime = new Date(Date.now()).toUTCString();
    
    await db.query(
      `UPDATE users
      SET last_login_at=$1
      WHERE username=$2`,
      [currentTime, username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() { }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const user = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username=$1`,
      [username]
    );

    return user.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { }
}


module.exports = User;
