# Production Planning Task Management System

A task management system similar to Asana, specifically designed for production planning workflows with automated task triggers and dependencies.

## System Overview

This system implements a comprehensive production planning workflow that automatically creates and manages tasks based on time-based triggers and form submissions. The workflow follows this pattern:

### Workflow Structure

1. **Monthly Production Plan** (Triggered 3 days before end of month)

   - Form: Item Code, Item Name, Total Quantity
   - Assigned to: Production Manager

2. **Weekly Production Plans** (Triggered when monthly plan is completed)

   - 4 weekly plans are created automatically
   - Form: Week Number, Item Code, Item Name, Weekly Quantity
   - Assigned to: Production Manager

3. **Daily Production Plans** (Triggered when weekly plan is completed)

   - 5 daily plans per week (Monday-Friday)
   - Form: Date, Day of Week, Item Code, Item Name, Daily Quantity
   - Assigned to: Production Manager

4. **Daily Production Reports** (Triggered when daily plan is completed)

   - Form: Date, Department, Operator, Operation, Item Code, Item Name, Target Quantity, Actual Production
   - Assigned to: Department Operator

5. **Action Plans** (Triggered when production is below 85%)
   - Automatically triggered when actual production is less than 85% of target
   - Form: Date, Item Code, Item Name, Target Quantity, Actual Production, Achievement Percentage, Reason for Low Production, Corrective Actions, Target Completion Date
   - Assigned to: Production Manager

## Features

- **Automated Task Triggers**: Tasks are automatically created based on time schedules and form submissions
- **Conditional Logic**: Action plans are only triggered when production targets are not met
- **Form Management**: Dynamic forms with validation and data collection
- **Role-Based Access**: Different tasks assigned to different user roles
- **Dependency Management**: Tasks are properly sequenced with dependencies
- **Real-time Updates**: Task status updates in real-time

## User Roles

1. **Admin**: System administration
2. **Production Manager**: Manages production planning and action plans
3. **Department Operator**: Reports daily production data

## Technical Implementation

### Backend

- **Node.js/Express**: RESTful API
- **JSON Database**: Simple file-based storage
- **Cron Jobs**: Automated task scheduling
- **Form Validation**: Dynamic form validation
- **Task Triggers**: Event-driven task creation

### Frontend

- **React**: Modern UI framework
- **Dynamic Forms**: Auto-generated forms based on JSON schema
- **Real-time Updates**: Live task status updates
- **Responsive Design**: Works on desktop and mobile

## API Endpoints

- `GET /api/users` - Get all users
- `GET /api/tasks` - Get tasks for a user
- `POST /api/tasks/:id/complete` - Complete a task
- `POST /api/tasks/:id/update` - Update task status
- `POST /api/tasks/:id/submit-form` - Submit form data
- `GET /api/tasks/:id/form-submissions` - Get form submissions for a task
- `GET /api/tasks/form-submissions` - Get all form submissions for a user

## Getting Started

1. **Install Dependencies**

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd frontend
   npm install
   ```

2. **Start the Backend**

   ```bash
   cd backend
   npm start
   ```

3. **Start the Frontend**

   ```bash
   cd frontend
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## Workflow Example

1. **Month End**: System automatically creates "Monthly Production Plan" task
2. **Production Manager**: Fills out monthly plan with item details and quantities
3. **System**: Automatically creates 4 weekly production plan tasks
4. **Production Manager**: Completes weekly plans, dividing monthly quantities
5. **System**: Creates daily production plan tasks for each week
6. **Production Manager**: Completes daily plans with day-specific quantities
7. **System**: Creates daily production report tasks for operators
8. **Department Operator**: Reports actual production data
9. **System**: If production < 85%, automatically creates action plan task
10. **Production Manager**: Creates corrective action plan

## Configuration

The system is configured through JSON files:

- `backend/data/db.json`: Users, forms, and task definitions
- `backend/data/forms.json`: Form submission data

## Customization

To add new workflows or modify existing ones:

1. Update the forms in `db.json`
2. Add new tasks with appropriate triggers and dependencies
3. Update the trigger logic in `taskTriggers.js`
4. Modify the recurring tasks job if needed

## Monitoring

The system includes:

- Console logging for task triggers
- Form submission tracking
- Task completion history
- Performance monitoring through achievement percentages
