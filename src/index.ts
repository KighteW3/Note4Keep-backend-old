import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import express from "express";
import "./modules/db";
import cors from "cors";

import createRandomString from "./modules/createRandomString";

import { users } from "./modules/usersModel";
import { notes } from "./modules/noteModel";

const app = express();
const PORT = process.env.PORT || 3003;

const api = express.Router();
app.use(cors());
app.use(express.json());
app.use("/api", api);

interface decodedTokens {
  user_id: string;
  username: string;
  userid: string;
  email: string;
  iat: number;
}

// Users
api.get("/users/check", (req, res) => {
  if (req.method === "GET" && req.headers.authorization) {
    const auth = req.headers.authorization;

    if (auth && auth.toLowerCase().startsWith("bearer")) {
      const token = auth.substring(7);
      const secret = process.env.SECRET || "t7l-84Ql|/{Q5./Db6.k";

      let tokenDecoded;

      try {
        tokenDecoded = jwt.verify(token, secret) as decodedTokens;
      } catch (e) {
        tokenDecoded = null;
      }

      if (tokenDecoded && tokenDecoded.userid) {
        (async () => {
          try {
            const result = await users.findOne(
              { user_id: tokenDecoded.userid },
              { _id: 0, user_id: 0, password: 0, ip: 0, __v: 0 }
            );

            if (result) {
              res.status(200).json({ response: "Ok", result });
            } else {
              res.status(404).json({ error: "User not found" });
            }
          } catch (e) {
            res
              .status(500)
              .json({ error: "Something gone wrong with the server" });
          }
        })();
      } else {
        res.status(401).json({ error: "Missing or invalid token" });
      }
    } else {
      res.status(401).json({ error: "Missing authentication token" });
    }
  } else {
    res.status(400).json({ error: "Something gone wrong with the request" });
  }
});

// Register
api.post("/users/create-user", (req, res) => {
  if (req.method === "POST" && req.body.username && req.body.password) {
    users.findOne({ username: req.body.username }).then((result) => {
      if (result) {
        res.status(409).json({ error: "User alredy exists" });
      } else {
        (async () => {
          const randomId = createRandomString(40, true);

          const passwordHashed = await bcrypt.hash(req.body.password, 10);

          const secret = process.env.SECRET || "t7l-84Ql|/{Q5./Db6.k";

          await users
            .create({
              user_id: randomId,
              username: req.body.username,
              password: passwordHashed,
              email: req.body.email || null,
              ip: req.ip,
            })
            .then((createRes) => {
              const token = jwt.sign(
                {
                  username: req.body.username,
                  userid: createRes.user_id,
                  email: req.body.email || null,
                  iat: Math.floor(Date.now() / 1000) - 30,
                },
                secret
              );

              res.status(201).json({ response: "User created", token });
            });
        })();
      }
    });
  } else {
    res.status(400);
  }
});

// LOGIN
api.post("/users/login", (req, res) => {
  if (req.method === "POST" && req.body.username && req.body.password) {
    users.findOne({ username: req.body.username }).then((result) => {
      if (
        result &&
        result.username === req.body.username &&
        result.password != undefined
      ) {
        (async () => {
          const decodedPass = await bcrypt.compare(
            req.body.password,
            result.password || ""
          );

          if (decodedPass) {
            const secret = process.env.SECRET || "t7l-84Ql|/{Q5./Db6.k";

            const token = jwt.sign(
              {
                username: req.body.username,
                userid: result.user_id,
                email: req.body.email || null,
                iat: Math.floor(Date.now() / 1000) - 30,
              },
              secret
            );

            res.status(200).json({ response: "Login succesful", token });
          } else {
            res.status(401).json({ error: "Unauthorized" });
          }
        })();
      } else {
        res.status(400).json({ error: "Username or password is incorrect" });
      }
    });
  } else {
    res.status(400).json({ error: "Bad request" });
  }
});

