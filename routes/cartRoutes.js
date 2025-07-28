// Import necessary modules
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');

// Render Cart Page
router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('cart.productId'); // Populate product details
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.render('cart', { cartItems: user.cart }); // Render the cart view
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add to Cart Route
router.post('/add', async (req, res) => {
    const { productId } = req.body;
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Find the product being added
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // Check if the product is already in the cart
        const existingItem = user.cart.find(item => item.productId.equals(productId));

        if (existingItem) {
            // If the product is already in the cart, increase its quantity
            existingItem.quantity += 1;
        } else {
            // If it's not in the cart, add it with quantity 1
            user.cart.push({ productId: product._id, quantity: 1 });
        }

        await user.save();
        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Cart Quantity
// Update Cart Quantity
router.post('/update/:cartItemId', async (req, res) => {
    const cartItemId = req.params.cartItemId;
    const { change } = req.body; // Expecting change in the request body (e.g., 1 for increase, -1 for decrease)

    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            console.error('User not found with ID:', req.user.userId);
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the cart item
        const item = user.cart.id(cartItemId);
        if (!item) {
            console.error('Cart item not found with ID:', cartItemId);
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Update the quantity and ensure it doesn't go below 1
        const newQuantity = item.quantity + change;
        if (newQuantity < 1) {
            console.warn('Attempted to set quantity below 1 for cart item:', cartItemId);
            item.quantity = 1;
        } else {
            item.quantity = newQuantity;
        }

        await user.save();

        console.log('Updated cart item quantity:', item.quantity);
        res.json({ updatedQuantity: item.quantity });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: error.message });
    }
});


// Remove from Cart Route
router.delete('/remove/:cartItemId', async (req, res) => {
    const cartItemId = req.params.cartItemId;
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Remove the item from the cart
        user.cart = user.cart.filter(item => !item._id.equals(cartItemId));
        
        await user.save();
        res.status(200).json({ message: 'Item removed from cart successfully' });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export the router
module.exports = router;
