// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');

const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const cartRoutes = require('./routes/cartRoutes');

const app = express();

// ----------------- Config -----------------
const JWT_SECRET = 'your_jwt_secret_key'; // Use environment variable in production
const secretKey = '8gBm/:&EnhH.1/q';      // eSewa sandbox secret key
const shippingCharge = 1000.00;
const esewaUrl = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'; // ✅ Correct sandbox endpoint

// Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/testapp1')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ Failed to connect to MongoDB', err));

// ----------------- JWT Middleware -----------------
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        next();
    });
}

// ----------------- Helper: eSewa Signature -----------------
function generateSignature(total_amount, transaction_uuid, product_code, secretKey) {
    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

// ----------------- Public Routes -----------------
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

// ----------------- Authentication -----------------
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

app.post('/logout', authenticateToken, (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

// ----------------- Protected Routes -----------------
app.use('/cart', authenticateToken, cartRoutes);

// Products page
app.get('/products', authenticateToken, async (req, res) => {
    try {
        const products = await Product.find();
        res.render('products', { products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Profile page
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

// Edit profile
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

app.post('/profile/edit', authenticateToken, async (req, res) => {
    const { username, email } = req.body;
    try {
        const updatedUser = await User.findByIdAndUpdate(req.user.userId, { username, email }, { new: true });
        if (!updatedUser) return res.status(404).json({ error: 'User not found' });
        res.redirect('/profile');
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("An error occurred while updating your profile.");
    }
});

// ----------------- Checkout Routes -----------------
app.get('/checkout/:productId', authenticateToken, async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) return res.status(404).send('Product not found');

        const totalAmount = product.price + shippingCharge;

        // Create a pending order before payment
        const tempOrder = new Order({
            userId: req.user.userId,
            products: [{ productId: product._id, quantity: 1, price: product.price }],
            totalAmount,
            status: 'Pending'
        });
        await tempOrder.save();

        const transaction_uuid = tempOrder._id.toString();
        const signature = generateSignature(totalAmount, transaction_uuid, 'EPAYTEST', secretKey);

        res.render('checkout', {
            product,
            shippingCharge,
            totalAmount,
            esewaUrl,
            signature,
            transaction_uuid
        });

    } catch (err) {
        console.error('Error in checkout:', err);
        res.status(500).send('Server error');
    }
});

// ----------------- eSewa Payment Routes -----------------
app.get('/esewa/pay-with-esewa', (req, res) => {
    const order_price = req.query.price;
    const tax_amount = 0;
    const amount = order_price;
    const transaction_uuid = crypto.randomUUID();
    const product_code = 'EPAYTEST';
    const product_service_charge = 0;
    const product_delivery_charge = 0;

    const signature = generateSignature(amount, transaction_uuid, product_code, secretKey);

    res.render('esewa', {
        amount,
        tax_amount,
        transaction_uuid,
        product_code,
        product_service_charge,
        product_delivery_charge,
        signature,
        esewaUrl
    });
});



app.post('/esewa/success', async (req, res) => {
    try {
        const { transaction_uuid } = req.body;
        const order = await Order.findById(transaction_uuid);
        if (!order) return res.status(404).send('Order not found');

        order.status = 'Paid';
        order.paymentStatus = 'Completed';
        await order.save();

        res.redirect(`/orderConfirmation/${order._id}`);
    } catch (err) {
        console.error('Error in success callback:', err);
        res.status(500).send('Server error');
    }
});
// eSewa success (GET)
// Simple success page without DB dependency
app.get('/esewa/success', (req, res) => {
    try {
        // You can log the query to debug if needed
        console.log('eSewa success query:', req.query);

        // Directly render success page
        res.render('paymentSuccess');
    } catch (err) {
        console.error('Error in eSewa success route:', err);
        res.status(500).send('Server error');
    }
});

app.post('/esewa/failure', async (req, res) => {
    try {
        const { transaction_uuid } = req.body;
        const order = await Order.findById(transaction_uuid);
        if (!order) return res.status(404).send('Order not found');

        order.status = 'Failed';
        order.paymentStatus = 'Failed';
        await order.save();

        res.send('Payment failed. Please try again.');
    } catch (err) {
        console.error('Error in failure callback:', err);
        res.status(500).send('Server error');
    }
});

// ----------------- Start Server -----------------
app.listen(3000, () => {
    console.log('🚀 Server running on http://localhost:3000');
});
