const express = require("express");
const bodyParser = require("body-parser");
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

// allows inline JS/html integration
app.set('view engine', 'ejs');
// parses body of response
app.use(bodyParser.urlencoded({extended: true}));
// posting logic
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // gets target URL from request body,
  const shortURL = generateRandomString(); // random string
  urlDatabase[shortURL] = `http://${longURL}`;  // adds new shortURL : longURL key:value to database object (this will change to SQL)
  res.redirect(`/urls/${shortURL}`);         // redirects to shortURL instance!
});
// index of tiny URLS
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});
// go forth and make a tiny link
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
// why not keep it useful for the APIs
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
// IMPORTANT: DON'T BUILD any "/urls/... below this!
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
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
