const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
        name: { type: String },
        address: { type: String },
        phone: { type: String }
    },
    orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    cart: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: { type: Number, required: true, min: 1,default:1 }
        }
    ]
});

// Export the User model
const User = mongoose.model('User', userSchema);
module.exports = User;
