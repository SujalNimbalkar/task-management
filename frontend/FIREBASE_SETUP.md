# Firebase Authentication Setup

This guide will help you set up Firebase Authentication for the login system.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "rbac-task-management")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"

## Step 3: Get Your Firebase Configuration

1. In your Firebase project console, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to the "Your apps" section
4. Click the web icon (</>) to add a web app
5. Register your app with a nickname (e.g., "RBAC Frontend")
6. Copy the Firebase configuration object

## Step 4: Update Firebase Configuration

1. Open `frontend/src/services/firebase.js`
2. Replace the placeholder configuration with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};
```

## Step 5: Test the Authentication

1. Start the frontend development server:

   ```bash
   cd frontend
   npm start
   ```

2. Navigate to `http://localhost:3000`
3. You should see the login page
4. Try creating a new account or signing in

## Features Included

- **Email/Password Authentication**: Users can sign up and sign in with email and password
- **Password Reset**: Users can reset their password via email
- **User Profile**: Display user information and logout functionality
- **Protected Routes**: Only authenticated users can access the main application
- **Responsive Design**: Works on desktop and mobile devices

## Security Notes

- Firebase handles all authentication securely
- Passwords are hashed and stored securely by Firebase
- Email verification can be enabled in Firebase Console
- Additional authentication methods (Google, Facebook, etc.) can be added in Firebase Console

## Troubleshooting

1. **"Firebase: Error (auth/invalid-api-key)"**: Check that your Firebase config is correct
2. **"Firebase: Error (auth/operation-not-allowed)"**: Make sure Email/Password authentication is enabled in Firebase Console
3. **"Firebase: Error (auth/user-not-found)"**: The user doesn't exist, try signing up first

## Additional Configuration

### Email Verification (Optional)

1. In Firebase Console, go to Authentication > Sign-in method
2. Click on "Email/Password"
3. Enable "Email link (passwordless sign-in)" if desired
4. Configure email templates in Authentication > Templates

### Custom Domain (Optional)

1. In Firebase Console, go to Authentication > Settings
2. Add your custom domain to the authorized domains list

### Security Rules (Optional)

1. In Firebase Console, go to Firestore Database > Rules
2. Configure security rules to protect your data

## Support

If you encounter any issues:

1. Check the Firebase Console for error messages
2. Check the browser console for JavaScript errors
3. Verify your Firebase configuration is correct
4. Ensure all required dependencies are installed
