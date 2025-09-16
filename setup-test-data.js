import mongoose from 'mongoose'
import Category from './api/models/category.schema.js'
import Product from './api/models/product.schema.js'
import Service from './api/models/service.schema.js'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/admin-db')
        console.log('MongoDB connected successfully')
    } catch (error) {
        console.error('MongoDB connection error:', error)
        process.exit(1)
    }
}

const createTestData = async () => {
    try {
        // Create test categories
        const electronicsCategory = await Category.create({
            name: 'Electronics',
            slug: 'electronics',
            description: 'Electronic products and gadgets',
            isActive: true,
            city: 'Mumbai'
        })

        const servicesCategory = await Category.create({
            name: 'Services',
            slug: 'services',
            description: 'Professional services',
            isActive: true,
            city: 'Mumbai'
        })

        console.log('Categories created:', { electronicsCategory: electronicsCategory._id, servicesCategory: servicesCategory._id })

        // Create test products
        const testProducts = [
            {
                name: 'iPhone 15 Pro',
                slug: 'iphone-15-pro',
                description: 'Latest iPhone with advanced camera system and A17 Pro chip',
                shortDescription: 'Latest iPhone with advanced features',
                price: 99999,
                originalPrice: 109999,
                category: electronicsCategory._id,
                images: ['https://example.com/iphone1.jpg', 'https://example.com/iphone2.jpg'],
                thumbnail: 'https://example.com/iphone1.jpg',
                sku: 'IPH15P-001',
                stock: 50,
                isInStock: true,
                weight: 187,
                dimensions: { length: 14.67, width: 7.15, height: 0.83 },
                tags: ['smartphone', 'apple', 'mobile'],
                features: ['5G', 'Face ID', 'Wireless Charging'],
                specifications: [
                    { name: 'Storage', value: '128GB' },
                    { name: 'RAM', value: '8GB' },
                    { name: 'Display', value: '6.1 inch Super Retina XDR' }
                ],
                isActive: true,
                isFeatured: true,
                city: 'Mumbai',
                status: 'published'
            },
            {
                name: 'Samsung Galaxy S24',
                slug: 'samsung-galaxy-s24',
                description: 'Samsung flagship smartphone with AI features',
                shortDescription: 'Samsung flagship with AI',
                price: 89999,
                originalPrice: 99999,
                category: electronicsCategory._id,
                images: ['https://example.com/galaxy1.jpg'],
                thumbnail: 'https://example.com/galaxy1.jpg',
                sku: 'SGS24-001',
                stock: 30,
                isInStock: true,
                weight: 168,
                dimensions: { length: 14.7, width: 7.0, height: 0.76 },
                tags: ['smartphone', 'samsung', 'android'],
                features: ['AI Camera', '5G', 'Wireless Charging'],
                specifications: [
                    { name: 'Storage', value: '256GB' },
                    { name: 'RAM', value: '12GB' },
                    { name: 'Display', value: '6.2 inch Dynamic AMOLED' }
                ],
                isActive: true,
                isFeatured: false,
                city: 'Mumbai',
                status: 'published'
            }
        ]

        const createdProducts = await Product.create(testProducts)
        console.log('Products created:', createdProducts.map(p => ({ id: p._id, name: p.name })))

        // Create test services
        const testServices = [
            {
                name: 'Website Development',
                slug: 'website-development',
                description: 'Complete website development service including design, development, and deployment',
                shortDescription: 'Professional website development service',
                price: 50000,
                originalPrice: 60000,
                category: servicesCategory._id,
                images: ['https://example.com/webdev1.jpg'],
                thumbnail: 'https://example.com/webdev1.jpg',
                duration: { value: 30, unit: 'days' },
                serviceType: 'one-time',
                isAvailable: true,
                maxBookings: 5,
                currentBookings: 0,
                tags: ['web development', 'design', 'programming'],
                requirements: ['Project requirements document', 'Design mockups', 'Content ready'],
                deliverables: ['Responsive website', 'Admin panel', 'SEO optimization'],
                features: ['Mobile responsive', 'Fast loading', 'SEO friendly'],
                isActive: true,
                isFeatured: true,
                city: 'Mumbai',
                status: 'published',
                availability: {
                    monday: { start: '09:00', end: '18:00', isAvailable: true },
                    tuesday: { start: '09:00', end: '18:00', isAvailable: true },
                    wednesday: { start: '09:00', end: '18:00', isAvailable: true },
                    thursday: { start: '09:00', end: '18:00', isAvailable: true },
                    friday: { start: '09:00', end: '18:00', isAvailable: true },
                    saturday: { start: '10:00', end: '16:00', isAvailable: true },
                    sunday: { start: '10:00', end: '16:00', isAvailable: false }
                }
            },
            {
                name: 'Mobile App Development',
                slug: 'mobile-app-development',
                description: 'Native and cross-platform mobile app development service',
                shortDescription: 'Professional mobile app development',
                price: 80000,
                originalPrice: 90000,
                category: servicesCategory._id,
                images: ['https://example.com/mobileapp1.jpg'],
                thumbnail: 'https://example.com/mobileapp1.jpg',
                duration: { value: 60, unit: 'days' },
                serviceType: 'one-time',
                isAvailable: true,
                maxBookings: 3,
                currentBookings: 1,
                tags: ['mobile development', 'app', 'programming'],
                requirements: ['App requirements', 'Design mockups', 'API documentation'],
                deliverables: ['iOS App', 'Android App', 'Admin Dashboard'],
                features: ['Cross-platform', 'Native performance', 'Push notifications'],
                isActive: true,
                isFeatured: false,
                city: 'Mumbai',
                status: 'published',
                availability: {
                    monday: { start: '09:00', end: '18:00', isAvailable: true },
                    tuesday: { start: '09:00', end: '18:00', isAvailable: true },
                    wednesday: { start: '09:00', end: '18:00', isAvailable: true },
                    thursday: { start: '09:00', end: '18:00', isAvailable: true },
                    friday: { start: '09:00', end: '18:00', isAvailable: true },
                    saturday: { start: '10:00', end: '16:00', isAvailable: true },
                    sunday: { start: '10:00', end: '16:00', isAvailable: false }
                }
            }
        ]

        const createdServices = await Service.create(testServices)
        console.log('Services created:', createdServices.map(s => ({ id: s._id, name: s.name })))

        console.log('\n✅ Test data created successfully!')
        console.log('\n📋 Test Data Summary:')
        console.log(`Categories: ${electronicsCategory.name} (${electronicsCategory._id}), ${servicesCategory.name} (${servicesCategory._id})`)
        console.log(`Products: ${createdProducts.length} created`)
        console.log(`Services: ${createdServices.length} created`)
        console.log('\n🚀 You can now test the APIs using the Postman collection!')

    } catch (error) {
        console.error('Error creating test data:', error)
    }
}

const main = async () => {
    await connectDB()
    await createTestData()
    process.exit(0)
}

main()
