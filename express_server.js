const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const { checkEmail, authenticateUser, generateRandomString, urlsForUser } = require("./helpers");

const app = express();
const PORT = 8080;

app.use(cookieSession({
  name: 'session',
  keys: ['wabbalubbadubdub'],
  maxAge: 168 * 60 * 60 * 1000 // 168 hours / one week
}));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));

//** PLACEHOLDER DATABASES TO CHECK FUNCTIONALITY */
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
    created: '1605191863212',
    visitEvents: 0,
    uniqueVisitors: [],
    visitLog: {}
  },
  jawaspeak: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    created: '1605191863754',
    visitEvents: 0,
    uniqueVisitors: [],
    visitLog: {}
  },
};

const userDatabase = {
  aJ48lW: {
    userID: "aJ48lW",
    email: 'test@test',
    //plaintext 'test'
    hashedPassword: '$2b$10$eqCC0.zsP5kZ9BXu35scMuv5olPLduEGaIA36i4E8PdGmyPd5saCi'
  }
};

//** REGISTRATION FUNCTIONALITY */
//*
// send user to registration page
app.get("/register", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session.userID],
  };
  if (!templateVars.user) {
    res.render("urls_register", templateVars);
    // redirects to /urls if logged in
  } else res.redirect("/urls");
});

// REGISTRATION LOGIC
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  // sends status 403 if email or password are falsey OR if email is already registered
  if (!email || !password) {
    res.status(403).send("OOOOPS! Please enter an email address and password!");
  } else if (checkEmail(email, userDatabase)) {
    res.status(403).send("Oooops - looks like that email address is already registered!");
  } else {
  // generates random user ID, hashes password and adds data to users object
    const userID = generateRandomString();
    const hashedPassword = bcrypt.hashSync(password, 10);
    userDatabase[userID] = { userID, email, hashedPassword };
    // sets cookie from userID
    req.session.userID = userID;
    res.redirect('/urls');
  }
});

// send user to login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session.userID]
  };
  if (!templateVars.user) {
    res.render("urls_login", templateVars);
    // redirects to /urls if logged in
  } else res.redirect("/urls");
});

// LOGIN LOGIC
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  // sends status 403 if email or password are falsey
  if (!email || !password) {
    res.status(403).send("OOOOPS! Please enter an email address and password!");
    // sends 403 if email address is NOT in database
  } else if (!checkEmail(email, userDatabase)) {
    res.status(403).send("Oooops - looks like that email address isn't registered!");
  } else {
    // retrieves user if supplied password matches stored (authenticateUser function includes bcrypt.compareSync())
    const user = authenticateUser(email, password, userDatabase);
    // user will be false if password did not match
    if (user) {
    // sets cookie if user creds match and redirects to /urls, otherwise sends 400 error
      req.session.userID = user.userID;
      res.redirect("/urls");
    } else {
      res.status(403).send("OOOOPS! Incorrect password!");
    }
  }
});

// clears cookie when logout button triggered
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// NEW URL LOGIC
app.post("/urls", (req, res) => {
  const userID = req.session.userID;
  const longURL = req.body.longURL; //
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID, created: new Date(), visitEvents: 0, uniqueVisitors: [], visitLog: {} };
  // redirects to new shortURL instance
  res.redirect(`/urls/${shortURL}`);
  
});

// modify an existing URL
app.put("/url_mod/:shortURL", (req, res) => {
  const user = userDatabase[req.session.userID];
  const shortURL = req.params.shortURL; //takes shortURL from origin page
  const longURL = req.body.longURL; // new user submitted longURL
  // checking credentials before allowing edits or deletions
  if (!user) {
    res.status(403).send('nice try, hacker');
  }
  if (urlDatabase[shortURL].userID === user.userID) {
    urlDatabase[shortURL].longURL = longURL;
  }
  res.redirect(`/urls/${shortURL}`); // redirects to updated shortURL instance
});

// I got sick of typing /urls
app.get("/", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  } else res.redirect("/login");
});

// index of tiny URLS
app.get("/urls", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session.userID],
    // filters urls in database based on user ID
    urls: urlsForUser(req.session.userID, urlDatabase),
  };
  res.render("urls_index", templateVars);
});

// go forth and make a tiny link
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session.userID]
  };
  // (but only if you are logged in)
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else res.redirect("/login");
});

// delete requested link and redirect back to index page
app.delete("/urls/:shortURL/delete", (req, res) => {
  const user = userDatabase[req.session.userID];
  const shortURL = req.params.shortURL;
  // checking credentials before allowing edits or deletions
  if (!user) {
    res.status(403).send('nice try, hacker');
  }
  if (urlDatabase[shortURL].userID === user.userID) {
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls");
});

// IMPORTANT: DON'T BUILD any "/urls/... below this!
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session.userID],
    shortURL: req.params.shortURL,
    url: urlDatabase[req.params.shortURL]

  };
  res.render("urls_show", templateVars);
});

// Redirects shortform URL directly to target webaddress
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    // tracks the use of the shortened link
    urlDatabase[shortURL].visitEvents += 1;
    // sets a cookie if none is present
    if (!req.session.userID) {
      req.session.userID = generateRandomString();
    }
    // adds user cookie if not present in the uniqueVisitors array
    if (!urlDatabase[shortURL].uniqueVisitors.includes(req.session.userID)) {
      urlDatabase[shortURL].uniqueVisitors.push(req.session.userID);
    }
    // timestamps visit and visitor id
    urlDatabase[shortURL].visitLog[Date.now()] = req.session.userID;
    res.redirect(longURL);
  } else {
    res.redirect(404, "/urls");
  }
});


// crank this baby open
app.listen(PORT, () => {
  console.log(`"What are these? URLs for ANTS!?" server listening on port ${PORT}!`);
});
