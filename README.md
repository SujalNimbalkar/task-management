# RBAC Task Management System

A comprehensive Role-Based Access Control (RBAC) task management system with dynamic forms, task triggers, and production planning capabilities.

## 🚀 Features

- **Dynamic Form System** - Create and manage custom forms with table layouts
- **Task Triggers** - Automated task creation with time-based and event-based triggers
- **Production Planning** - Daily, weekly, and monthly production planning and reporting
- **Role-Based Access** - User management with role-based permissions
- **MongoDB Integration** - Scalable database with MongoDB Atlas support
- **Render Deployment Ready** - Complete deployment configuration for cloud hosting

## 📁 Project Structure

```
RBAC2/
├── backend/                 # Node.js/Express backend
│   ├── src/                # Source code
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── clear-task-data.js  # Data clearing utility
│   ├── render.yaml         # Render deployment config
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── package.json        # Frontend dependencies
└── README.md               # This file
```

## 🛠️ Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (for production)
- Git

### Local Development

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd RBAC2
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your MongoDB URI
   npm start
   ```

3. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## 🚀 Deployment

### Render Deployment (Recommended)

1. **Set up MongoDB Atlas**

   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Get your connection string
   - Configure database access and network settings

2. **Deploy to Render**

   - Connect your GitHub repository to [Render](https://render.com)
   - Create a new Web Service
   - Use the provided `render.yaml` configuration
   - Set environment variables in Render dashboard

3. **Environment Variables**
   ```
   NODE_ENV=production
   USE_MONGODB=true
   PORT=10000
   CORS_ORIGIN=https://your-frontend-app.onrender.com
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rbac_system?retryWrites=true&w=majority
   ```

### Testing After Deployment

Run the test script to verify task triggers:

```bash
cd backend
BACKEND_URL=https://your-backend-url.onrender.com node test-triggers-after-deployment.js
```

## 📋 Key Features

### Task Management

- **Dynamic Forms** - Create custom forms with table layouts
- **Task Triggers** - Automated task creation (daily, weekly, monthly)
- **Status Tracking** - Track task completion and form submissions
- **Role-Based Access** - Assign tasks based on user roles

### Production Planning

- **Daily Production Reports** - Track daily production metrics
- **Weekly Production Plans** - Plan weekly production targets
- **Monthly Production Plans** - Long-term production planning
- **Quality Control** - Track defects and quality metrics

### Form System

- **Dynamic Fields** - Create forms with various field types
- **Table Layouts** - Support for complex table-based forms
- **Validation** - Built-in form validation
- **Mode Support** - Plan and report modes for different use cases

## 🔧 API Endpoints

### Processes

- `GET /api/processes` - List all processes
- `POST /api/processes` - Create a new process
- `PUT /api/processes/:id` - Update a process
- `DELETE /api/processes/:id` - Delete a process

### Tasks

- `GET /api/tasks` - List all tasks
- `POST /api/tasks/:id/submit` - Submit form data for a task
- `PUT /api/tasks/:id/status` - Update task status

### Forms

- `GET /api/forms` - List all form definitions
- `POST /api/forms` - Create a new form definition
- `GET /api/forms/:id/submissions` - Get form submissions

### Users

- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update user information

## 🗄️ Database Schema

### Process Model

- Process metadata (name, description, category)
- Array of tasks with triggers and due dates
- User assignments and status tracking

### Task Model

- Task information (name, description, assigned role)
- Trigger configuration (time-based, event-based)
- Form data and submission status
- Due date rules and completion tracking

### Form Model

- Form definitions with field configurations
- Dynamic field types (text, number, date, select)
- Table layout support for complex forms

## 🔒 Security

- **Environment Variables** - All sensitive data stored in environment variables
- **CORS Configuration** - Proper CORS setup for production
- **Input Validation** - Comprehensive form and API input validation
- **Role-Based Access** - User permissions based on roles

## 📚 Documentation

- [Render Deployment Guide](RENDER_DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Deployment Summary](DEPLOYMENT_SUMMARY.md) - Quick deployment reference
- [MongoDB Setup](backend/MONGODB_SETUP.md) - Database setup instructions
- [Firebase Setup](frontend/FIREBASE_SETUP.md) - Authentication setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:

1. Check the documentation files
2. Review the deployment guides
3. Check the test scripts for examples
4. Monitor Render logs for deployment issues

---

**Status**: ✅ Ready for production deployment
**Database**: ✅ MongoDB Atlas ready
**Deployment**: ✅ Render configuration complete
**Testing**: ✅ Comprehensive test scripts available
