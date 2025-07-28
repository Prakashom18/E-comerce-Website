// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const cartRoutes = require('./routes/cartRoutes');

const app = express();

// Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/testapp1')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

// JWT Secret Key
const JWT_SECRET = 'your_jwt_secret_key'; // Use an environment variable in production

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.redirect('/login');
        }
        req.user = user; // Set the user data in the request
        next();
    });
}

// Public Routes
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

// User Registration
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error in registration:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// User Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/products');
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Cart Routes
app.use('/cart', authenticateToken, cartRoutes);

// Protected Routes
app.get('/products', authenticateToken, async (req, res) => {
    try {
        const products = await Product.find();
        res.render('products', { products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
});

// User Profile Route
app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password').populate('orderHistory');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.render('profile', { user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Error fetching profile' });
    }
});

// Display Update Profile Form
app.get('/profile/edit', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.render('editProfile', { user });
    } catch (error) {
        console.error('Error fetching user data for edit:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Handle Update Profile Form Submission
app.post('/profile/edit', authenticateToken, async (req, res) => {
    const { username, email } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(req.user.userId, { username, email }, { new: true });
        if (!updatedUser) return res.status(404).json({ error: 'User not found' });
        res.redirect('/profile');  // Redirect to profile page after updating
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("An error occurred while updating your profile.");
    }
});

// User Logout
app.post('/logout', authenticateToken, (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

// Define Shipping Charge
const shippingCharge = 5.00;

// Single Product Checkout
app.get('/checkout/:productId', authenticateToken, async (req, res) => {
    const productId = req.params.productId;
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).send('Product not found');

        const totalAmount = product.price + shippingCharge;

        res.render('checkout', { 
            product, 
            totalQuantity: 1,
            totalPrice: product.price,
            shippingCharge,
            totalAmount 
        });
    } catch (err) {
        console.error('Error in checkout:', err);
        res.status(500).send('Server error');
    }
});

// Cart Quantity Checkout
app.get('/checkout', authenticateToken, async (req, res) => {
    const productId = req.query.productId;
    const quantity = parseInt(req.query.quantity, 10);

    if (isNaN(quantity) || quantity <= 0) return res.status(400).send('Invalid quantity');

    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).send('Product not found');

        const totalPrice = product.price * quantity;
        const totalAmount = totalPrice + shippingCharge;

        res.render('checkout', { 
            product, 
            totalQuantity: quantity, 
            totalPrice, 
            shippingCharge,
            totalAmount 
        });
    } catch (err) {
        console.error('Error in checkout with quantity:', err);
        res.status(500).send('Server error');
    }
});

// Complete Checkout Route
app.post('/checkout/complete', authenticateToken, async (req, res) => {
    const { products, totalAmount, paymentMethod } = req.body; // Assume products is an array of { productId, quantity }

    try {
        if (!products || !totalAmount || !paymentMethod) {
            return res.status(400).send('All fields are required');
        }

        // Create the order
        const orderProducts = await Promise.all(products.map(async ({ productId, quantity }) => {
            const product = await Product.findById(productId);
            if (!product) throw new Error('Product not found');

            return {
                productId,
                quantity,
                price: product.price // Store price at the time of order
            };
        }));

        const order = new Order({
            products: orderProducts, // Updated to store product details
            userId: req.user.userId,
            totalAmount: parseFloat(totalAmount),
            paymentStatus: 'Pending', // You may want to adjust this based on payment processing
            status: 'Pending',
        });

        // Save the order to the database
        await order.save();

        // Add the order reference to the user's order history
        await User.findByIdAndUpdate(req.user.userId, {
            $push: { orderHistory: order._id }
        });

        // Render the order confirmation page
        res.render('orderConfirmation', {
            order: {
                products: orderProducts, // Display product details in the confirmation
                totalAmount: order.totalAmount,
                paymentMethod,
                status: order.status,
            },
        });
    } catch (error) {
        console.error('Error during checkout completion:', error);
        res.status(500).send('Server error');
    }
});

// Start the Server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
