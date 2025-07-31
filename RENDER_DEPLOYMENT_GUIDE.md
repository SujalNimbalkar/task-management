# Render Deployment Guide for RBAC Backend

## Prerequisites

1. **MongoDB Atlas Account**

   - Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster (free tier is sufficient)
   - Get your connection string

2. **Render Account**
   - Sign up at [Render](https://render.com)
   - Connect your GitHub repository

## Step 1: Clear Existing Task Data

Run the data clearing script to remove all existing task data:

```bash
cd backend
node clear-task-data.js
```

This will:

- Connect to your MongoDB database
- Delete all processes and tasks
- Delete all form submissions
- Verify data is cleared

## Step 2: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Cluster**

   - Go to MongoDB Atlas dashboard
   - Click "Build a Database"
   - Choose "FREE" tier
   - Select your preferred cloud provider and region
   - Click "Create"

2. **Configure Database Access**

   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a username and password
   - Select "Read and write to any database"
   - Click "Add User"

3. **Configure Network Access**

   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

4. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `rbac_system`

## Step 3: Deploy to Render

1. **Connect Repository**

   - Go to Render dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

2. **Configure Service**

   - **Name**: `rbac-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Environment Variables**
   Add these environment variables in Render:

   ```
   NODE_ENV=production
   USE_MONGODB=true
   PORT=10000
   CORS_ORIGIN=https://your-frontend-app.onrender.com
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rbac_system?retryWrites=true&w=majority
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your service URL (e.g., `https://rbac-backend.onrender.com`)

## Step 4: Test Task Triggers

After deployment, test the task trigger functionality:

### 1. Create a Test Process

```bash
curl -X POST https://your-backend-url.onrender.com/api/processes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Process",
    "description": "Test process for trigger verification",
    "category": "test",
    "tasks": [
      {
        "taskId": "test-task-1",
        "name": "Test Task",
        "description": "A test task",
        "assignedRole": "admin",
        "formId": "F-DAILY-PRODUCTION-ENTRY",
        "trigger": {
          "type": "time",
          "recurrence": "daily"
        },
        "status": "pending"
      }
    ]
  }'
```

### 2. Check Task Creation

```bash
curl https://your-backend-url.onrender.com/api/tasks
```

### 3. Test Form Submission

```bash
curl -X POST https://your-backend-url.onrender.com/api/tasks/test-task-1/submit \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "h1_plan": "8",
      "h2_plan": "8",
      "ot_plan": "2",
      "target_qty": "100"
    }
  }'
```

## Step 5: Monitor Logs

1. **In Render Dashboard**

   - Go to your service
   - Click "Logs" tab
   - Monitor for any errors

2. **Check Task Triggers**
   - Look for trigger execution logs
   - Verify task status updates
   - Check form submission processing

## Environment Variables Reference

| Variable      | Description                          | Required |
| ------------- | ------------------------------------ | -------- |
| `NODE_ENV`    | Environment (production/development) | Yes      |
| `USE_MONGODB` | Enable MongoDB (true/false)          | Yes      |
| `PORT`        | Server port                          | Yes      |
| `CORS_ORIGIN` | Frontend URL for CORS                | Yes      |
| `MONGODB_URI` | MongoDB Atlas connection string      | Yes      |

## Troubleshooting

### Common Issues

1. **Connection Timeout**

   - Check MongoDB Atlas network access
   - Verify connection string format
   - Ensure database user has correct permissions

2. **CORS Errors**

   - Update `CORS_ORIGIN` to match your frontend URL
   - Check frontend API calls use correct backend URL

3. **Task Triggers Not Working**
   - Check server logs for errors
   - Verify MongoDB connection
   - Test with simple trigger first

### Debug Commands

```bash
# Check if backend is running
curl https://your-backend-url.onrender.com/api/health

# Check database connection
curl https://your-backend-url.onrender.com/api/debug/db-status

# List all processes
curl https://your-backend-url.onrender.com/api/processes

# List all tasks
curl https://your-backend-url.onrender.com/api/tasks
```

## Security Considerations

1. **Environment Variables**

   - Never commit sensitive data to Git
   - Use Render's environment variable management
   - Rotate database passwords regularly

2. **MongoDB Atlas**

   - Use IP whitelisting in production
   - Enable MongoDB Atlas security features
   - Monitor database access logs

3. **API Security**
   - Implement authentication if needed
   - Use HTTPS in production
   - Validate all input data

## Next Steps

After successful deployment:

1. **Update Frontend**

   - Update API base URL to point to Render backend
   - Test all functionality

2. **Monitor Performance**

   - Set up monitoring for response times
   - Monitor database performance
   - Set up alerts for errors

3. **Scale if Needed**
   - Upgrade Render plan if needed
   - Optimize database queries
   - Implement caching strategies
