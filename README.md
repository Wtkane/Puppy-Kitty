# Puppy & Kitty 🐶🐱

A cute MERN stack web application for Wesley and Ella to share calendars, todo lists, goals, and special moments together. Built with love and lots of pet-themed cuteness!

## ✨ Features

- **📅 Shared Calendar** - Schedule and view events together with beautiful calendar interface
- **✅ Todo List** - Keep track of tasks and reminders with collaborative todo management
- **🎯 Goals** - Set and track personal and shared goals
- **💝 Special Dates** - Remember important anniversaries and special occasions
- **🔐 Authentication** - Secure login with JWT tokens and Google OAuth integration
- **🎨 Cute Design** - Pet-themed UI with hearts, animations, and fun elements
- **📱 Responsive** - Works beautifully on desktop and mobile devices
- **🔄 Real-time Updates** - See changes instantly (Socket.io ready for future enhancements)

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **React Router v6** - Client-side routing with future flags enabled
- **Axios** - HTTP client for API requests
- **CSS3** - Custom styling with animations and responsive design

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Tokens for authentication
- **Google OAuth 2.0** - Social authentication integration
- **CORS** - Cross-origin resource sharing enabled

### Development Tools
- **Concurrently** - Run multiple scripts simultaneously
- **Nodemon** - Auto-restart server during development
- **Dotenv** - Environment variable management

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Google OAuth credentials (for Google authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Wtkane/Puppy-Kitty.git
   cd Puppy-Kitty
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost/puppy-kitty
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=development
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

5. **Start MongoDB**
   - If using local MongoDB: `mongod`
   - Or update `MONGODB_URI` to point to your MongoDB Atlas cluster

6. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   Server will run on `http://localhost:5001`

7. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on `http://localhost:3000`

8. **Open your browser**
   Navigate to `http://localhost:3000` and enjoy your cute shared app! 💕

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/google/exchange` - Google OAuth token exchange

### Calendar
- `GET /api/calendar` - Get calendar events
- `POST /api/calendar` - Create new event
- `PUT /api/calendar/:id` - Update event
- `DELETE /api/calendar/:id` - Delete event

### Todos
- `GET /api/todos` - Get todo items
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

### Goals
- `GET /api/goals` - Get goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Special Dates
- `GET /api/special-dates` - Get special dates
- `POST /api/special-dates` - Create special date
- `PUT /api/special-dates/:id` - Update special date
- `DELETE /api/special-dates/:id` - Delete special date

## 🔧 Development

### Running in Development Mode
```bash
# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm start

# Both (if you have concurrently set up)
npm run dev
```

### Building for Production
```bash
# Frontend build
cd frontend && npm run build

# Backend is ready for production as-is
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and intended for personal use by Wesley and Ella.

## 💕 Made with Love

Built with ❤️ for the cutest couple! 🐶🐱
