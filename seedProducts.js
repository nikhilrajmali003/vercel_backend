const mongoose = require('mongoose');
const Item = require('./models/Item');
require('dotenv').config();

const sampleProducts = [
    {
        productName: 'CakeZone Walnut Brownie',
        productType: 'Foods',
        quantityStock: 100,
        mrp: 2000,
        sellingPrice: 1800,
        brandName: 'CakeZone',
        images: ['https://via.placeholder.com/300x300/8B4513/FFFFFF?text=Brownie'],
        exchangeEligibility: 'Yes',
        description: 'Delicious walnut brownie',
        status: 'published'
    },
    {
        productName: 'CakeZone Choco Fudge Brownie',
        productType: 'Foods',
        quantityStock: 150,
        mrp: 23,
        sellingPrice: 23,
        brandName: 'CakeZone',
        images: ['https://via.placeholder.com/300x300/FF1493/FFFFFF?text=Choco+Fudge'],
        exchangeEligibility: 'Yes',
        description: 'Rich chocolate fudge brownie',
        status: 'unpublished'
    },
    {
        productName: 'Tenderness Christmas Cake',
        productType: 'Foods',
        quantityStock: 50,
        mrp: 100,
        sellingPrice: 23,
        brandName: 'CakeZone',
        images: ['https://via.placeholder.com/300x300/90EE90/000000?text=Xmas+Cake'],
        exchangeEligibility: 'Yes',
        description: 'Special Christmas cake',
        status: 'published'
    },
    {
        productName: 'iPhone 15 Pro',
        productType: 'Electronics',
        quantityStock: 25,
        mrp: 129900,
        sellingPrice: 124900,
        brandName: 'Apple',
        images: ['https://via.placeholder.com/300x300/000000/FFFFFF?text=iPhone+15'],
        exchangeEligibility: 'No',
        description: 'Latest iPhone with A17 Pro chip',
        status: 'published'
    },
    {
        productName: 'Samsung Galaxy S24',
        productType: 'Electronics',
        quantityStock: 30,
        mrp: 89999,
        sellingPrice: 84999,
        brandName: 'Samsung',
        images: ['https://via.placeholder.com/300x300/1428A0/FFFFFF?text=Galaxy+S24'],
        exchangeEligibility: 'Yes',
        description: 'Flagship Samsung smartphone',
        status: 'unpublished'
    }
];

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/figma-assignment');
        console.log('Connected to MongoDB');

        // You'll need to get a valid user ID from your database
        // For now, we'll fetch the first user or you can specify one
        const User = require('./models/User');
        const firstUser = await User.findOne();

        if (!firstUser) {
            console.error('No users found in database. Please create a user first.');
            process.exit(1);
        }

        console.log(`Using user: ${firstUser.email} (${firstUser._id})`);

        // Add createdBy to all products
        const productsWithUser = sampleProducts.map(product => ({
            ...product,
            createdBy: firstUser._id
        }));

        // Clear existing products (optional - comment out if you want to keep existing)
        // await Item.deleteMany({});
        // console.log('Cleared existing products');

        // Insert sample products
        const insertedProducts = await Item.insertMany(productsWithUser);
        console.log(`Successfully inserted ${insertedProducts.length} products:`);

        insertedProducts.forEach(product => {
            console.log(`- ${product.productName} (${product.status})`);
        });

        console.log('\nDatabase seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
