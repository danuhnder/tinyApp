const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080
// this will become database with SQL access

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
// used to generate shortURL;
const generateRandomString = () => {
  const randomString = Math.random().toString(36).substring(2, 8);
  return randomString;
};
// allows cookieParser
app.use(cookieParser());
// allows inline JS/html integration
app.set('view engine', 'ejs');
// parses body of response
app.use(bodyParser.urlencoded({extended: true}));

// ** REGISTRATION FUNCTIONALITY 

const users = {
  qy3yow:{ 
    userID: 'qy3yow',
    email: 'test@test',
    password: 'tobyrules' 
  }
};
// returns true if email address is already in user database
const emailChecker = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  };
  return false;
};

// registration page - TODO make this redirect to /urls if logged in
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userID"]]
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const userData = req.body; // contains email and password
  // sends status 400 if email or password are falsey OR if email is already registered
  if (!userData.email || !userData.password) {
    res.status(400).send("OOOOPS! Please enter an email address and password!");
  } else if (emailChecker(userData.email, users)) {
    res.status(400).send("Oooops - looks like that email address is already registered!");
  } else {
  // once email passes checks, generates random user ID and pushes data to users object
  const userID = generateRandomString();
  users[userID] = { userID, email: userData.email, password: userData.password };
  // sets cookie from userID
  res.cookie("userID", userID);
  res.redirect('/urls');
  };
})

app.get("/login", (req, res) => {
  
})

// sets cookie on login
app.post("/login", (req, res) => {
  const userID = req.body.userID;
  res.cookie('userID', userID);
  res.redirect("/urls");
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


// index of tiny URLS
app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase, 
    user: users[req.cookies["userID"]] };
  res.render("urls_index", templateVars);
});
// go forth and make a tiny link
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userID"]]
    
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
    user: users[req.cookies["userID"]],
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