api.post("/notes/create-note", (req, res) => {
  if (
    req.method === "POST" &&
    req.body.title &&
    req.body.priority &&
    req.body.text
  ) {
    if (
      !req.body.title.trim() ||
      req.body.title.trim() === "" ||
      !req.body.text.trim() ||
      req.body.text.trim() === ""
    ) {
      res.status(400).json({ error: "Bad request" });
    }

    const auth = req.headers.authorization;

    if (auth && auth.toLowerCase().startsWith("bearer")) {
      const token = auth.substring(7);
      const secret = process.env.SECRET || "t7l-84Ql|/{Q5./Db6.k";

      let tokenDecoded;

      try {
        tokenDecoded = jwt.verify(token, secret) as decodedTokens;
      } catch (e) {
        tokenDecoded = null;
      }

      if (tokenDecoded && tokenDecoded.userid) {
        (async () => {
          try {
            await notes.create({
              note_id: createRandomString(40, false),
              title: req.body.title,
              priority: req.body.priority,
              text: req.body.text,
              user: tokenDecoded.userid,
              date: new Date(),
            });

            res.status(200).json({ response: "Note created" });
          } catch (e) {
            res.status(500).json({ error: "Something gone wrong" });
          }
        })();
      } else {
        res.status(406).send({ error: "Token missing or invalid" });
      }
    } else {
      res.status(406).json({ error: "Token missing or modified" });
    }
  } else {
    res.status(400).json({ error: "Something went wrong with the request" });
  }
});

// Searching notes
api.post("/notes/some-note", (req, res) => {
  if (
    req.method === "POST" &&
    req.headers.authorization &&
    req.body.note_phrase
  ) {
    const auth = req.headers.authorization;

    if (auth && auth.toLowerCase().startsWith("bearer")) {
      const token = auth.substring(7);
      const secret = process.env.SECRET || "t7l-84Ql|/{Q5./Db6.k";

      let tokenDecoded;

      try {
        tokenDecoded = jwt.verify(token, secret) as decodedTokens;
      } catch (e) {
        tokenDecoded = null;
      }

      if (tokenDecoded && tokenDecoded.userid) {
        (async () => {
          const regex = new RegExp(".*" + req.body.note_phrase + ".*", "i");

          try {
            const result = await notes
              .find(
                { user: tokenDecoded.userid, title: regex },
                { _id: 0, user: 0, __v: 0 }
              )
              .sort({ date: -1 });

            if (result.length > 0) {
              res.status(200).json({ result });
            } else {
              res.status(404).json({ error: "No notes were found" });
            }
          } catch (e) {
            res
              .status(500)
              .json({ error: "Something gone wrong with the server" });
          }
        })();
      } else {
        res.status(401).json({ error: "Invalid token" });
      }
    } else {
      res.status(401).json({ error: "No auth provided" });
    }
  } else {
    res.status(400);
  }
});

api.post("/notes/spec-note", (req, res) => {
  if (req.method === "POST" && req.headers.authorization && req.body.note_id) {
    const auth = req.headers.authorization;

    if (auth && auth.toLowerCase().startsWith("bearer")) {
      const token = auth.substring(7);
      const secret = process.env.SECRET || "t7l-84Ql|/{Q5./Db6.k";

      let tokenDecoded: decodedTokens | null;

      try {
        tokenDecoded = jwt.verify(token, secret) as decodedTokens;
      } catch (e) {
        tokenDecoded = null;
      }

      if (tokenDecoded && tokenDecoded.userid) {
        (async () => {
          try {
            const result = await notes.findOne(
              { note_id: req.body.note_id, user: tokenDecoded.userid },
              { _id: 0, user: 0, __v: 0 }
            );

            if (result) {
              res.status(200).json({ result });
            } else {
              res.status(404).json({
                error: "This note does not exists on the database",
              });
            }
          } catch (e) {
            res
              .status(500)
              .json({ error: "Something gone wrong with the server" });
          }
        })();
      } else {
        res.status(401).json({ error: "No authorizated" });
      }
    } else {
      res.status(400).json({ error: "Auth not provided" });
    }
  } else {
    res.status(400).json({ error: "Bad request" });
  }
});

