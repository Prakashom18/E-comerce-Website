const mongoose = require('mongoose');
const Product = require('./models/Product'); // Ensure the path is correct

mongoose.connect('mongodb://127.0.0.1:27017/testapp1')
    .then(() => console.log('Connected to MongoDB for seeding'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

const products = [
    {
        name: 'Realme 5i',
        description: 'A budget-friendly smartphone with excellent features.',
        price: 860,
        imageUrl: 'https://www.j9phone.com/images/content/original-1603424727592.png',
        stock: 50
    },
    {
        name: 'iPhone 13',
        description: 'The latest model from Apple with advanced features.',
        price: 9998.99,
        imageUrl: 'https://qualitycomputer.com.np/web/image/product.product/41127/image_1024/Apple%20iPhone%2013%20Pro%20Max%20%28Sierra%20Blue%2C%20128GB%29?unique=6ad7f86',
        stock: 15
    },
    {
        name: 'Samsung Galaxy S21',
        description: 'A flagship smartphone with an excellent camera.',
        price: 999.99,
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1RYM7Fhi5JrS1DUZ-L4XFfQEKdnm2BlCgqQ&s',
        stock: 28
    },
    {
        name: 'OnePlus Nord',
        description: 'Fast performance and a smooth display.',
        price: 4729.99,
        imageUrl: 'https://choicemandu.com/image/cache/catalog/mobile/oneplus-new-compressed/oneplus%20nord%20ce%2012-1000x1000.jpg',
        stock: 12
    },
    {
        name: 'Google Pixel 6',
        description: 'Best-in-class camera and pure Android experience.',
        price: 399.99,
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5-Vayas4knBFH1yVd8wOglxxJeT57lE3wCQ&s',
        stock: 15
    },
    {
        name: 'Xiaomi Mi 11',
        description: 'High-end specifications at an affordable price.',
        price: 499.99,
        imageUrl: 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1666344667.93946102.png',
        stock: 20
    },
    {
        name: 'Redmi Note 10 Pro',
        description: 'Affordable smartphone with a large screen, great battery life, and quad-camera setup.',
        price: 299.99,
        imageUrl: 'https://choicemandu.com/image/cache/catalog/mobile/xiaomi-new-compressed/10pro-600x315.png',
        stock: 15
    },
    {
        name: 'iPhone 15',
        description: 'The latest Apple smartphone with enhanced features, improved battery life, and an advanced camera system.',
        price: 4199.99,
        imageUrl: 'https://cdn.dxomark.com/wp-content/uploads/medias/post-155689/Apple-iPhone-15-Pro-Max_-blue-titanium_featured-image-packshot-review-1024x691.jpg',
        stock: 10
    },
    {
        name: 'Realme 10 Pro Plus',
        description: 'Realme 10 Pro Plus with a 108MP camera, 5000mAh battery, and fast performance.',
        price: 399.99,
        imageUrl: 'https://www.j9phone.com/images/content/original-1671433017928.png',
        stock: 20
    }
    // Add more products as needed
];

const seedProducts = async () => {
    await Product.deleteMany({}); // Clear the existing products
    await Product.insertMany(products); // Add new products
    console.log('Products seeded successfully');
    mongoose.connection.close();
};

seedProducts().catch(err => console.error(err));
