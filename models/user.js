/** User class for message.ly */

const db = require("../db");
const ExpressError = require("../expressError");

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    // check if user already exists
    const user = await db.query(
      `SELECT username
      FROM users
      WHERE username=$1`,
      [username]
    );

    if (user.rows.length) {
      // const err = new Error("User already exists.");
      // err.status = 404;
      throw new ExpressError("No such user.", 404);
    }
    /**our failed dates */
    // // const date = Date.now();
    // // const date = new Date("2011-01-01 12:00:00");
    // const currentTime = new Date(Date.now()).toUTCString();

    // insert the user into the database
    const response = await db.query(
      `INSERT INTO users
        (username, password, first_name, 
        last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone`,
      [username, password, first_name, last_name, phone]
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

    if (!response.rows.length) {
      throw new ExpressError("No such user.", 404);
    }

    const dbPassword = response.rows[0].password;

    return password === dbPassword;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users
      SET last_login_at=current_timestamp
      WHERE username=$1`,
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const users = await db.query(
      `SELECT username, first_name, last_name
      FROM users`
    );
    return users.rows;
  }

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

  static async messagesFrom(username) {
    const messages = await db.query(
      `SELECT m.id, u2.first_name, u2.last_name, u2.phone, u2.username,
              m.body, m.sent_at, m.read_at
      FROM users u1 
      JOIN messages m 
        ON u1.username = m.from_username
      JOIN users u2
        on m.to_username = u2.username
      WHERE u1.username = $1`,
      [username]
    );

    let msgs = messages.rows.map(m => ({
      id: m.id,
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
      to_user: {
        username: m.username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      }
    }));
    return msgs;
  }


  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const messages = await db.query(
      `SELECT u2.username, u2.first_name, u2.last_name, u2.phone,
            m.id, m.body, m.sent_at, m.read_at
      FROM users u1
      JOIN messages m
        ON u1.username = m.to_username
      JOIN users u2
        ON u2.username = m.from_username
      WHERE u1.username  = $1`,
      [username]
    );
    let msgs = messages.rows.map(m => ({
      id: m.id,
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
      from_user: {
        username: m.username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      }
    }));
    return msgs;
  }
}


module.exports = User;
