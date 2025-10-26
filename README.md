# Personal Portfolio Website

This is my responsive **Personal Portfolio Website** built to serve as a professional online presence, showcasing my skills, projects, contact information and much more.

## 🛠️ Technologies Used

### **Backend**
- **Node.js**: JavaScript runtime for building fast, scalable server-side applications.
- **Express**: Minimal and flexible Node.js web application framework for creating APIs and handling HTTP requests.

### **Authentication & Security**
- **jsonwebtoken (JWT)**: For stateless authentication, allowing secure login and protected routes.
- **CORS (cors)**: Middleware to enable Cross-Origin Resource Sharing, allowing your frontend and backend to communicate across different domains/ports.

### **Database**
- **MongoDB**: NoSQL database for storing flexible, document-based data.
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB, providing schema-based solutions and easy data validation.

### **Frontend**
- **React**: JavaScript library for building user interfaces, especially single-page applications.
- **Vite**: Fast frontend build tool and development server, used for rapid development and hot module replacement.

### **Other Utilities**
- **dotenv**: Loads environment variables from a .env file, keeping sensitive data and configuration out of the codebase.
- **body-parser**: Middleware to parse incoming request bodies in JSON format.

### **Deployment**
- **Render**: Cloud platform for hosting both frontend and backend, making deployment and scaling easier.

### **Why these technologies?**
- **Express & Node.js**: Simple, efficient, and widely supported for REST APIs.
- **MongoDB & Mongoose**: Flexible data modeling, easy to scale, and integrates well with JavaScript.
- **JWT**: Secure, stateless authentication for modern web apps.
- **React & Vite**: Fast, modern frontend development with a great developer experience.
- **dotenv**: Keeps secrets/configuration out of source code.
- **CORS**: Required for frontend-backend communication in modern web apps.
- **Render**: Simplifies deployment and hosting for full-stack apps.

Let me know if you want a more detailed breakdown or info on the frontend stack!


Demo: [https://tiago-dias.onrender.com/](https://tiago-dias.onrender.com/)

## 🚀 Deployment on Render

### Prerequisites
- MongoDB Atlas account (free tier available)
- OpenRouter API key
- GitHub account

### Backend Deployment (Node.js API)

1. **Push to GitHub**
   ```bash
   git add -A
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create MongoDB Atlas Database**
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/database`)

3. **Deploy on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `portfolio-backend`
     - **Root Directory**: `server`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment Variables**:
       - `PORT` = `10000`
       - `MONGO_URI` = Your MongoDB Atlas connection string
       - `JWT_SECRET` = Any secure random string
       - `OPENROUTER_API_KEY` = Your OpenRouter API key
       - `NODE_ENV` = `production`

### Frontend Deployment (React/Vite)

1. **Deploy on Render**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure:
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`
     - **Environment Variables**:
       - `VITE_API_URL` = Your backend URL (e.g., `https://portfolio-backend.onrender.com/api`)

2. **Update CORS in Backend**
   - After deploying frontend, add your frontend URL to CORS whitelist in `server/index.js`

### Alternative: Using render.yaml (Automatic)

The repository includes a `render.yaml` file for automatic deployment:
- Push to GitHub
- Connect repository to Render
- Render will automatically detect and deploy both services
- Add environment variables in Render dashboard

## 📦 Local Development

### Backend Setup
```bash
cd server
npm install
# Create .env file (see server/.env.example)
npm start
```

### Frontend Setup
```bash
npm install
# Create .env file (see .env.example)
npm run dev
```

