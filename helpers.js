// returns true if email address is already in user database
const checkEmail = (email, db) => {
  for (let user in db) {
    if (db[user].email === email) {
      return true;
    }
  };
  return false;
};

// returns user as object if email and password match
const authenticateUser = (email, password, db) => {
  for (let user in db) {
    if (db[user].email === email) {
      if (db[user].password === password) {
        return db[user];
      }
    }
  };
  return false;
};

// used to generate shortURL;
const generateRandomString = () => {
  const randomString = Math.random().toString(36).substring(2, 8);
  return randomString;
};

module.exports = { checkEmail, authenticateUser, generateRandomString }