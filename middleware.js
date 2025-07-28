// middleware.js

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key'; // Ensure this matches what you have in index.js

// Middleware for verifying JWT tokens
function authenticateToken(req, res, next) {
    const token = req.cookies.token; // Get the token from cookies
    if (!token) {
        return res.redirect('/login'); // Redirect to login if no token
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.redirect('/login'); // Redirect if token verification fails
        }
        req.user = user; // Attach user info to request
        next(); // Continue to the requested route
    });
}

// Apply middleware to edit profile route
app.get('/profile/edit', authenticateToken, (req, res) => {
    res.render('editProfile', { user: req.user }); // Pass user data to the template
});

module.exports = { authenticateToken }; // Export the middleware function
