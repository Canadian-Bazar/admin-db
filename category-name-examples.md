# Category Name Usage Examples

## Problem Fixed
The category name was not being returned in API responses. This has been fixed by improving the category lookup logic.

## How to Use Category Names

### 1. Create Product with Category Name
```bash
POST /api/v1/products
Content-Type: multipart/form-data

{
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone",
  "categoryName": "Electronics",
  "price": 99999
}
```

### 2. Create Service with Category Name
```bash
POST /api/v1/services
Content-Type: multipart/form-data

{
  "name": "Website Development",
  "description": "Professional website development",
  "categoryName": "Services",
  "duration": {
    "value": 30,
    "unit": "days"
  },
  "price": 50000
}
```

### 3. Mixed Usage (Category Name + Subcategory ID)
```bash
POST /api/v1/products
Content-Type: multipart/form-data

{
  "name": "Samsung Galaxy",
  "description": "Android smartphone",
  "categoryName": "Electronics",
  "subcategory": "64f8a1b2c3d4e5f6a7b8c9d1",
  "price": 89999
}
```

## Expected Response
The API will now return both `category` (ID) and `categoryName` (string) in the response:

```json
{
  "status": 201,
  "message": "Product created successfully",
  "data": {
    "product": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "iPhone 15 Pro",
      "category": "64f8a1b2c3d4e5f6a7b8c9d0",
      "categoryName": "Electronics",
      "subcategory": "64f8a1b2c3d4e5f6a7b8c9d1",
      "subcategoryName": "Smartphones",
      "price": 99999,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## Key Features
- ✅ Case-insensitive category name matching
- ✅ Automatic category ID lookup when using categoryName
- ✅ Both category ID and name stored in database
- ✅ Backward compatible with existing category ID usage
- ✅ Clear error messages if category name not found
- ✅ Works for both products and services

## Error Handling
If you provide a category name that doesn't exist:
```json
{
  "success": false,
  "code": 400,
  "message": "Category \"NonExistentCategory\" not found"
}
```
