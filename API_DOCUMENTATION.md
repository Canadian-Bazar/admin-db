# Product & Service Management API Documentation

This document provides comprehensive documentation for the Product and Service Management APIs built with Node.js, Express, and MongoDB.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Product APIs](#product-apis)
- [Service APIs](#service-apis)
- [Error Handling](#error-handling)
- [Postman Collection](#postman-collection)

## Overview

The API provides complete CRUD operations for managing products and services with advanced features like:
- Search and filtering
- Pagination
- Image uploads
- Category management (by ID or name)
- Price filtering
- Status management
- SEO optimization

### Category Management
You can specify categories using either:
- **Category ID**: `"category": "64f8a1b2c3d4e5f6a7b8c9d0"`
- **Category Name**: `"categoryName": "Electronics"`

The API will automatically look up the category by name if you provide `categoryName` instead of `category` ID. This makes it more user-friendly as you don't need to know the exact category ID.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication

All endpoints require authentication using Bearer token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Product APIs

### 1. Create Product
**POST** `/products`

Creates a new product with optional image uploads.

**Request Body (multipart/form-data):**

**Note:** `price` and `category` are now optional fields. You can use either `category` (ID) or `categoryName` (string).

```json
{
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone with advanced camera system",
  "shortDescription": "Latest iPhone with advanced features",
  "price": 99999, // Optional
  "originalPrice": 109999, // Optional
  "category": "64f8a1b2c3d4e5f6a7b8c9d0", // Optional - Category ID
  "categoryName": "Electronics", // Optional - Category Name (alternative to category ID)
  "subcategory": "64f8a1b2c3d4e5f6a7b8c9d1", // Optional - Subcategory ID
  "subcategoryName": "Smartphones", // Optional - Subcategory Name (alternative to subcategory ID)
  "stock": 50,
  "weight": 187,
  "dimensions": {
    "length": 14.67,
    "width": 7.15,
    "height": 0.83
  },
  "tags": ["smartphone", "apple", "mobile"],
  "features": ["5G", "Face ID", "Wireless Charging"],
  "specifications": [
    {"name": "Storage", "value": "128GB"},
    {"name": "RAM", "value": "8GB"}
  ],
  "isFeatured": true,
  "city": "Mumbai",
  "status": "published"
}
```

**Response:**
```json
{
  "status": 201,
  "message": "Product created successfully",
  "data": {
    "product": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "iPhone 15 Pro",
      "slug": "iphone-15-pro",
      "price": 99999,
      "discount": 9,
      "category": "64f8a1b2c3d4e5f6a7b8c9d0",
      "images": ["https://s3.amazonaws.com/bucket/image1.jpg"],
      "thumbnail": "https://s3.amazonaws.com/bucket/image1.jpg",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 2. Get All Products (Listing View)
**GET** `/products`

Retrieves products with filtering, pagination, and sorting options. Returns only essential fields for listing.

**Response Fields:**
- `_id`: Product ID
- `name`: Product name
- `category`: Category name
- `categoryId`: Category ID (MongoDB ObjectId)
- `status`: Active/Inactive status
- `created`: Creation date

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `search` (optional): Search term for name, description, or tags
- `isActive` (optional): Filter by active status (true/false)
- `isFeatured` (optional): Filter by featured status (true/false)
- `isInStock` (optional): Filter by stock availability (true/false)
- `category` (optional): Filter by category ID or "all"
- `subcategory` (optional): Filter by subcategory ID or "all"
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `city` (optional): Filter by city
- `sortBy` (optional): Sort field (name, price, rating, createdAt)
- `sortOrder` (optional): Sort order (asc, desc)

**Example Request:**
```
GET /products?page=1&limit=10&isActive=true&isFeatured=true&minPrice=1000&maxPrice=100000&sortBy=price&sortOrder=desc
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "docs": [...],
    "totalDocs": 150,
    "limit": 10,
    "page": 1,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null,
    "pagingCounter": 1
  }
}
```

### 3. Get Product Info (Detailed View)
**GET** `/products/:productId/info`

Retrieves detailed information about a specific product with all fields.

**Response:** Complete product object with all fields including:
- Basic info: name, description, price, etc.
- Category: category ID and categoryName
- Media: images, thumbnail
- Inventory: stock, SKU
- Metadata: tags, features, specifications
- Reviews: rating, reviews array
- SEO: seoTitle, seoDescription, seoKeywords

### 4. Search Products
**GET** `/products/search`

Performs text search on products.

**Query Parameters:**
- `q` (required): Search query
- `category` (optional): Filter by category ID
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `limit` (optional): Maximum results (default: 10, max: 50)

**Example Request:**
```
GET /products/search?q=iPhone&category=64f8a1b2c3d4e5f6a7b8c9d0&minPrice=50000&maxPrice=150000&limit=10
```

### 5. Toggle Product Status
**PATCH** `/products/:productId/status`

Toggles the active/inactive status of a product.

**Request Body:**
```json
{
  "isActive": false
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Product deactivated successfully",
  "data": {
    "product": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "iPhone 15 Pro",
      "isActive": false
    }
  }
}
```

## Service APIs

### 1. Create Service
**POST** `/services`

Creates a new service with optional image uploads.

**Request Body (multipart/form-data):**
```json
{
  "name": "Website Development",
  "description": "Complete website development service",
  "shortDescription": "Professional website development",
  "price": 50000,
  "originalPrice": 60000,
  "category": "64f8a1b2c3d4e5f6a7b8c9d0", // Optional - Category ID
  "categoryName": "Services", // Optional - Category Name (alternative to category ID)
  "duration": {
    "value": 30,
    "unit": "days"
  },
  "serviceType": "one-time",
  "maxBookings": 5,
  "tags": ["web development", "design", "programming"],
  "requirements": ["Project requirements document", "Design mockups"],
  "deliverables": ["Responsive website", "Admin panel"],
  "features": ["Mobile responsive", "Fast loading"],
  "isFeatured": true,
  "city": "Mumbai",
  "status": "published"
}
```

### 2. Get All Services (Listing View)
**GET** `/services`

Retrieves services with filtering, pagination, and sorting options. Returns only essential fields for listing.

**Response Fields:**
- `_id`: Service ID
- `name`: Service name
- `category`: Category name
- `categoryId`: Category ID (MongoDB ObjectId)
- `status`: Active/Inactive status
- `created`: Creation date

**Query Parameters:** Similar to products, plus:
- `isAvailable` (optional): Filter by availability (true/false)
- `serviceType` (optional): Filter by service type (one-time, recurring, subscription)

### 3. Get Service Info (Detailed View)
**GET** `/services/:serviceId/info`

Retrieves detailed information about a specific service with all fields.

**Response:** Complete service object with all fields including:
- Basic info: name, description, price, etc.
- Category: category ID and categoryName
- Service details: duration, serviceType, recurringInterval
- Media: images, thumbnail
- Requirements: requirements, deliverables
- Availability: availability array, bookingLimits
- Reviews: rating, reviews array
- SEO: seoTitle, seoDescription, seoKeywords

### 4. Search Services
**GET** `/services/search`

Performs text search on services.

**Query Parameters:**
- `q` (required): Search query
- `category` (optional): Filter by category ID
- `serviceType` (optional): Filter by service type
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `limit` (optional): Maximum results (default: 10, max: 50)

### 5. Toggle Service Status
**PATCH** `/services/:serviceId/status`

Toggles the active/inactive status of a service.

**Request Body:**
```json
{
  "isActive": false
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Service deactivated successfully",
  "data": {
    "service": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "name": "Website Development",
      "isActive": false
    }
  }
}
```

## Error Handling

The API uses standard HTTP status codes and returns consistent error responses:

**Error Response Format:**
```json
{
  "status": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "name",
      "message": "Product name is required"
    }
  ]
}
```

**Common Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Postman Collection

A complete Postman collection is provided in `postman-collection.json` with:
- All API endpoints
- Sample requests with proper data
- Environment variables
- Test scripts for automatic variable extraction
- Authentication setup

### Import Instructions:
1. Open Postman
2. Click "Import" button
3. Select the `postman-collection.json` file
4. Set up environment variables:
   - `baseUrl`: Your API base URL
   - `authToken`: Your authentication token
   - `productId`: Will be set automatically after creating a product
   - `serviceId`: Will be set automatically after creating a service
   - `categoryId`: Will be set automatically after creating a category

### Testing Workflow:
1. First, create a category
2. Create products and services using the category ID
3. Test all CRUD operations
4. Test search and filtering functionality
5. Test activation/deactivation

## Database Schema

### Product Schema
- Basic info: name, slug, description, price
- Category: category, subcategory references
- Media: images array, thumbnail
- Inventory: stock, isInStock, SKU
- Physical: weight, dimensions
- Metadata: tags, features, specifications
- Status: isActive, isFeatured, status
- SEO: seoTitle, seoDescription, seoKeywords
- Location: city
- Reviews: rating, reviews array

### Service Schema
- Basic info: name, slug, description, price
- Category: category, subcategory references
- Service specific: duration, serviceType, recurringInterval
- Availability: isAvailable, maxBookings, currentBookings
- Requirements: requirements, deliverables arrays
- Metadata: tags, features
- Status: isActive, isFeatured, status
- Schedule: availability object for each day
- SEO: seoTitle, seoDescription, seoKeywords
- Location: city
- Reviews: rating, reviews array

## Features

### Advanced Search
- Full-text search across name, description, and tags
- Category and subcategory filtering
- Price range filtering
- Status and availability filtering
- Sorting by multiple fields

### Image Management
- Multiple image uploads per product/service
- Automatic thumbnail generation
- AWS S3 integration for storage

### SEO Optimization
- Custom SEO titles and descriptions
- Keyword management
- URL-friendly slugs

### Inventory Management
- Stock tracking for products
- Booking limits for services
- Availability management

### Review System
- Rating and review functionality
- Average rating calculation
- User review tracking

## API Endpoints Summary

### Products
- `POST /api/v1/products` - Create product
- `GET /api/v1/products` - Get all products (with filters)
- `GET /api/v1/products/search` - Search products
- `PATCH /api/v1/products/:id/status` - Toggle product status (active/inactive)

### Services
- `POST /api/v1/services` - Create service
- `GET /api/v1/services` - Get all services (with filters)
- `GET /api/v1/services/search` - Search services
- `PATCH /api/v1/services/:id/status` - Toggle service status (active/inactive)

This API provides a complete solution for managing products and services with enterprise-level features and scalability.
