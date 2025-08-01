# CareerNest Backend

A Node.js/Express backend for the CareerNest job portal application.

## Architecture

```
backend/
├── app.js                 # Main application entry point
├── config/
│   └── database.js        # Database connection configuration
├── middleware/
│   ├── index.js          # Global middleware setup
│   └── errorHandler.js   # Error handling middleware
├── models/
│   ├── User.js           # User model (students & recruiters)
│   ├── Job.js            # Job/Internship model
│   ├── Application.js    # Job application model
│   └── Internship.js     # Legacy internship model
├── routes/
│   ├── index.js          # Main routes (health, root)
│   ├── userroutes.js     # User authentication routes
│   ├── jobRoutes.js      # Job/Internship CRUD routes
│   ├── applicationRoutes.js # Application management routes
│   ├── googleAuth.js     # Google OAuth authentication
│   ├── otpAuth.js        # OTP-based authentication
│   └── seed.js           # Database seeding routes
└── controllers/          # (Future: business logic)
```

## Features

- **Clean Architecture**: Separation of concerns with dedicated files for routes, middleware, models, and configuration
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Database Integration**: MongoDB with Mongoose ODM
- **Authentication**: Multiple auth methods (email/password, Google OAuth, OTP)
- **CORS Configuration**: Properly configured for frontend integration
- **Validation**: MongoDB schema validation with proper error responses
- **Backward Compatibility**: Legacy routes maintained during migration

## API Endpoints

### Core Routes

- `GET /api/` - API information
- `GET /api/health` - Health check

### User Routes

- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login

### Job Routes

- `GET /api/jobs` - Get all jobs/internships
- `GET /api/jobs/:id` - Get specific job
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Application Routes

- `GET /api/applications` - Get applications
- `POST /api/applications` - Submit application
- `PATCH /api/applications/:id/status` - Update application status
- `GET /api/applications/job/:jobId` - Get applications for a job
- `GET /api/applications/applicant/:email` - Get applications by user

### Authentication Routes

- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/student/register` - Student registration
- `POST /api/auth/recruiter/register` - Recruiter registration
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/careernest
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Usage

1. Install dependencies: `npm install`
2. Set up environment variables
3. Start the server: `npm start`
4. The API will be available at `http://localhost:5000`

## Migration Notes

- Legacy routes are maintained for backward compatibility
- The Internship model is deprecated in favor of the Job model with `job_type` field
- All routes now use proper error handling middleware
- CORS is properly configured for the frontend application
