# Backend Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [API Endpoints](#api-endpoints)
6. [Authentication](#authentication)
7. [Database Models](#database-models)
8. [Middleware](#middleware)
9. [Error Handling](#error-handling)
10. [Security Features](#security-features)
11. [How It Works](#how-it-works)

---

## Overview

This is a RESTful API backend built with Node.js, Express.js, and MongoDB. It provides a complete backend solution for a product management system with user authentication, CRUD operations, and role-based access control.

### Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

---

## Architecture

The backend follows a **MVC (Model-View-Controller)** architecture pattern:

```
Request → Routes → Middleware → Controller → Model → Database
                ↓
            Response ← Controller
```

### Flow Diagram

```
Client Request
    ↓
Express Server (server.js)
    ↓
Routes (routes/)
    ↓
Middleware (auth, validation)
    ↓
Controllers (controllers/)
    ↓
Models (models/)
    ↓
MongoDB Database
```

---

## Project Structure

```
backend/
├── controllers/          # Business logic handlers
│   ├── itemController.js
│   └── userController.js
├── models/              # Database schemas
│   ├── Item.js
│   └── User.js
├── routes/              # API route definitions
│   ├── itemRoutes.js
│   └── userRoutes.js
├── middleware/          # Custom middleware
│   ├── auth.js          # Authentication & authorization
│   ├── errorHandler.js  # Error handling
│   └── validator.js     # Validation helper
├── server.js            # Express app entry point
├── package.json         # Dependencies
├── .env.example         # Environment variables template
└── .gitignore          # Git ignore rules
```

---

## Setup & Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/figma-assignment
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
```

### Step 3: Start MongoDB

**Local MongoDB:**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**MongoDB Atlas (Cloud):**
- Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster
- Get connection string
- Update `MONGODB_URI` in `.env`

### Step 4: Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

---

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Items API

#### Get All Items
```http
GET /api/items
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 100)
- `productType` (optional) - Filter by product type
- `status` (optional) - Filter by status (published/unpublished)
- `search` (optional) - Search in product name, brand name, or type

**Example:**
```bash
GET /api/items?page=1&limit=10&productType=Electronics&search=laptop
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### Get Single Item
```http
GET /api/items/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "productName": "...",
    "productType": "...",
    ...
  }
}
```

#### Create Item (Protected)
```http
POST /api/items
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productName": "Laptop",
  "productType": "Electronics",
  "quantityStock": 50,
  "mrp": 50000,
  "sellingPrice": 45000,
  "brandName": "Dell",
  "exchangeEligibility": "Yes",
  "description": "High-performance laptop",
  "status": "published"
}
```

#### Update Item (Protected)
```http
PUT /api/items/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (same as create, all fields optional)

#### Delete Item (Protected)
```http
DELETE /api/items/:id
Authorization: Bearer <token>
```

---

### Users API

#### Register User
```http
POST /api/users/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "jwt-token-here"
  }
}
```

#### Login User
```http
POST /api/users/login
Content-Type: application/json
```

**Option 1: Password Login**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Option 2: OTP Login**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "token": "jwt-token-here"
  }
}
```

#### Get All Users (Admin Only)
```http
GET /api/users
Authorization: Bearer <token>
```

#### Get User by ID (Protected)
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Update User (Protected)
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### Delete User (Admin Only)
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

---

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

## Authentication

### JWT Token-Based Authentication

The backend uses JSON Web Tokens (JWT) for authentication. Tokens are generated upon successful login/registration and must be included in subsequent requests.

### How Authentication Works

1. **User Registration/Login:**
   - User provides credentials
   - Server validates credentials
   - Server generates JWT token
   - Token returned to client

2. **Protected Routes:**
   - Client includes token in `Authorization` header
   - Format: `Authorization: Bearer <token>`
   - Middleware verifies token
   - User attached to request object

### Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Expiration

- Default: 7 days
- Configured in `userController.js`

---

## Database Models

### User Model

```javascript
{
  name: String (required, max 100 chars)
  email: String (required, unique, validated)
  password: String (required, min 6 chars, hashed)
  role: String (enum: 'user' | 'admin', default: 'user')
  avatar: String (optional)
  isActive: Boolean (default: true)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Methods:**
- `comparePassword(candidatePassword)` - Compare password with hash

### Item Model

```javascript
{
  productName: String (required, max 200 chars)
  productType: String (enum: 'Foods' | 'Electronics' | 'Clothes' | 'Beauty Products' | 'Others')
  quantityStock: Number (required, min 0)
  mrp: Number (required, min 0)
  sellingPrice: Number (required, min 0)
  brandName: String (required, max 100 chars)
  images: [String] (array of image URLs)
  exchangeEligibility: String (enum: 'Yes' | 'No', default: 'Yes')
  description: String (optional, max 1000 chars)
  status: String (enum: 'published' | 'unpublished', default: 'unpublished')
  createdBy: ObjectId (reference to User)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- Text index on `productName` and `description`
- Index on `productType`
- Index on `status`
- Index on `createdAt`

---

## Middleware

### Authentication Middleware (`middleware/auth.js`)

#### `authenticate`
Verifies JWT token and attaches user to request.

```javascript
router.get('/protected', authenticate, controller.handler);
```

#### `optionalAuth`
Attaches user if token provided, but doesn't require it.

```javascript
router.get('/public', optionalAuth, controller.handler);
```

#### `authorize(...roles)`
Checks if user has required role(s).

```javascript
router.delete('/admin-only', authenticate, authorize('admin'), controller.handler);
```

### Error Handler Middleware (`middleware/errorHandler.js`)

#### `errorHandler`
Global error handler that provides consistent error responses.

#### `asyncHandler`
Wrapper for async route handlers to catch errors.

```javascript
exports.getItems = asyncHandler(async (req, res) => {
  // Your async code here
});
```

### Validator Middleware (`middleware/validator.js`)

#### `validate`
Checks express-validator results and returns errors if any.

```javascript
router.post('/items', itemValidation, validate, controller.createItem);
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": [...] // For validation errors
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Error Types Handled

- Validation errors
- Authentication errors
- Authorization errors
- Database errors (CastError, DuplicateKey, ValidationError)
- JWT errors (InvalidToken, ExpiredToken)

---

## Security Features

### 1. Password Hashing
- Passwords hashed using bcryptjs (10 rounds)
- Never stored in plain text
- Automatic hashing before save

### 2. JWT Authentication
- Secure token-based authentication
- Token expiration
- Token verification on protected routes

### 3. Input Validation
- All inputs validated using express-validator
- Prevents invalid data entry
- Sanitizes user input

### 4. CORS Protection
- Configured CORS for specific origins
- Prevents unauthorized cross-origin requests

### 5. Role-Based Access Control
- User roles (user, admin)
- Route-level authorization
- Resource-level permission checks

### 6. Error Information
- Detailed errors in development
- Generic errors in production
- No sensitive data exposure

---

## How It Works

### Request Flow

1. **Client sends request** → Express server receives it

2. **Middleware chain:**
   - CORS middleware processes request
   - Body parser extracts JSON data
   - Request logging (development only)

3. **Route matching:**
   - Express matches URL to route
   - Route handler executes

4. **Authentication (if protected):**
   - `authenticate` middleware verifies JWT token
   - Extracts user ID from token
   - Fetches user from database
   - Attaches user to `req.user`

5. **Authorization (if required):**
   - `authorize` middleware checks user role
   - Allows or denies access

6. **Validation:**
   - `express-validator` validates input
   - `validate` middleware checks results
   - Returns errors if validation fails

7. **Controller execution:**
   - Business logic executed
   - Database operations performed
   - Response prepared

8. **Response sent:**
   - JSON response sent to client
   - Status code included

### Database Operations

1. **Create:**
   - New document created with `new Model(data)`
   - Validation runs automatically
   - Password hashed (for User model)
   - Document saved to database

2. **Read:**
   - Query built with filters
   - Pagination applied
   - Population for references
   - Results returned

3. **Update:**
   - Document found by ID
   - Permission checked
   - Updates applied
   - Validation runs
   - Updated document returned

4. **Delete:**
   - Document found by ID
   - Permission checked
   - Document deleted
   - Confirmation returned

### Authentication Flow

```
User Login/Register
    ↓
Credentials Validated
    ↓
JWT Token Generated
    ↓
Token Sent to Client
    ↓
Client Stores Token
    ↓
Client Includes Token in Requests
    ↓
Middleware Verifies Token
    ↓
User Attached to Request
    ↓
Route Handler Executes
```

### Example: Creating an Item

```
1. Client sends POST /api/items with token
   ↓
2. authenticate middleware verifies token
   ↓
3. User attached to req.user
   ↓
4. itemValidation validates request body
   ↓
5. validate middleware checks validation results
   ↓
6. createItem controller executes:
   - Creates new Item with req.body
   - Attaches req.userId to createdBy
   - Saves to database
   - Populates createdBy field
   ↓
7. Response sent with created item
```

---

## Testing the API

### Using cURL

**Register User:**
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Create Item (with token):**
```bash
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "productName": "Laptop",
    "productType": "Electronics",
    "quantityStock": 50,
    "mrp": 50000,
    "sellingPrice": 45000,
    "brandName": "Dell"
  }'
```

### Using Postman

1. Import collection or create requests manually
2. Set base URL: `http://localhost:5000/api`
3. For protected routes, add header:
   - Key: `Authorization`
   - Value: `Bearer <your-token>`

---

## Production Considerations

1. **Environment Variables:**
   - Use strong JWT_SECRET
   - Use MongoDB Atlas for production
   - Set NODE_ENV=production

2. **Security:**
   - Enable HTTPS
   - Configure CORS properly
   - Add rate limiting
   - Implement request size limits

3. **Performance:**
   - Add caching (Redis)
   - Optimize database queries
   - Add database indexes
   - Use connection pooling

4. **Monitoring:**
   - Add logging (Winston, Morgan)
   - Set up error tracking (Sentry)
   - Monitor API performance

5. **Testing:**
   - Write unit tests
   - Write integration tests
   - Test authentication flows
   - Test error scenarios

---

## Troubleshooting

### MongoDB Connection Error
- Check MongoDB is running
- Verify MONGODB_URI in .env
- Check network connectivity

### JWT Token Errors
- Verify JWT_SECRET is set
- Check token format in Authorization header
- Ensure token hasn't expired

### Validation Errors
- Check request body format
- Verify all required fields present
- Check field types match schema

### Permission Errors
- Verify user is authenticated
- Check user role matches requirements
- Ensure user owns resource (for updates/deletes)

---

## Support

For issues or questions, refer to:
- Express.js documentation: https://expressjs.com/
- Mongoose documentation: https://mongoosejs.com/
- JWT documentation: https://jwt.io/

---

**Last Updated:** 2024
