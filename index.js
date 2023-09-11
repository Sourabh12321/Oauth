
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const jwt = require("jsonwebtoken");

const express = require("express")
require("dotenv").config();
const app = express()

// const passport = require("./config/google.auth")
const { connection } = require("./config/db")
const { UserModel } = require("./models/user.schema")

app.get("/", (req, res) => {
  res.send("home")
})


const { v4: uuidv4 } = require("uuid");


const passport = require("passport")
var GoogleStrategy = require('passport-google-oauth20').Strategy;
require("dotenv").config();


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:8000/auth/google/callback"
},
  async function (accessToken, refreshToken, profile, cb) {
    let name = profile._json.name;
    let email = profile._json.email;
    let verified = profile._json.email_verified;
    if (verified) {
      let user = await UserModel.findOne({ email: email });
      if (user) {
        return cb(null, user)
      }
      let newUser = new UserModel({ name: name, email: email, password: uuidv4() });
      await newUser.save();
      return cb(null, newUser);
    }
    
  }
));


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));



app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login',session: false }),
  function (req, res) {
    let user = req.user;
    console.log("./sd")
    const tosendtoken = jwt.sign(
      { email: user.email },
      process.env.secret,
      {
        expiresIn: "7h",
      }
    );
    res.redirect(`https://thunderous-alpaca-184d8d.netlify.app/frontend/topquestions?token=${tosendtoken}&Name=${user.name}`)

  });







const passport3 = require("passport");


//github auth




// Serve the index.html file
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})


// Github OAuth authentication flow


app.get('/auth/github', async (req, res) => {
  const { code } = req.query;

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        scope: "user:email", // Request the user:email scope
      }),
    });

    const data = await response.json();
    const accessToken = data.access_token;

    const userData = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const githubUser = await userData.json();

    let email = githubUser.email;
    if (!email) {
      email = `${githubUser.name}@gmail.com`
    }

    const isUserpresent = await UserModel.findOne({ email: email });
    if (isUserpresent) {
      const tosendtoken = jwt.sign(
        { email: isUserpresent.email },
        process.env.secret,
        {
          expiresIn: "7h",
        }
      );
      res.redirect(`https://thunderous-alpaca-184d8d.netlify.app/frontend/topquestions?token=${tosendtoken}&Name=${isUserpresent.name}`)
    } else {
      const userData = new UserModel({ name: githubUser.name, email: email, password: uuidv4() });
      await userData.save();
      const tosendtoken = jwt.sign(
        { email: email },
        process.env.secret,
        {
          expiresIn: "7h",
        }
      );
      res.redirect(`https://thunderous-alpaca-184d8d.netlify.app/frontend/topquestions?token=${tosendtoken}&Name=${githubUser.name}`)
    }

  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});




app.listen(8000, async () => {
  try {
    await connection
    console.log(`connected to port at ${4500}`);
  } catch (err) {
    console.log(err)
  }
})
