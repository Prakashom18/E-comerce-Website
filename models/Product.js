const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    stock: { type: Number, required: true },
    shippingCharge: {
        type: Number,
        default: 0 // Default value for shipping charge
    }
});

// Export the Product model
module.exports = mongoose.model('Product', productSchema);
