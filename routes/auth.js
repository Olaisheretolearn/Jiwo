const express  = require('express');
const router = express.Router();
const User = require('../models/User');


//gets the opage
router.get('/signup', (req, res) => {
  res.render('auth/signup', { error: null });
});


//after form has been filled , sends data here
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, interacEmail } = req.body;

    if (!username || !email || !password) {
      return res.render('auth/signup', {
        error: "All fields are required."
      });
    }

    const user = await User.signup({ username, email, password, interacEmail });

    req.session.userId = user._id;
    req.session.username = user.username;

    return res.redirect('/dashboard');

  } catch (err) {
    console.error("signup error:", err);

    // Duplicate username or email
    if (err.code === 11000) {
      return res.render('auth/signup', {
        error: "Username or email already in use."
      });
    }

    return res.render('auth/signup', {
      error: "Something went wrong. Please try again."
    });
  }
});



// get the login page
router.get('/login', (req, res) => {
   res.render('auth/login');
});

// post login data after it has been filled
router.post('/login', async (req, res, next) => {
    try{
    const { email, password } = req.body;
    if (!email || !password){
        return res.status(400).send("Please enter your email and password");
    }

    const user = await User.findOne({ email });
    if (!user){
        return res.status(400).send("Invalid email or password");
    }

    const ok = await user.checkPassword(password);
    if (!ok){
        return res.status(400).send("Invalid email or password");
    }

    req.session.userId = user._id;
    req.session.username = user.username;
    res.redirect('/dashboard');
} catch (err){
    console.error('login error: ', err);
    res.status(500).send("Something went wrong logging in. Please try again later.");
}
});

//logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});




module.exports = router;