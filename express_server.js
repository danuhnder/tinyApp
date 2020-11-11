const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;
const { checkEmail, authenticateUser, generateRandomString, urlsForUser } = require("./helpers");

app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

//** PLACEHOLDER DATABASES TO CHECK FUNCTIONALITY */
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  jawaspeak: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  hipdad: { longURL: "http://www.achewood.com", userID: "robocop"} 
};

const userDatabase = {
  aJ48lW: {
    userID: "aJ48lW",
    email: 'test@test',
    password: 'test'
  }
};

//** REGISTRATION FUNCTIONALITY */

// registration page -  redirects to /urls if logged in
app.get("/register", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["userID"]],
  };
  if (!templateVars.user) {
    res.render("urls_register", templateVars);
  } else res.redirect("/urls");
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
  }
});
// send user to login page - redirects to /url if logged in
app.get("/login", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["userID"]]
  };
  if (!templateVars.user) {
    res.render("urls_login", templateVars);
  } else res.redirect("/urls");
});

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
    // retrieves user if supplied password matches stored
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
  res.clearCookie('userID');
  res.redirect("/urls");
});

// posting logic
app.post("/urls", (req, res) => {
  const userID = req.cookies["userID"];
  const longURL = req.body.longURL; // 
  const shortURL = generateRandomString(); 
  urlDatabase[shortURL] = { longURL, userID };  // adds new shortURL : { longURL, userID }  key:value to database object 
  res.redirect(`/urls/${shortURL}`);         // redirects to shortURL instance!
  
});

// modify an existing URL
app.post("/url_mod/:shortURL", (req, res) => {
  const user = userDatabase[req.cookies["userID"]];
  const shortURL = req.params.shortURL; //takes shortURL from origin page
  const longURL = req.body.longURL; // new user submitted longURL
  // checking credentials before allowing edits or deletions
  if (!user) {
    res.status(403).send('nice try, hacker')
  };
  if (urlDatabase[shortURL].userID === user.userID) {
    urlDatabase[shortURL].longURL = longURL; //
  }
  res.redirect(`/urls/${shortURL}`); // redirects to same page but with new data
});

// home page
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// index of tiny URLS
app.get("/urls", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["userID"]],
    // filters urls in database based on user ID
    urls: urlsForUser(req.cookies["userID"], urlDatabase)
  };
  res.render("urls_index", templateVars);
});

// go forth and make a tiny link 
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["userID"]],
    urls: urlDatabase
  };
  // (but only if you are logged in)
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else res.redirect("/login");  
});

// why not keep it useful for the APIs
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// delete requested link and redirect back to index page
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = userDatabase[req.cookies["userID"]];
  const shortURL = req.params.shortURL;
  // checking credentials before allowing edits or deletions
  if (!user) {
    res.status(403).send('nice try, hacker')
  };
  if (urlDatabase[shortURL].userID === user.userID) {
  delete urlDatabase[shortURL];
  }
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
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});


// crank this baby open
app.listen(PORT, () => {
  console.log(`"What are these? URLs for ANTS!?" server listening on port ${PORT}!`);
});
