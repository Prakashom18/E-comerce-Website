const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to the Product model
        quantity: { type: Number, required: true }, // Quantity of the product ordered
        price: { type: Number, required: true } // Store the price at the time of order
    }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
    totalAmount: { type: Number, required: true }, // Total cost of the order
    status: { 
        type: String, 
        required: true, 
        enum: ['Pending', 'Completed', 'Cancelled'], // Status options for the order
        default: 'Pending' // Default status set to Pending
    },
    paymentStatus: { 
        type: String, 
        required: true, 
        enum: ['Paid', 'Pending', 'Failed'], // Payment status options
        default: 'Pending' // Default payment status set to Pending
    }
}, {
    timestamps: true // Automatically creates and updates createdAt and updatedAt fields
});

module.exports = mongoose.model('Order', orderSchema);
