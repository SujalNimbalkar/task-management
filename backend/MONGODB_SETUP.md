# MongoDB Setup Guide

This guide will help you set up MongoDB for your RBAC system with the ability to switch between local and production databases during development.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` file:

```env
# Environment Configuration
NODE_ENV=development

# Database Configuration
# Set to 'true' to use MongoDB, 'false' to use JSON files
USE_MONGODB=false

# Local MongoDB Configuration (for development)
MONGODB_LOCAL_URI=mongodb://localhost:27017/rbac_system

# Production MongoDB Configuration (for production)
# Uncomment and set your MongoDB Atlas or production MongoDB URI
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rbac_system?retryWrites=true&w=majority
```

## 📊 Database Options

### Option 1: Local MongoDB (Recommended for Development)

1. **Install MongoDB Community Edition:**

   - [Windows](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
   - [macOS](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)
   - [Linux](https://docs.mongodb.com/manual/administration/install-on-linux/)

2. **Start MongoDB:**

   ```bash
   # Windows
   net start MongoDB

   # macOS/Linux
   sudo systemctl start mongod
   # or
   brew services start mongodb-community
   ```

3. **Configure for local development:**
   ```env
   USE_MONGODB=true
   MONGODB_LOCAL_URI=mongodb://localhost:27017/rbac_system
   ```

### Option 2: MongoDB Atlas (Recommended for Production)

1. **Create MongoDB Atlas Account:**

   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account
   - Create a new cluster

2. **Get Connection String:**

   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

3. **Configure for production:**
   ```env
   NODE_ENV=production
   USE_MONGODB=true
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rbac_system?retryWrites=true&w=majority
   ```

## 🔄 Switching Between Databases

### Development Mode (JSON Files)

```env
USE_MONGODB=false
```

- Uses existing JSON files in `data/` directory
- No additional setup required
- Good for quick development and testing

### Development Mode (Local MongoDB)

```env
USE_MONGODB=true
MONGODB_LOCAL_URI=mongodb://localhost:27017/rbac_system
```

- Uses local MongoDB instance
- Better performance and scalability
- Good for development with real database features

### Production Mode (MongoDB Atlas)

```env
NODE_ENV=production
USE_MONGODB=true
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rbac_system?retryWrites=true&w=majority
```

- Uses MongoDB Atlas cloud database
- Scalable and reliable
- Good for production deployment

## 📦 Migration from JSON to MongoDB

### Step 1: Enable MongoDB

```env
USE_MONGODB=true
```

### Step 2: Run Migration Script

```bash
npm run migrate
```

### Step 3: Verify Migration

- Check MongoDB database for migrated data
- Test application functionality
- Verify all users, forms, and processes are migrated

### Step 4: Switch Permanently

Once migration is verified:

```env
USE_MONGODB=true
```

## 🗄️ Database Schema

### Users Collection

```javascript
{
  name: String,
  email: String (unique),
  phone: String,
  employeeId: String (unique),
  department: String,
  designation: String,
  roles: [String],
  isActive: Boolean,
  joinDate: Date,
  lastLogin: Date
}
```

### Form Definitions Collection

```javascript
{
  formId: String (unique),
  name: String,
  type: String,
  fields: [FieldSchema],
  tableFields: [TableFieldSchema],
  description: String,
  isActive: Boolean
}
```

### Form Submissions Collection

```javascript
{
  taskId: String,
  formId: String,
  submittedBy: ObjectId (ref: User),
  submittedAt: Date,
  formData: Mixed,
  status: String,
  comments: String,
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date
}
```

### Processes Collection

```javascript
{
  name: String,
  description: String,
  category: String,
  isActive: Boolean,
  tasks: [TaskSchema],
  createdBy: ObjectId (ref: User),
  version: Number
}
```

## 🔧 Troubleshooting

### Connection Issues

**Error: MongoDB connection failed**

```bash
# Check if MongoDB is running
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl status mongod
```

**Error: Authentication failed**

- Check username/password in connection string
- Verify database user has correct permissions

### Migration Issues

**Error: Migration failed**

```bash
# Check MongoDB connection
node -e "require('mongoose').connect('your-connection-string')"

# Verify JSON files exist
ls backend/data/
```

### Performance Issues

**Slow queries:**

- Add indexes to frequently queried fields
- Use MongoDB Compass to analyze query performance
- Consider database optimization

## 📝 Environment Variables Reference

| Variable            | Description                | Default                                 | Required         |
| ------------------- | -------------------------- | --------------------------------------- | ---------------- |
| `NODE_ENV`          | Environment mode           | `development`                           | No               |
| `USE_MONGODB`       | Enable MongoDB             | `false`                                 | No               |
| `MONGODB_LOCAL_URI` | Local MongoDB URI          | `mongodb://localhost:27017/rbac_system` | No               |
| `MONGODB_URI`       | Production MongoDB URI     | -                                       | Yes (production) |
| `MONGODB_ATLAS_URI` | Alternative production URI | -                                       | No               |
| `PORT`              | Server port                | `4000`                                  | No               |

## 🚀 Deployment

### Local Development

```bash
# Start with JSON files
USE_MONGODB=false npm run dev

# Start with local MongoDB
USE_MONGODB=true npm run dev
```

### Production Deployment

```bash
# Set production environment
NODE_ENV=production
USE_MONGODB=true
MONGODB_URI=your-production-mongodb-uri

# Start application
npm start
```

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [MongoDB Compass](https://www.mongodb.com/products/compass)

## 🤝 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify your environment variables
3. Check MongoDB connection logs
4. Review the migration script output

For additional help, check the application logs or MongoDB server logs.
