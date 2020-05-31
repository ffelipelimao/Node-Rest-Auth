const express = require("express");
const User = require("../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mailer = require("../../modules/mailer");

const authConfig = require("../../config/auth.json");

const router = express.Router();

function gerarToken(params = {}) {
  const token = jwt.sign({ params }, authConfig.secret, {
    expiresIn: 86400,
  });

  return token;
}

router.post("/register", async (req, res) => {
  const { email } = req.body;
  try {
    if (await User.findOne({ email })) {
      return res.status(400).send({ error: "User alredy exists" });
    }
    const user = await User.create(req.body);

    user.password = undefined;

    return res.send({
      user,
      token: gerarToken({ id: user.id }),
    });
  } catch (err) {
    return res.status(400).send({ error: "Failed in insert" });
  }
});

router.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(400).send({ err: "User not found" });
  }
  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(400).send({ err: "Invalid Password" });
  }

  user.password = undefined;

  return res.send({ user, token: gerarToken({ id: user.id }) });
});

router.post("/forgot_password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = User.findOne({ email });

    if (!user) {
      return res.status(400).send({ err: "User not found" });
    }
    const token = crypto.randomBytes(20).toString("hex");

    const now = new Date();
    now.setHours(now.getHours() + 1);

    await User.findByIdAndUpdate(user.id, {
      '$set': {
        passwordResetToken: token,
        passwordResetExpires: now,
      }
    }, { new: true, useFindAndModify: false }
    );
    console.log(user.passwordResetToken);
    mailer.sendMail(
      {
        to: email,
        from: "lflimao@hotmail.com",
        template: "auth/forgot_password",
        context: { token },
      },
      (err) => {
        if (err) {
          return res.status(400).send({ error: "falha ao enviar ema" });
        }
        return res.send();
      }
    );
  } catch (error) {
    res.status(400).send({ error: "error " });
  }
});

router.post("/reset_password", async (req, res) => {
  const { email, token, password } = req.body;

  try {
    const user = (await User.findOne({ email })).select(
      "+passwordResetToken passwordResetExpires"
    );
    if (!user) {
      return res.status(400).send({ erro: "User not found" });
    }
    if (token !== user.passwordResetToken) {
      return res.status(400).send({ erro: "Error token invalid" });
    }
    const now = new Date();

    if (now > user.passwordResetExpires) {
      return res.status(400).send({ erro: "Token expiress" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({ erro: "error ao reset" });
  }

  user.password = password;

  await user.save();
  res.send();
});

module.exports = (app) => app.use("/auth", router);
