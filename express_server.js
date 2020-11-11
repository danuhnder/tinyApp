const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;
const { checkEmail, authenticateUser, generateRandomString } = require("./helpers");

app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const userDatabase = {
  qy3yow:{ 
    userID: 'qy3yow',
    email: 'test@test',
    password: 'test' 
  }
};

// ** REGISTRATION FUNCTIONALITY 

// user database


// registration page -  redirects to /urls if logged in
app.get("/register", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["userID"]],
  };
  if (!templateVars.user) {
    res.render("urls_register", templateVars);
  } else res.redirect("/urls")
});

app.post("/register", (req, res) => {
  const { email, password } = req.body; // contains email and password
  // sends status 400 if email or password are falsey OR if email is already registered
  if (!email || !password) {
    res.status(403).send("OOOOPS! Please enter an email address and password!");
  } else if (checkEmail(email, userDatabase)) {
    res.status(403).send("Oooops - looks like that email address is already registered!");
  } else {
  // once email passes checks, generates random user ID and pushes data to users object
  const userID = generateRandomString();
  userDatabase[userID] = { userID, email, password };
  // sets cookie from userID
  res.cookie("userID", userID);
  res.redirect('/urls');
  };
})
// send user to login page - redirects to /url if logged in
app.get("/login", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["userID"]],
  };
  if (!templateVars.user) {
    res.render("urls_login", templateVars);
  } else res.redirect("/urls")
})

// LOGIN LOGIC
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  // checks to see if email & password are truthy
  if (!email || !password) {
    res.status(403).send("OOOOPS! Please enter an email address and password!");
  // sends 400 if email address is not in database
  } else if (!checkEmail(email, userDatabase)) {
    res.status(403).send("Oooops - looks like that email address isn't registered!");
  } else {
    // retrieves user and checks to see if supplied password matches stored
    const user = authenticateUser(email, password, userDatabase);
    if (user) {
    // sets cookie if user creds match and redirects to /urls, otherwise sends 400 error
      res.cookie("userID", user.userID);
      res.redirect("/urls");
    } else {
      res.status(403).send("OOOOPS! Incorrect password!");
    }
  }
});

// clears cookie when logout button triggered
app.post("/logout", (req, res) => {
  res.clearCookie('userID')
  res.redirect("/urls");
})

// posting logic
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // gets target URL from request body, should check here to make sure URL is correctly formatted + includes http://
  const shortURL = generateRandomString(); // random string
  urlDatabase[shortURL] = `${longURL}`;  // adds new shortURL : longURL key:value to database object (this will change to SQL)
  res.redirect(`/urls/${shortURL}`);         // redirects to shortURL instance!
});

// modify an existing URL
app.post("/url_mod/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL; //takes shortURL from origin page
  const longURL = req.body.longURL; // new user submitted longURL
  urlDatabase[shortURL] = `${longURL}`; // modifies existing entry
  res.redirect(`/urls/${shortURL}`) // redirects to same page but with new data

})

// home page
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// index of tiny URLS
app.get("/urls", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["userID"]],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// go forth and make a tiny link
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["userID"]],
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});

// why not keep it useful for the APIs
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// delete requested link and redirect back to index page
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// IMPORTANT: DON'T BUILD any "/urls/... below this!
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["userID"]],
    shortURL: req.params.shortURL, //this appears in the html
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

// Redirects shortform URL directly to target webaddress
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];   
  res.redirect(longURL);
});


// crank this baby open
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