// Deleting notes
api.delete("/notes/delete-note", (req, res) => {
  if (req.method === "DELETE" && req.body.note_id) {
    const auth = req.headers.authorization;

    if (auth && auth.toLowerCase().startsWith("bearer")) {
      const token = auth.substring(7);
      const secret = process.env.SECRET || "t7l-84Ql|/{Q5./Db6.k";

      let tokenDecoded;

      try {
        tokenDecoded = jwt.verify(token, secret) as decodedTokens;
      } catch (e) {
        tokenDecoded = null;
      }

      if (tokenDecoded && tokenDecoded.userid) {
        (async () => {
          try {
            const result = await notes.findOne({ note_id: req.body.note_id });
            if (result) {
              if (result.user === tokenDecoded.userid) {
                await notes.deleteOne({ note_id: req.body.note_id });

                res.status(200).json({ response: "Note delete succesfully" });
              } else {
                res
                  .status(401)
                  .json({ error: "This note can only be delete by his owner" });
              }
            } else {
              res
                .status(404)
                .json({ error: "The note does not exists on the database" });
            }
          } catch (e) {
            res
              .status(500)
              .json({ error: "Something gone wrong with the server" });
          }
        })();
      } else {
        res.status(401).json({ error: "Token dont match with secret key" });
      }
    } else {
      res.status(401).json({ error: "No authorization provided" });
    }
  } else {
    res.status(400).json({ error: "Bad request" });
  }
});

// Deleteing all notes
api.delete("/notes/delete-all-notes", (req, res) => {
  if (req.method === "DELETE") {
    const auth = req.headers.authorization;

    if (auth && auth.toLowerCase().startsWith("bearer")) {
      const token = auth.substring(7);
      const secret = process.env.SECRET || "t7l-84Ql|/{Q5./Db6.k";

      let tokenDecoded;

      try {
        tokenDecoded = jwt.verify(token, secret) as decodedTokens;
      } catch (e) {
        tokenDecoded = null;
      }

      if (tokenDecoded && tokenDecoded.userid) {
        (async () => {
          try {
            await notes.deleteMany({ user: tokenDecoded.userid });
            res
              .status(200)
              .json({ result: `Deleted all ${tokenDecoded.username} notes` });
          } catch (e) {
            res
              .status(500)
              .json({ error: `Cannot delete ${tokenDecoded.username} notes` });
          }
        })();
      } else {
        res.status(401).json({ error: "Token dont match with secret key" });
      }
    } else {
      res.status(401).json({ error: "No authorization provided" });
    }
  } else {
    res.status(400).json({ error: "Bad request" });
  }
});

// Getting notes
api.get("/notes", (req, res) => {
  if (req.method === "GET" && req.headers.authorization) {
    const auth = req.headers.authorization;

    if (auth && auth.toLowerCase().startsWith("bearer")) {
      const token = auth.substring(7);
      const secret = process.env.SECRET || "t7l-84Ql|/{Q5./Db6.k";

      let tokenDecoded;

      try {
        tokenDecoded = jwt.verify(token, secret) as decodedTokens;
      } catch (e) {
        tokenDecoded = null;
      }

      if (tokenDecoded && tokenDecoded.userid) {
        (async () => {
          try {
            const result = await notes
              .find({ user: tokenDecoded.userid }, { _id: 0, user: 0, __v: 0 })
              .sort({ date: -1 });

            if (result.length > 0) {
              res.status(200).json({ result });
            } else {
              res.status(404).json({ error: "No notes were found" });
            }
          } catch (e) {
            res
              .status(500)
              .json({ error: "Something gone wrong with the server" });
          }
        })();
      } else {
        res
          .status(401)
          .json({ error: "You're not authorizated to do this action." });
      }
    } else {
      res.status(401).json({ error: "No authorization provided" });
    }
  } else {
    res.status(400).json({ error: "Bad request" });
  }
});

app.listen(PORT, () => {
  console.log(`App listening from port ${PORT}.`);
});
