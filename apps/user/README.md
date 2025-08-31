# User Service - Message System

This is the User service for the Message System, implementing authentication and user management functionality.

## Features

### Authentication Module (JWT-based)
- **User Registration**: Create new user accounts with email/password
- **User Login**: Authenticate users and issue JWT tokens
- **Token Refresh**: Refresh expired JWT tokens
- **Password Security**: Passwords are hashed using bcryptjs

### User Management Module
- **User Profile**: Get and update user profile information
- **User Entity**: Complete user data model with TypeORM
- **Account Management**: Deactivate accounts, verify emails
- **Data Validation**: Input validation using class-validator

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token

### User Management Endpoints
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `DELETE /api/users/profile` - Deactivate user account
- `PUT /api/users/verify-email` - Verify user email (simplified)

### Application Endpoints
- `GET /api/` - Application status
- `GET /api/health` - Health check
- `GET /api/docs` - Swagger API documentation

## User Entity

The User entity includes the following fields:
- `id`: UUID primary key
- `email`: Unique email address
- `password`: Hashed password (excluded from responses)
- `firstName`: User's first name
- `lastName`: User's last name
- `phone`: Optional phone number
- `isActive`: Account active status
- `isEmailVerified`: Email verification status
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: All inputs are validated using DTOs
- **Data Serialization**: Sensitive data (passwords) are excluded from responses
- **Guards**: Passport-based authentication guards
- **CORS**: Cross-origin resource sharing enabled

## Configuration

The service uses the following environment variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=message_system_user

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=development
PORT=3001
```

## Running the Service

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Update the database and JWT configurations

3. **Start the database**:
   - Ensure PostgreSQL is running
   - Create the database specified in `DB_DATABASE`

4. **Build the service**:
   ```bash
   nx build user
   ```

5. **Run the service**:
   ```bash
   nx serve user
   ```

6. **Run tests**:
   ```bash
   nx test user
   ```

## API Documentation

Once the service is running, you can access the Swagger API documentation at:
`http://localhost:3001/api/docs`

## Dependencies

- **NestJS**: Progressive Node.js framework
- **TypeORM**: Object-relational mapping
- **PostgreSQL**: Database
- **JWT**: JSON Web Tokens for authentication
- **Passport**: Authentication middleware
- **bcryptjs**: Password hashing
- **class-validator**: Input validation
- **Swagger**: API documentation

## Testing

The service includes comprehensive unit tests for:
- User service operations
- Authentication service functionality
- Password validation
- Token generation
- Error handling

## Architecture

The service follows NestJS best practices with:
- **Modular structure**: Separate auth and user modules
- **Dependency injection**: Clean separation of concerns
- **DTOs**: Data transfer objects for type safety
- **Guards**: Authentication and authorization
- **Interceptors**: Global response transformation
- **Exception filters**: Proper error handling

## Future Enhancements

- Email verification with actual email sending
- Password reset functionality
- Account lockout after failed attempts
- Two-factor authentication
- Role-based access control
- User activity logging
