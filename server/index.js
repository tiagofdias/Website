const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Middleware setup
app.use(cors({
  origin: '*',  // More permissive for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json());

const SECRET = process.env.JWT_SECRET;

// Dummy user for login
const USER = { 
  username: process.env.ADMIN_USERNAME, 
  password: process.env.ADMIN_PASSWORD 
};

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USER.username && password === USER.password) {
    const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Middleware to protect routes
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

const { Project, Certification, ProExp, Education, Article, About } = require('./models');

//Projects CRUD
app.get('/api/projects', async (req, res) => {
  const projects = await Project.find().sort({ order: 1, _id: 1 }); // sort by order, then _id
  res.json(projects);
});
app.post('/api/projects', auth, async (req, res) => {
  const project = new Project(req.body);
  await project.save();
  res.json(project);
});
app.put('/api/projects/:id', auth, async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(project);
});
app.delete('/api/projects/:id', auth, async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


app.get('/api/certifications', async (req, res) => {
  const certifications = await Certification.find().sort({ order: 1, _id: 1 });
  res.json(certifications);
});
app.post('/api/certifications', auth, async (req, res) => {
  const cert = new Certification(req.body);
  await cert.save();
  res.json(cert);
});
app.put('/api/certifications/:id', auth, async (req, res) => {
  const cert = await Certification.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(cert);
});
app.delete('/api/certifications/:id', auth, async (req, res) => {
  await Certification.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// --- ProExp CRUD ---
app.get('/api/proexp', async (req, res) => {
  const proexp = await ProExp.find().sort({ order: 1, _id: 1 });
  res.json(proexp);
});
app.post('/api/proexp', auth, async (req, res) => {
  const exp = new ProExp(req.body);
  await exp.save();
  res.json(exp);
});
app.put('/api/proexp/:id', auth, async (req, res) => {
  const exp = await ProExp.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(exp);
});
app.delete('/api/proexp/:id', auth, async (req, res) => {
  await ProExp.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// --- Education CRUD ---
app.get('/api/education', async (req, res) => {
  const education = await Education.find().sort({ order: 1, _id: 1 });
  res.json(education);
});
app.post('/api/education', auth, async (req, res) => {
  const edu = new Education(req.body);
  await edu.save();
  res.json(edu);
});
app.put('/api/education/:id', auth, async (req, res) => {
  const edu = await Education.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(edu);
});
app.delete('/api/education/:id', auth, async (req, res) => {
  await Education.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// --- Articles CRUD ---
app.get('/api/articles', async (req, res) => {
  const articles = await Article.find().sort({ order: 1, _id: 1 });
  res.json(articles);
});
app.post('/api/articles', async (req, res) => {
  try {
    const article = new Article(req.body);
    await article.save();
    res.json(article);
  } catch (err) {
    console.error("Error saving article:", err);
    res.status(500).json({ error: "Failed to save article" });
  }
});
app.put('/api/articles/:id', auth, async (req, res) => {
  const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(article);
});
app.delete('/api/articles/:id', auth, async (req, res) => {
  await Article.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// --- About CRUD ---
// Get all About docs (usually just one)
app.get('/api/about', async (req, res) => {
  const abouts = await About.find();
  res.json(abouts);
});

// Create About doc
app.post('/api/about', auth, async (req, res) => {
  const about = new About(req.body);
  await about.save();
  res.json(about);
});

// Update About doc
app.put('/api/about/:id', auth, async (req, res) => {
  const about = await About.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(about);
});

// Delete About doc
app.delete('/api/about/:id', auth, async (req, res) => {
  await About.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Add this before your route definitions
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Setup static serving
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Serve index.html for any non-API routes
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// MongoDB connection and server start
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('MongoDB connected');
  const PORT = process.env.PORT || 10000;  // Change default port to 10000
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})
.catch(err => console.error('MongoDB connection error:', err));

// Example fetch configuration to use in your components
const fetchConfig = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  credentials: 'include'
};

// Add this after your route definitions
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});