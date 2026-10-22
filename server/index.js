// Node 18 WebCrypto Polyfill for @simplewebauthn/server
if (!globalThis.crypto) {
  globalThis.crypto = require('crypto').webcrypto;
}

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
const fetch = require('node-fetch');
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const { PasskeyCredential } = require('./models');
const { extractImagesFromPdfLinks } = require('./pdfExtractor');
const healthMonitor = require('./healthMonitor');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Add global error handlers to catch uncaught errors
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const app = express();

// Trust proxy to get real IP addresses
app.set('trust proxy', true);

// Middleware setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://tiago-dias.onrender.com'  // Production URL
    : 'http://localhost:5173', // Development URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Increase payload limit to handle base64 images (default is 100kb)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json({ limit: '50mb' })); // Add express built-in JSON parser as backup

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

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

// Passkey configuration
const rpName = 'Admin Panel';
const rpID = process.env.NODE_ENV === 'production' ? 'tiago-dias.onrender.com' : 'localhost';
const origin = process.env.NODE_ENV === 'production' ? `https://${rpID}` : `http://${rpID}:5173`;

// Store challenges in memory (works for single admin setup)
let currentRegistrationChallenge;
let currentAuthenticationChallenge;

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

// WebAuthn Registration (Requires Auth since only admin should register their key)
app.get('/api/webauthn/generate-registration-options', auth, async (req, res) => {
  try {
    const user = {
      id: 'admin-user-id',
      username: USER.username,
    };

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(user.id),
      userName: user.username,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
        authenticatorAttachment: 'cross-platform',
      },
    });

    currentRegistrationChallenge = options.challenge;
    res.json(options);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate registration options' });
  }
});

app.post('/api/webauthn/verify-registration', auth, async (req, res) => {
  const body = req.body;
  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: currentRegistrationChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

      // Store credentialID directly (it is already Base64URL string in v10)
      const newCred = new PasskeyCredential({
        credentialID: credentialID,
        credentialPublicKey: Buffer.from(credentialPublicKey),
        counter,
        transports: body.response.transports || [],
      });
      await newCred.save();

      res.json({ verified: true });
    } else {
      res.status(400).json({ error: 'Verification failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Authentication
app.get('/api/webauthn/generate-authentication-options', async (req, res) => {
  try {
    const credentials = await PasskeyCredential.find();
    if (credentials.length === 0) {
      return res.status(400).json({ error: 'No passkeys registered' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map(cred => ({
        id: cred.credentialID,
        type: 'public-key',
        transports: cred.transports,
      })),
      userVerification: 'preferred',
    });

    currentAuthenticationChallenge = options.challenge;
    res.json(options);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate auth options' });
  }
});

app.post('/api/webauthn/verify-authentication', async (req, res) => {
  const body = req.body;
  try {
    const cred = await PasskeyCredential.findOne({ credentialID: body.id });
    if (!cred) {
      return res.status(400).json({ error: 'Passkey not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: currentAuthenticationChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: cred.credentialPublicKey,
        credentialID: cred.credentialID,
        counter: cred.counter,
        transports: cred.transports,
      },
    });

    if (verification.verified) {
      // Update counter
      cred.counter = verification.authenticationInfo.newCounter;
      await cred.save();

      // Issue JWT
      const token = jwt.sign({ username: USER.username }, SECRET, { expiresIn: '1h' });
      res.json({ verified: true, token });
    } else {
      res.status(400).json({ error: 'Verification failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/ping', (req, res) => {
  healthMonitor.updatePing();
  res.json({ message: 'pong' });
});

// Helper function to download images from Google Drive and convert to base64
async function downloadImagesFromDriveLinks(driveLinks) {
  if (!driveLinks || driveLinks.length === 0) {
    return [];
  }
  
  console.log(`\n🖼️  Processing ${driveLinks.length} Google Drive image link(s)...`);
  
  const images = [];
  
  for (let i = 0; i < driveLinks.length; i++) {
    const driveUrl = driveLinks[i];
    
    if (!driveUrl || !driveUrl.trim()) {
      console.log(`  [${i + 1}/${driveLinks.length}] ⏭️  Skipped: Empty URL`);
      continue;
    }
    
    console.log(`\n  [${i + 1}/${driveLinks.length}] Processing image...`);
    
    try {
      // Extract file ID from Google Drive URL
      let fileId = null;
      if (driveUrl.includes('/file/d/')) {
        const match = driveUrl.match(/\/file\/d\/([^/]+)/);
        fileId = match ? match[1] : null;
      } else if (driveUrl.includes('id=')) {
        const match = driveUrl.match(/id=([^&]+)/);
        fileId = match ? match[1] : null;
      }
      
      if (!fileId) {
        console.log(`  • Could not extract file ID from URL: ${driveUrl}`);
        continue;
      }
      
      console.log(`  • File ID: ${fileId}`);
      
      // Download image from Google Drive
      const downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
      console.log(`  ⬇️  Downloading image...`);
      
      const response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const buffer = await response.buffer();
      console.log(`  • Downloaded (${buffer.length} bytes)`);
      
      // Convert to base64
      const base64Image = buffer.toString('base64');
      
      // Detect image type from content or use default
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const mimeType = contentType.includes('image/') ? contentType : 'image/jpeg';
      
      const dataUrl = `data:${mimeType};base64,${base64Image}`;
      const sizeKb = (base64Image.length / 1024).toFixed(1);
      console.log(`  • Converted to base64 (${sizeKb} KB)`);
      
      images.push(dataUrl);
      
    } catch (error) {
      console.error(`  [${i + 1}/${driveLinks.length}] • Failed: ${error.message}`);
      // Continue with next image instead of failing completely
    }
  }
  
  console.log(`\n• Successfully downloaded ${images.length} image(s) from ${driveLinks.length} link(s)\n`);
  
  return images;
}

const { Project, Certification, ProExp, Education, Article, About, AIChatLog, VisitorLog, Settings } = require('./models');
// Projects CRUD
 app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ order: 1, _id: 1 });
    const normalizedProjects = projects.map(p => ({
      ...p.toObject(),
    }));
    res.json(normalizedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
});

// Projects CRUD endpoints
 app.post('/api/projects', auth, async (req, res) => {
  try {
    const projectData = req.body;
    
    console.log('📥 Received project data:', {
      name: projectData.name,
      pdf_links: projectData.pdf_links,
      images_count: projectData.images?.length || 0
    });
    
    // If pdf_links are provided, download images from Google Drive
    if (projectData.pdf_links && projectData.pdf_links.length > 0) {
      console.log(`\n🔄 Downloading ${projectData.pdf_links.length} image(s) from Google Drive for project: ${projectData.name}`);
      console.log('Image Links:', projectData.pdf_links);
      try {
        const downloadedImages = await downloadImagesFromDriveLinks(projectData.pdf_links);
        console.log(`• Download result: ${downloadedImages.length} images downloaded`);
        if (downloadedImages.length > 0) {
          console.log(`First image preview: ${downloadedImages[0].substring(0, 100)}...`);
          projectData.images = downloadedImages;
          console.log(`• Successfully downloaded ${downloadedImages.length} image(s)`);
          console.log(`• projectData.images now has ${projectData.images.length} items`);
        } else {
          console.log('•  No images were downloaded');
        }
      } catch (downloadError) {
        console.error('•  Error downloading images:', downloadError.message);
        console.error('Stack:', downloadError.stack);
        // Continue saving the project even if download fails
      }
    } else {
      console.log('ℹ️  No image links provided, skipping download');
    }
    
    // Create new project with request data
    const project = new Project({
      projectid: projectData.projectid,
      name: projectData.name,
      description: projectData.description,
      enabled: projectData.enabled !== undefined ? projectData.enabled : true,
      tags: projectData.tags || [],
      images: projectData.images || [],
      pdf_links: projectData.pdf_links || [],
      source_code_link: projectData.source_code_link || '',
      source_code_link2: projectData.source_code_link2 || '',
      WebsiteText: projectData.WebsiteText || '',
      order: projectData.order || 0
    });

    // Log the project data before saving
    console.log('💾 Creating project with:', {
      name: project.name,
      images_count: project.images?.length || 0,
      pdf_links_count: project.pdf_links?.length || 0,
      first_image_preview: project.images?.[0]?.substring(0, 100)
    });

    // Save the project
    const savedProject = await project.save();
    
    console.log('• Project saved to database:', {
      id: savedProject._id,
      name: savedProject.name,
      images_count: savedProject.images?.length || 0,
      pdf_links_count: savedProject.pdf_links?.length || 0
    });

    // Send the saved project as response
    res.status(201).json(savedProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      error: error.message,
      validationErrors: error.errors
    });
  }
}); 

 //PUT endpoint to update a project
app.put('/api/projects/:id', auth, async (req, res) => {
  try {
    const projectData = req.body;
    
    // If pdf_links are provided, download images from Google Drive
    if (projectData.pdf_links && projectData.pdf_links.length > 0) {
      console.log(`\n🔄 Downloading ${projectData.pdf_links.length} image(s) from Google Drive for project update: ${projectData.name}`);
      try {
        const downloadedImages = await downloadImagesFromDriveLinks(projectData.pdf_links);
        if (downloadedImages.length > 0) {
          projectData.images = downloadedImages;
          console.log(`• Successfully downloaded ${downloadedImages.length} image(s)`);
        }
      } catch (downloadError) {
        console.error('•  Error downloading images:', downloadError.message);
        // Continue updating the project even if download fails
      }
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id, 
      projectData, 
      { new: true }
    );
    res.json(project);

  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE endpoint to delete a project
app.delete('/api/projects/:id', auth, async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}); 

app.get('/api/certifications', async (req, res) => {
  const certifications = await Certification.find().sort({ order: 1, _id: 1 });
  res.json(certifications);
});

app.post('/api/certifications', auth, async (req, res) => {
  try {
    const certData = req.body;
    
    // If pdf_links are provided, extract images from PDFs
    if (certData.pdf_links && certData.pdf_links.length > 0) {
      console.log(`\n🔄 Extracting images from ${certData.pdf_links.length} PDF(s) for certification: ${certData.name}`);
      try {
        const extractedImages = await extractImagesFromPdfLinks(certData.pdf_links);
        if (extractedImages.length > 0) {
          certData.images = extractedImages;
          console.log(`• Successfully extracted ${extractedImages.length} image(s)`);
        }
      } catch (extractError) {
        console.error('•  Error extracting images from PDFs:', extractError.message);
        // Continue saving the certification even if extraction fails
      }
    }
    
    const cert = new Certification(certData);
    await cert.save();
    res.json(cert);
  } catch (error) {
    console.error('Error creating certification:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/certifications/:id', auth, async (req, res) => {
  try {
    const certData = req.body;
    
    // If pdf_links are provided, extract images from PDFs
    if (certData.pdf_links && certData.pdf_links.length > 0) {
      // Get existing certification to compare pdf_links
      const existingCert = await Certification.findById(req.params.id);
      const existingPdfLinks = existingCert?.pdf_links || [];
      
      // Check if pdf_links array has changed (added, removed, or modified)
      const linksChanged = JSON.stringify(certData.pdf_links.sort()) !== JSON.stringify(existingPdfLinks.sort());
      
      if (linksChanged) {
        console.log(`\n🔄 PDF links changed for certification: ${certData.name}`);
        console.log(`   Old links (${existingPdfLinks.length}):`, existingPdfLinks);
        console.log(`   New links (${certData.pdf_links.length}):`, certData.pdf_links);
        console.log(`   Re-extracting all images...`);
        
        try {
          const extractedImages = await extractImagesFromPdfLinks(certData.pdf_links);
          console.log(`   Extraction result: ${extractedImages.length} images extracted`);
          
          if (extractedImages.length > 0) {
            certData.images = extractedImages;
            console.log(`• Successfully extracted ${extractedImages.length} image(s)`);
          } else {
            console.log(`•  No images were extracted!`);
            certData.images = [];
          }
        } catch (extractError) {
          console.error('• Error extracting images from PDFs:', extractError);
          console.error('   Error message:', extractError.message);
          console.error('   Stack trace:', extractError.stack);
          // Clear images if extraction fails
          certData.images = [];
        }
      } else {
        console.log(`\n✓ PDF links unchanged for certification: ${certData.name}`);
        console.log(`   Keeping existing images`);
        // Keep existing images
        certData.images = existingCert?.images || [];
      }
    } else {
      // No pdf_links provided, clear images
      console.log(`\n•  No PDF links for certification: ${certData.name}`);
      certData.images = [];
    }
    
    const cert = await Certification.findByIdAndUpdate(
      req.params.id,
      certData,
      { new: true }
    );
    res.json(cert);
  } catch (error) {
    console.error('Error updating certification:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/certifications/:id', auth, async (req, res) => {
  await Certification.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Test endpoint: Extract images for a specific certification
app.post('/api/certifications/:id/extract-images', auth, async (req, res) => {
  try {
    const cert = await Certification.findById(req.params.id);
    
    if (!cert) {
      return res.status(404).json({ error: 'Certification not found' });
    }
    
    if (!cert.pdf_links || cert.pdf_links.length === 0) {
      return res.status(400).json({ error: 'No pdf_links found for this certification' });
    }
    
    console.log(`\n🔄 Manually extracting images for: ${cert.name}`);
    
    const extractedImages = await extractImagesFromPdfLinks(cert.pdf_links);
    
    if (extractedImages.length > 0) {
      cert.images = extractedImages;
      await cert.save();
      console.log(`• Successfully extracted and saved ${extractedImages.length} image(s)`);
      res.json({ 
        success: true, 
        message: `Extracted ${extractedImages.length} images`,
        certification: cert 
      });
    } else {
      res.status(500).json({ error: 'Failed to extract any images' });
    }
  } catch (error) {
    console.error('Error extracting images:', error);
    res.status(500).json({ error: error.message });
  }
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
  try {
    const exp = await ProExp.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(exp);
  } catch (error) {
    console.error('Error updating professional experience:', error);
    res.status(500).json({ error: error.message });
  }
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
  try {
    const edu = await Education.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(edu);
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ error: error.message });
  }
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
app.post('/api/articles', auth, async (req, res) => {  // Added auth middleware
  try {
    const articleData = {
      title: req.body.title,
      url: req.body.url,
      image_url: req.body.image_url,
      articleid: req.body.articleid,
      enabled: req.body.enabled !== undefined ? req.body.enabled : true,
      order: req.body.order || 0
    };
    
    const article = new Article(articleData);
    await article.save();
    res.json(article);
  } catch (err) {
    console.error("Error saving article:", err);
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/articles/:id', auth, async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: error.message });
  }
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

// Test endpoint
app.get('/api/chat', (req, res) => {
  res.json({ message: 'Chat endpoint is working. Use POST to send messages. Version: 2.1' });
});

// Database Knowledge Synthesizer:
// Multi-factor semantic scoring engine using live database collections (projects, certifications, proExps, education, about, articles)
function synthesizeDatabaseResponse({ message, projects = [], certifications = [], proExps = [], education = [], aboutData = {}, aboutText = '', aboutEmail = '', articles = [] }) {
  const lowerMessage = (message || '').trim().toLowerCase();
  const cleanMessage = lowerMessage.replace(/[?!.,;:"'()[\]{}]/g, ' ');
  const tokens = cleanMessage.split(/\s+/).filter(Boolean);
  const tokenSet = new Set(tokens);

  // Multilingual detection
  const isPt = /(olá|ola|bom dia|boa tarde|boa noite|quem|qual|quais|como|dele|ele|sobre|projetos|projeto|experiência|educação|trabalho|contacto|contato|estudou|tecnologias|habilidades|currículo|curriculo|trabalha|mora|onde)/iu.test(lowerMessage);
  const isEs = /(hola|buenos dias|buenas tardes|quién|quien|cuál|cual|cómo|como|proyectos|proyecto|experiencia|educación|educacion|contacto|habilidades|currículum)/iu.test(lowerMessage);

  // 1. Greetings
  if (/^(hi|hello|hey|yo|sup|greetings|good\s*(morning|afternoon|evening))\b/i.test(lowerMessage) || 
      /^(olá|ola|oi|bom dia|boa tarde|boa noite)\b/iu.test(lowerMessage) ||
      /^(hola|buenos días|buenas tardes)\b/iu.test(lowerMessage) ||
      ['hi', 'hello', 'hey', 'ola', 'olá', 'oi', 'hola'].includes(lowerMessage)) {
    if (isPt) {
      return {
        response: "Olá! • Sou o assistente inteligente do Tiago Dias. O Tiago é Gen AI Software Engineer no Banco BPI e Mestre em Engenharia Informática pelo ISTEC. Posso dar-lhe informações detalhadas sobre os seus projetos práticos (como o Condomix, Sonar ou Automix), a sua experiência em Inteligência Artificial Generativa e .NET, percurso académico ou como entrar em contacto. O que gostaria de explorar?",
        scrollTarget: null
      };
    }
    return {
      response: "Hello! • I'm Tiago Dias's AI Assistant. Tiago is a Gen AI Software Engineer currently at Banco BPI, holding a Master's degree in Computer Science from ISTEC. I can help you explore his enterprise Gen AI & LLM modernization work, software projects (like Condomix, Sonar, and Automix), technical stack, certifications, and career history. What would you like to know?",
      scrollTarget: null
    };
  }

  // Intent Signals
  const hasCurrentSignal = /(current|currently|now|right now|today|present|atualmente|agora|presente|atual)\b/i.test(lowerMessage);
  const hasEmploymentSignal = /(work|working|works|employed|employer|employment|job|jobs|role|position|career|company|firm|workplace|trabalha|trabalhando|emprego|empresa)\b/i.test(lowerMessage);
  const hasProjectSignal = /(project|projects|portfolio|built|apps|application|applications|software|demo|demos|repo|repos|github|source code|projetos|projeto)\b/i.test(lowerMessage);
  const hasEducationSignal = /(education|degree|master|masters|bachelor|bachelors|university|college|school|istec|study|studied|educação|mestrado|licenciatura|formação)\b/i.test(lowerMessage);
  const hasCertSignal = /(cert|certification|certifications|certificate|credentials|mta|mos|microsoft|certificados|certificações)\b/i.test(lowerMessage);
  const hasContactSignal = /(contact|email|hire|reach|talk|touch|phone|contato|contacto|mensagem|falar|contratar)\b/i.test(lowerMessage);
  const hasCvSignal = /(cv|resume|curriculum|curriculo|pdf)\b/i.test(lowerMessage);
  const hasLocationSignal = /(location|live|lives|living|based|located|relocate|remote|portugal|lisbon|localização|mora|vive)\b/i.test(lowerMessage);
  const hasLanguageSignal = /(language|languages|speak|speaks|idioma|idiomas|fala|english|portuguese)\b/i.test(lowerMessage);

  // Work model, hiring, and remote query detection
  const isWorkModelOrHiringQuery =
    /\b(remote|remotely|teletrabalho|remoto|relocate|relocation|abroad|hybrid|híbrido)\b/i.test(lowerMessage) ||
    /\b(looking\s+(for\s+)?(a\s+)?(remote|job|jobs|work|role|roles|position|positions|opportunity|opportunities))\b/i.test(lowerMessage) ||
    /\b(is\s+he|are\s+you|he('?s)?\s+(he\s+)?)\s+(looking|seeking|available|open|ready|interested)\b/i.test(lowerMessage) ||
    /\b(can\s+(i|we)\s+hire|hire\s+him|hiring\s+him|open\s+to\s+work|open\s+for\s+work|available\s+for\s+work|looking\s+to\s+hire|want\s+to\s+hire)\b/i.test(lowerMessage) ||
    /\b(full\s*time|part\s*time|contract|freelance|disponibilidade)\b/i.test(lowerMessage);

  const isCurrentJobQuery =
    !isWorkModelOrHiringQuery && (
      (hasEmploymentSignal && (hasCurrentSignal || lowerMessage.includes('where') || lowerMessage.includes('onde') || lowerMessage.includes('who'))) ||
      lowerMessage.includes('current job') ||
      lowerMessage.includes('current role') ||
      lowerMessage.includes('current company') ||
      lowerMessage.includes('onde trabalha')
    );

  const email = aboutEmail || 'tiagodias.cl@gmail.com';

  // Build candidate knowledge nodes
  const nodes = [];

  // Banco BPI
  nodes.push({
    id: 'exp_bpi',
    category: 'EXPERIENCE',
    primary: ['bpi', 'banco bpi', 'banco'],
    secondary: ['banking', 'current', 'currently', 'now', 'present', 'employed', 'work', 'working', 'job', 'modernization', '.net 8', 'python', 'llm', 'trabalha', 'atual'],
    response: "Tiago is currently a full-time **Gen AI Software Engineer** at **Banco BPI** (July 2025 – Present) in Lisbon, Portugal.\n\n• **Focus**: Modernizing 500K+ lines of legacy banking logic with **Python, LLMs & .NET 8** (+30% maintainability).  \n• **Work Model**: Lisbon, Portugal (Open to Remote / Hybrid / Relocation).",
    scrollTarget: 'about',
    aboutTab: 'experience',
    actionButtons: [
      { type: 'url', icon: '', label: 'LinkedIn', action: 'https://www.linkedin.com/in/tiagofdias' },
      { type: 'download', icon: '', label: 'Download CV', action: 'cv' }
    ]
  });

  // Capgemini
  nodes.push({
    id: 'exp_capgemini',
    category: 'EXPERIENCE',
    primary: ['capgemini', 'cap gemini'],
    secondary: ['rag', 'faiss', 'vector search', 'vector', 'spacy', 'nltk', 'agent', 'agents', 'fine-tuning', 'prompt engineering'],
    response: "At **Capgemini Portugal** (Mar – Jun 2025), Tiago worked as a **Gen AI Software Engineer Intern**.\n\n• **Company**: Capgemini Portugal  \n• **Focus**: Enterprise RAG pipelines & autonomous AI agents  \n• **Tech**: Python, FAISS Vector Search, Spacy/NLTK & LLM Fine-Tuning  \n• **Impact**: Cut compliance document research time by 40% and boosted QA accuracy by 25%.",
    scrollTarget: 'about',
    aboutTab: 'experience'
  });

  // Consulteware
  nodes.push({
    id: 'exp_consulteware',
    category: 'EXPERIENCE',
    primary: ['consulteware'],
    secondary: ['c#', '.net', 'dotnet', 'sql', 'crud', 'time clock', 'timeclock', 'hours'],
    response: "At **Consulteware** (Mar – Aug 2019), Tiago served as a **.NET Developer Intern**.\n\n• **Company**: Consulteware  \n• **Role**: .NET Developer Intern  \n• **Tech**: C#, .NET, SQL Server CRUD operations  \n• **Impact**: Built an employee time-clock tracking 5K+ monthly hours, cutting data latency by 30%.",
    scrollTarget: 'about',
    aboutTab: 'experience'
  });

  // OGMA
  nodes.push({
    id: 'exp_ogma',
    category: 'EXPERIENCE',
    primary: ['ogma', 'aeronautica'],
    secondary: ['help desk', 'helpdesk', 'support', 'windows os', 'hardware', 'vba', 'macros'],
    response: "At **OGMA** (Apr – Jul 2017), Tiago worked as an **IT Help Desk Technician Intern**.\n\n• **Company**: OGMA - Indústria Aeronáutica de Portugal  \n• **Focus**: Windows enterprise deployments & hardware diagnostics  \n• **Impact**: Resolved 15+ daily tickets and automated IT reporting with Excel VBA macros (+50% efficiency).",
    scrollTarget: 'about',
    aboutTab: 'experience'
  });

  // Junta de Freguesia
  nodes.push({
    id: 'exp_junta',
    category: 'EXPERIENCE',
    primary: ['junta', 'freguesia'],
    secondary: ['frontend', 'html5', 'css3', 'jquery', 'portal', 'citizens'],
    response: "At **Junta de Freguesia** (May – Jun 2016), Tiago worked as a **Frontend Developer Intern**.\n\n• **Organization**: Junta de Freguesia da Póvoa de Santa Iria  \n• **Focus**: Municipal public portal redesign  \n• **Tech**: HTML5, CSS3, jQuery, Chart.js  \n• **Impact**: Enhanced civic accessibility for 40,000+ local residents with responsive UI.",
    scrollTarget: 'about',
    aboutTab: 'experience'
  });

  // Experience Overview
  nodes.push({
    id: 'exp_overview',
    category: 'EXPERIENCE',
    primary: ['experience', 'career', 'work history', 'career journey', 'career timeline', 'experiência', 'histórico profissional', 'percurso', 'all companies', 'career progression'],
    secondary: ['companies', 'history', 'progression', 'jobs history', 'past roles'],
    response: "Tiago has **5+ years of software engineering progression**, currently leading Generative AI modernization at **Banco BPI**:\n\n• **Banco BPI** (2025–Present): Gen AI Software Engineer (.NET 8 & Python LLMs)  \n• **Capgemini** (2025): Gen AI Intern (Enterprise RAG & FAISS)  \n• **Consulteware** (2019): .NET Developer Intern (C# & SQL)  \n• **OGMA** (2017): IT Help Desk Intern (Infrastructure & VBA)  \n• **Junta de Freguesia** (2016): Frontend Intern (HTML5/CSS/jQuery)",
    scrollTarget: 'about',
    aboutTab: 'experience',
    actionButtons: [
      { type: 'url', icon: '', label: 'LinkedIn', action: 'https://www.linkedin.com/in/tiagofdias' },
      { type: 'download', icon: '', label: 'Download CV', action: 'cv' }
    ]
  });

  // Master's Degree
  nodes.push({
    id: 'edu_master',
    category: 'EDUCATION',
    primary: ['master', "master's", 'mestrado', 'masters'],
    secondary: ['istec', 'computer science', 'artificial intelligence', 'ai', 'intelligent agents', 'thesis'],
    response: "Tiago holds a Master's degree in Computer Science from ISTEC (Oct 2022 – Sep 2025), specializing in Artificial Intelligence, intelligent multi-agent systems, and distributed software engineering.",
    scrollTarget: 'about',
    aboutTab: 'education'
  });

  // Education Overview
  nodes.push({
    id: 'edu_overview',
    category: 'EDUCATION',
    primary: ['education', 'degree', 'university', 'college', 'school', 'istec', 'educação', 'estudos', 'formação'],
    secondary: ['bachelor', 'vocational', 'academic'],
    response: "Tiago completed all of his academic qualifications at ISTEC - Higher Institute of Advanced Technologies:\n• Master's degree in Computer Science (Oct 2022 – Sep 2025): Focused on artificial intelligence, intelligent systems, and software engineering.\n• Bachelor's degree in Computer Science (Sep 2019 – Oct 2021): Core algorithms, data structures, and system design.\n• Superior Vocational Course in Computer Science Management (Sep 2017 – Oct 2021).",
    scrollTarget: 'about',
    aboutTab: 'education'
  });

  // Certifications Overview
  nodes.push({
    id: 'cert_overview',
    category: 'CERTIFICATIONS',
    primary: ['certification', 'certifications', 'certificate', 'mta', 'mos', 'microsoft', 'credentials', 'certificados', 'certificações'],
    secondary: ['exam', 'credly', 'badge', 'excel', 'security', 'database', 'networking'],
    response: "Tiago holds 15 professional credentials including:\n• MOS: 2016 Master (with Excel & Word Expert)\n• MTA: Software Development Fundamentals\n• MTA: Database Administration Fundamentals\n• MTA: Security Fundamentals\n• MTA: Networking Fundamentals\n• MTA: HTML5 Application Development Fundamentals\n• MTA: Windows OS & Server Administration\n• Fundamentals of Digital Marketing\nYou can view and download his certificate credentials in the Certifications section!",
    scrollTarget: 'certifications'
  });

  // Individual Projects
  const featuredProjects = projects.length ? projects : [
    { name: 'Sonar', description: 'Real-time WebSocket messaging app with JWT auth and MongoDB.' },
    { name: 'Condomix', description: 'Complete SaaS condominium management system with 2FA and automated invoicing.' },
    { name: 'Automix', description: 'Automotive dealership portal with dynamic spec filtering.' },
    { name: 'Blood-Pressure-Monitor', description: 'Medical analytics in Next.js, PostgreSQL, and automated Excel reporting.' },
    { name: 'Bulky_MVC', description: 'Enterprise ASP.NET Core MVC application with Entity Framework and SQL Server.' },
    { name: 'Comparador-DIGI', description: 'Consumer utility tool to calculate monthly savings when switching to DIGI Portugal.' }
  ];

  featuredProjects.forEach(proj => {
    const pName = (proj.name || '').toLowerCase();
    const cleanPName = pName.replace(/[-_]/g, ' ');
    nodes.push({
      id: `proj_${pName.replace(/\s+/g, '_')}`,
      category: 'PROJECTS',
      isSpecific: true,
      primary: [pName, cleanPName],
      secondary: (proj.tags || []).map(t => (t.name || '').toLowerCase()),
      response: `${proj.name} is ${proj.description || "one of Tiago's highlighted software projects."} You can explore its demo and source code using the action buttons below!`,
      scrollTarget: 'projects',
      actionButtons: [
        proj.source_code_link ? { type: 'url', icon: '', label: 'GitHub', action: proj.source_code_link } : null,
        proj.WebsiteText ? { type: 'url', icon: '', label: 'Live Demo', action: proj.WebsiteText } : null
      ].filter(Boolean)
    });
  });

  // Projects Overview
  nodes.push({
    id: 'proj_overview',
    category: 'PROJECTS',
    primary: ['project', 'projects', 'portfolio', 'built', 'apps', 'projetos', 'repos', 'repositories'],
    secondary: ['show his work', 'show me his work', 'what has he built', 'what did he build'],
    response: "Tiago has built 28 software applications spanning Generative AI, enterprise systems, and full-stack web applications. Standout projects include:\n• Condomix: Complete SaaS condominium management system with 2FA, invoicing, and unit management.\n• Sonar: Real-time messaging app with WebSockets, JWT authentication, and MongoDB.\n• Automix: Automotive inventory dealership portal with dynamic spec filtering.\n• Blood-Pressure-Monitor: Medical tracking application with Next.js, PostgreSQL, and Excel report generation.\n• Bulky_MVC: Enterprise ASP.NET Core MVC application with Entity Framework.\n\nExplore interactive demos and GitHub source code in the Projects section below!",
    scrollTarget: 'projects'
  });

  // Tech / Skills
  nodes.push({
    id: 'tech_overview',
    category: 'SKILLS',
    primary: ['skill', 'skills', 'tech', 'stack', 'technologies', 'habilidades', 'tecnologia'],
    secondary: ['python', 'c#', '.net', 'react', 'node', 'javascript', 'typescript', 'mongo', 'postgres', 'faiss', 'rag', 'llm'],
    response: "Tiago Dias's core technical expertise encompasses:\n• Gen AI & Data: Python, LLMs, RAG, FAISS Vector Search, Agentic Workflows\n• Backend: C# (.NET 8), Node.js, Express, RESTful APIs, JWT, Passkeys (WebAuthn)\n• Databases: MongoDB, PostgreSQL, SQL Server\n• Frontend: React 18, TypeScript, TailwindCSS, Three.js, HTML5/CSS3\n• Tools & DevOps: Git, GitHub, Docker, Postman, Vite",
    scrollTarget: 'about',
    aboutTab: 'skills'
  });

  // Contact
  nodes.push({
    id: 'info_contact',
    category: 'CONTACT',
    primary: ['contact', 'email', 'hire', 'reach', 'touch', 'message', 'phone', 'contacto', 'contato'],
    secondary: ['talk', 'mail', 'inquiry'],
    response: isPt
      ? `Pode contactar o Tiago Dias diretamente através do email: ${email} ou pelo seu perfil no LinkedIn (https://www.linkedin.com/in/tiagofdias). Também pode enviar-lhe uma mensagem direta usando o formulário na secção de Contacto!`
      : `You can reach Tiago Dias directly at ${email} or connect via his LinkedIn profile (https://www.linkedin.com/in/tiagofdias). You can also send a direct inquiry using the interactive Contact Form below!`,
    scrollTarget: 'contact',
    actionButtons: [
      { type: 'url', icon: '', label: 'LinkedIn', action: 'https://www.linkedin.com/in/tiagofdias' },
      { type: 'download', icon: '', label: 'Download CV', action: 'cv' }
    ]
  });

  // CV
  nodes.push({
    id: 'info_cv',
    category: 'CV',
    primary: ['cv', 'resume', 'curriculum', 'curriculo', 'pdf', 'download'],
    secondary: ['download cv', 'file'],
    response: "You can download Tiago Dias's updated CV using the 'Download CV' button in the Hero section at the top of the page, or by clicking the action button below!",
    scrollTarget: 'about',
    actionButtons: [{ type: 'download', icon: '', label: 'Download CV', action: 'cv' }]
  });

  // Work Model, Remote Availability & Hiring
  nodes.push({
    id: 'info_work_model_and_hiring',
    category: 'CAREER_AVAILABILITY',
    primary: ['remote', 'remote jobs', 'remote work', 'work remotely', 'teletrabalho', 'looking for jobs', 'looking for remote jobs', 'looking for work', 'seeking work', 'open to work', 'hire', 'hire him', 'hiring', 'relocate', 'relocation', 'available for work', 'available for hire', 'disponibilidade', 'recrutamento', 'hybrid', 'open to opportunities', 'remoto', 'trabalho remoto'],
    secondary: ['full-time', 'fulltime', 'contract', 'freelance', 'opportunity', 'opportunities', 'roles', 'positions', 'abroad', 'worldwide', 'europe'],
    response: "Yes! Tiago is actively open to full-time **Remote**, **Hybrid**, or **Relocation** software engineering opportunities worldwide.\n\n• **Current Position**: Gen AI Software Engineer at **Banco BPI** (Lisbon, Portugal)  \n• **Work Model**: 100% Remote, Hybrid, or Global Relocation  \n• **Focus Areas**: Generative AI, LLM Pipelines, .NET 8 (C#) & Modern Full-Stack  \n• **Get in Touch**: Connect on LinkedIn or reach out via email below to discuss roles.",
    scrollTarget: 'contact',
    actionButtons: [
      { type: 'url', icon: '', label: 'LinkedIn', action: 'https://www.linkedin.com/in/tiagofdias' },
      { type: 'email', icon: '', label: 'Send Email', action: `mailto:${email}` },
      { type: 'download', icon: '', label: 'Download CV', action: 'cv' }
    ]
  });

  // Location
  nodes.push({
    id: 'info_location',
    category: 'LOCATION',
    primary: ['location', 'where does he live', 'where is he based', 'where is he located', 'portugal', 'lisbon', 'localização', 'mora', 'vive', 'reside'],
    secondary: ['based', 'live', 'lives', 'reside', 'city', 'country', 'póvoa', 'povoa'],
    response: "Tiago is based in Póvoa de Santa Iria (Lisbon metropolitan area, Portugal). He is currently open to full-time career opportunities, including Remote, Hybrid, or on-site/Relocation roles globally.",
    scrollTarget: 'about'
  });

  // About / Bio
  nodes.push({
    id: 'info_about',
    category: 'ABOUT',
    primary: ['who is tiago', 'who is he', 'who are you', 'about tiago', 'about him', 'tell me about tiago', 'bio', 'quem é', 'quem e', 'sobre o tiago', 'sobre ele'],
    secondary: ['background', 'profile', 'story'],
    response: aboutText || (isPt
      ? "O Tiago Dias é um Gen AI Software Engineer sediado em Lisboa (Póvoa de Santa Iria), Portugal, com Mestrado e Licenciatura em Engenharia Informática pelo ISTEC. Atualmente no Banco BPI, lidera fluxos de automação inteligente e modernização de código legado com Python, LLMs e .NET 8. Tem também vasta experiência em desenvolvimento full-stack com React, Node.js, TypeScript e MongoDB."
      : "Tiago Dias is a Gen AI Software Engineer based in Lisbon (Póvoa de Santa Iria), Portugal, with a Master's and Bachelor's degree in Computer Science from ISTEC. Currently at Banco BPI, he designs and deploys intelligent automation workflows and enterprise code modernization using Python, LLMs, and .NET 8. He also has deep full-stack engineering expertise across React, Node.js, TypeScript, and MongoDB."),
    scrollTarget: 'about'
  });

  // Multi-Factor Scoring
  const scored = nodes.map(node => {
    let score = 0;

    // Primary keyword matches
    if (node.primary) {
      for (const pk of node.primary) {
        if (lowerMessage.includes(pk)) {
          score += 25;
          if (node.isSpecific) score += 40;
        } else if (tokenSet.has(pk)) {
          score += 20;
          if (node.isSpecific) score += 35;
        }
      }
    }

    // Secondary keyword matches
    if (node.secondary) {
      for (const sk of node.secondary) {
        if (sk.includes(' ') && lowerMessage.includes(sk)) {
          score += 15;
        } else if (tokenSet.has(sk)) {
          score += 6;
        } else if (lowerMessage.includes(sk)) {
          score += 4;
        }
      }
    }

    // Intent alignment & penalties
    if (isWorkModelOrHiringQuery) {
      if (node.id === 'info_work_model_and_hiring') score += 120;
      else if (node.id === 'exp_overview') score -= 100;
      else if (node.category === 'EXPERIENCE') score -= 40;
      else if (node.category === 'PROJECTS') score -= 50;
    }

    if (isCurrentJobQuery) {
      if (node.id === 'exp_bpi') score += 50;
      else if (node.category === 'PROJECTS') score -= 40;
      else if (node.category === 'LOCATION' && !lowerMessage.includes('live') && !lowerMessage.includes('mora')) score -= 20;
    }

    if (hasProjectSignal && !isCurrentJobQuery && !isWorkModelOrHiringQuery) {
      if (node.category === 'PROJECTS') score += 35;
    }

    if (hasEducationSignal && node.category === 'EDUCATION') score += 35;
    if (hasCertSignal && node.category === 'CERTIFICATIONS') score += 40;
    if (hasContactSignal && !isWorkModelOrHiringQuery && node.category === 'CONTACT') score += 45;
    if (hasCvSignal && node.category === 'CV') score += 45;
    if (hasLocationSignal && !isWorkModelOrHiringQuery && node.category === 'LOCATION') score += 40;

    return { node, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const winner = scored[0];

  if (!winner || winner.score < 5) {
    const fallbackNode = nodes.find(n => n.id === 'info_about');
    return {
      response: fallbackNode.response,
      scrollTarget: 'about',
      shouldExpandTimeline: false,
      aboutTab: null,
      actionButtons: [
        { type: 'url', icon: '', label: 'LinkedIn', action: 'https://www.linkedin.com/in/tiagofdias' },
        { type: 'download', icon: '', label: 'Download CV', action: 'cv' }
      ]
    };
  }

  return {
    response: winner.node.response,
    scrollTarget: winner.node.scrollTarget || null,
    shouldExpandTimeline: !!winner.node.aboutTab,
    aboutTab: winner.node.aboutTab || null,
    actionButtons: winner.node.actionButtons || null
  };
}

// Chat endpoint with OpenRouter AI (with Database Knowledge Synthesizer fallback)
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now(); // Track request start time for logging
  try {
    console.log('=== CHAT ENDPOINT HIT ===');
    const { message, history } = req.body || {};
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`Got message: ${message}`);
    
    // Fetch all enabled database content in parallel
    const [projects, certifications, proExps, education, articles, about] = await Promise.all([
      Project.find({ enabled: true }).sort({ order: 1 }),
      Certification.find({ enabled: true }).sort({ order: 1 }),
      ProExp.find({ enabled: true }).sort({ order: 1 }),
      Education.find({ enabled: true }).sort({ order: 1 }),
      Article.find({ enabled: true }).sort({ order: 1 }),
      About.find()
    ]);
    
    console.log(`Database stats: ${projects.length} projects, ${certifications.length} certifications, ${proExps.length} experiences, ${education.length} education entries`);

    // Build context from database using actual schema fields
    const aboutData = about[0] || {};
    const aboutText = Array.isArray(aboutData.content)
      ? aboutData.content.map(part => part.text).join(' ').trim()
      : '';
    const aboutEmail = aboutData.email || (() => {
      if (!Array.isArray(aboutData.content)) return null;
      const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
      for (const part of aboutData.content) {
        const match = emailRegex.exec(part?.text || '');
        if (match) return match[0];
      }
      return null;
    })();
    const formatTimelineEntry = item => {
      if (!item) return '';
      const title = item.title || 'Role';
      const company = item.company_name ? ` at ${item.company_name}` : '';
      const date = item.date ? ` (${item.date})` : '';
      return `${title}${company}${date}`;
    };

    const sanitize = text => (text || '').replace(/\s+/g, ' ').trim();
    const tokenize = text => sanitize(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const lowerMessage = message.toLowerCase();
    const messageTokens = new Set(tokenize(message));
    const includesAll = terms => terms.every(term => lowerMessage.includes(term));
    const includesAny = terms => terms.some(term => lowerMessage.includes(term));

    const knowledgeItems = [];

    projects.forEach(project => {
      if (!project?.name) return;
      const tags = (project.tags || []).map(tag => tag?.name).filter(Boolean);
      const points = sanitize(project.description);
      const keywords = [project.name, ...tags]
        .map(item => tokenize(item))
        .flat()
        .filter(Boolean);
      knowledgeItems.push({
        type: 'project',
        title: project.name,
        keywords,
        detail: `${project.name} is ${points || 'one of Tiago\'s highlighted projects.'}${tags.length ? ` It uses technologies such as ${tags.join(', ')}.` : ''}${project.website ? ` You can read more at ${project.website}.` : ''}${[project.source_code_link, project.source_code_link2].filter(Boolean).length ? ` Source: ${[project.source_code_link, project.source_code_link2].filter(Boolean).join(' | ')}.` : ''}`
      });
    });

    proExps.forEach(exp => {
      const title = exp?.title || 'Professional experience';
      const company = exp?.company_name;
      const points = (exp?.points || []).map(p => sanitize(p?.text)).filter(Boolean).join(' ');
      const keywords = [title, company]
        .filter(Boolean)
        .flatMap(tokenize);
      knowledgeItems.push({
        type: 'experience',
        title,
        keywords,
        detail: `${formatTimelineEntry(exp)}${points ? ` Highlights: ${points}` : ''}`
      });
    });

    education.forEach(edu => {
      const title = edu?.title || 'Education';
      const school = edu?.company_name;
      const points = (edu?.points || []).map(p => sanitize(p?.text)).filter(Boolean).join(' ');
      const keywords = [title, school]
        .filter(Boolean)
        .flatMap(tokenize);
      knowledgeItems.push({
        type: 'education',
        title,
        keywords,
        detail: `Education: ${formatTimelineEntry(edu)}${points ? ` Key learnings: ${points}` : ''}`
      });
    });

    certifications.forEach(cert => {
      if (!cert?.name) return;
      const keywords = tokenize(cert.name).concat(
        (cert.tags || [])
          .map(tag => tag?.name)
          .filter(Boolean)
          .flatMap(tokenize)
      );
      knowledgeItems.push({
        type: 'certification',
        title: cert.name,
        keywords,
        detail: `${cert.name}${cert.description ? ` - ${sanitize(cert.description)}` : ''}${(cert.tags || []).length ? ` Topics: ${(cert.tags || []).map(tag => tag?.name).filter(Boolean).join(', ')}.` : ''}`
      });
    });

    articles.forEach(article => {
      if (!article?.title) return;
      const keywords = tokenize(article.title);
      knowledgeItems.push({
        type: 'article',
        title: article.title,
        keywords,
        detail: `Article: ${article.title}${article.url ? ` — read it at ${article.url}` : ''}`
      });
    });

    if (aboutText) {
      knowledgeItems.push({
        type: 'about',
        title: 'about',
        keywords: tokenize(aboutText),
        detail: `${aboutText}${(aboutData.languages || []).length ? ` Languages: ${(aboutData.languages || []).join(', ')}.` : ''}`
      });
    }

    const matchByTokens = (items, tokenExtractor) => {
      for (const item of items) {
        const tokens = tokenExtractor(item);
        if (!tokens || !tokens.length) continue;
        const matched = tokens.some(token => {
          const hasToken = messageTokens.has(token);
          const inMessage = lowerMessage.includes(token);
          return hasToken || inMessage;
        });
        if (matched) {
          console.log(`Matched item:`, item?.name || item?.title, 'with tokens:', tokens);
          return item;
        }
      }
      return null;
    };

    console.log('User message:', message);
    console.log('Message tokens:', Array.from(messageTokens));
    console.log('Projects found:', projects.map(p => p.name).join(', '));
    
    let matchedProject = matchByTokens(projects, project => tokenize(project?.name));
    console.log('Matched project:', matchedProject?.name || 'none');
    
    const matchedCertification = matchByTokens(certifications, cert => tokenize(cert?.name));
    const matchedExperience = matchByTokens(proExps, exp => tokenize(`${exp?.title || ''} ${exp?.company_name || ''}`));
    const matchedEducation = matchByTokens(education, edu => tokenize(`${edu?.title || ''} ${edu?.company_name || ''}`));
    const matchedArticle = matchByTokens(articles, article => tokenize(article?.title));

    const describeProject = project => {
      if (!project) return '';
      const description = sanitize(project.description) || 'one of Tiago\'s highlighted projects.';
      const tags = (project.tags || []).map(tag => tag?.name).filter(Boolean);
      const extra = project.WebsiteText ? ` ${sanitize(project.WebsiteText)}` : '';
      const links = [project.source_code_link, project.source_code_link2].filter(Boolean);
      return `${project.name} is ${description}${tags.length ? ` It uses technologies such as ${tags.join(', ')}.` : ''}${extra}${links.length ? ` Explore more: ${links.join(' | ')}.` : ''}`;
    };

    const describeCertification = cert => {
      if (!cert) return '';
      const tags = (cert.tags || []).map(tag => tag?.name).filter(Boolean);
      return `${cert.name}${cert.description ? ` - ${sanitize(cert.description)}` : ''}${tags.length ? ` Topics covered: ${tags.join(', ')}.` : ''}`;
    };

    const describeExperience = exp => {
      if (!exp) return '';
      const points = (exp.points || []).map(p => sanitize(p?.text)).filter(Boolean);
      const formattedPoints = points.length > 0 ? points.slice(0, 2).join('. ') + '.' : '';
      return `Tiago worked as ${exp.title || 'a professional'} at ${exp.company_name || 'the company'}${exp.date ? ` from ${exp.date}` : ''}. ${formattedPoints ? `Key highlights include: ${formattedPoints}` : ''}`;
    };

    const describeEducation = edu => {
      if (!edu) return '';
      const points = (edu.points || []).map(p => sanitize(p?.text)).filter(Boolean).join(' ');
      return `Education highlight: ${formatTimelineEntry(edu)}${points ? ` Key learnings: ${points}` : ''}`;
    };

    const describeArticle = article => {
      if (!article) return '';
      return `Article: ${article.title}${article.url ? ` — read it at ${article.url}` : ''}`;
    };

    const computeScore = item => {
      let score = 0;
      item.keywords.forEach(keyword => {
        if (!keyword) return;
        if (lowerMessage.includes(keyword)) {
          score += 2;
        } else if (messageTokens.has(keyword)) {
          score += 1;
        }
      });

      if (item.type && includesAny([item.type, `${item.type}s`])) {
        score += 1;
      }

      return score;
    };

    const rankedKnowledge = knowledgeItems
      .map(item => ({ ...item, score: computeScore(item) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const respondWithOverview = () => {
      const projectSummary = projects.slice(0, 3).map(p => p.name).join(', ');
      const experienceSummary = proExps.slice(0, 2).map(formatTimelineEntry).filter(Boolean).join('; ');
      const certificationSummary = certifications.slice(0, 2).map(cert => cert.name).filter(Boolean).join(', ');
      return [
        aboutText || "Tiago is a software professional focused on building impactful solutions.",
        projects.length ? `Featured projects include ${projectSummary}${projects.length > 3 ? ', and more' : ''}.` : null,
        experienceSummary ? `Experience highlights: ${experienceSummary}.` : null,
        certifications.length ? `Certifications: ${certificationSummary}${certifications.length > 2 ? ', and others' : ''}.` : null
      ].filter(Boolean).join(' ');
    };

    let aiResponse = '';

    // Detect topic and scroll target FIRST (before AI call)
    // Order matters: more specific checks first, then general ones
    let scrollTarget = null;
    let shouldExpandTimeline = false;
    
    // CONTACT keywords (highest priority for contact)
    if (lowerMessage.includes('contact') || lowerMessage.includes('contato') || lowerMessage.includes('contacto') || 
        lowerMessage.includes('contactar') || lowerMessage.includes('kontakt') || lowerMessage.includes('contatto') || 
        lowerMessage.includes('联系') || lowerMessage.includes('lianxi') || lowerMessage.includes('renraku') || 
        lowerMessage.includes('email') || lowerMessage.includes('correo') || lowerMessage.includes('courriel') || 
        lowerMessage.includes('e-mail') || lowerMessage.includes('reach out') || lowerMessage.includes('reach') || 
        lowerMessage.includes('get in touch') || lowerMessage.includes('falar') || lowerMessage.includes('entrar em contato') || 
        lowerMessage.includes('hablar') || lowerMessage.includes('parler') || lowerMessage.includes('sprechen') || 
        lowerMessage.includes('parlare') || lowerMessage.includes('msg') || lowerMessage.includes('message') || 
        lowerMessage.includes('mensagem') || lowerMessage.includes('mensaje') || lowerMessage.includes('talk') || 
        lowerMessage.includes('speak') || lowerMessage.includes('comunicar') || lowerMessage.includes('phone') || 
        lowerMessage.includes('telephone') || lowerMessage.includes('telefone') || lowerMessage.includes('teléfono') || 
        lowerMessage.includes('número') || lowerMessage.includes('number')) {
      scrollTarget = 'contact';
    // CERTIFICATIONS keywords
    } else if (lowerMessage.includes('certification') || lowerMessage.includes('certificação') || lowerMessage.includes('certificado') || 
               lowerMessage.includes('certificación') || lowerMessage.includes('certificat') || lowerMessage.includes('zertifikat') || 
               lowerMessage.includes('certificazione') || lowerMessage.includes('certificaat') || lowerMessage.includes('сертификат') || 
               lowerMessage.includes('证书') || lowerMessage.includes('zhengsu') || lowerMessage.includes('shikaku')) {
      scrollTarget = 'certifications';
    // ARTICLES keywords
    } else if (lowerMessage.includes('article') || lowerMessage.includes('artigo') || lowerMessage.includes('artículo') || 
               lowerMessage.includes('articulo') || lowerMessage.includes('artikel') || lowerMessage.includes('articolo') || 
               lowerMessage.includes('статья') || lowerMessage.includes('文章') || lowerMessage.includes('wenzhang') || 
               lowerMessage.includes('kiji') || lowerMessage.includes('blog')) {
      scrollTarget = 'blog';
    // EXPERIENCE keywords
    } else if ((lowerMessage.includes('experience') || lowerMessage.includes('experiência') || lowerMessage.includes('experiencia') || 
                lowerMessage.includes('expérience') || lowerMessage.includes('erfahrung') || lowerMessage.includes('esperienza') || 
                lowerMessage.includes('ervaring') || lowerMessage.includes('опыт') || lowerMessage.includes('经验') || 
                lowerMessage.includes('jingyan') || lowerMessage.includes('keiken') || lowerMessage.includes('work history') || 
                lowerMessage.includes('histórico profissional') || lowerMessage.includes('historial laboral') || 
                lowerMessage.includes('historique professionnel') || lowerMessage.includes('job') || lowerMessage.includes('trabalho') || 
                lowerMessage.includes('trabajo') || lowerMessage.includes('travail') || lowerMessage.includes('arbeit') || 
                lowerMessage.includes('lavoro') || lowerMessage.includes('career') || lowerMessage.includes('carreira') || 
                lowerMessage.includes('carrera') || lowerMessage.includes('carrière') || lowerMessage.includes('karriere')) &&
               !(lowerMessage.includes('project') || lowerMessage.includes('projeto') || lowerMessage.includes('proyecto'))) {
      scrollTarget = 'about';
      shouldExpandTimeline = true;
    // EDUCATION keywords
    } else if ((lowerMessage.includes('education') || lowerMessage.includes('educação') || lowerMessage.includes('educacao') || 
                lowerMessage.includes('educación') || lowerMessage.includes('educacion') || lowerMessage.includes('éducation') || 
                lowerMessage.includes('bildung') || lowerMessage.includes('educazione') || lowerMessage.includes('onderwijs') || 
                lowerMessage.includes('образование') || lowerMessage.includes('教育') || lowerMessage.includes('jiaoyu') || 
                lowerMessage.includes('kyouiku') || lowerMessage.includes('study') || lowerMessage.includes('estudo') || 
                lowerMessage.includes('estudio') || lowerMessage.includes('étude') || lowerMessage.includes('studium') || 
                lowerMessage.includes('studio') || lowerMessage.includes('studie') || lowerMessage.includes('formação') || 
                lowerMessage.includes('formacao') || lowerMessage.includes('formación') || lowerMessage.includes('formacion') || 
                lowerMessage.includes('formation') || lowerMessage.includes('degree') || lowerMessage.includes('diploma') || 
                lowerMessage.includes('university') || lowerMessage.includes('universidade') || lowerMessage.includes('universidad') || 
                lowerMessage.includes('université') || lowerMessage.includes('universität') || lowerMessage.includes('università') || 
                lowerMessage.includes('universiteit') || lowerMessage.includes('大学') || lowerMessage.includes('daigaku') || 
                lowerMessage.includes('school') || lowerMessage.includes('escola') || lowerMessage.includes('escuela') || 
                lowerMessage.includes('école') || lowerMessage.includes('schule') || lowerMessage.includes('scuola')) &&
               !(lowerMessage.includes('project') || lowerMessage.includes('projeto') || lowerMessage.includes('proyecto'))) {
      scrollTarget = 'about';
      shouldExpandTimeline = true;
    // Fallback to matched items
    } else if (matchedProject) {
      scrollTarget = 'projects';
    } else if (matchedCertification) {
      scrollTarget = 'certifications';
    } else if (matchedExperience) {
      scrollTarget = 'about';
      shouldExpandTimeline = true;
    }
    
    // PROJECTS keywords - check LAST so it overrides generic "about" matches
    // This ensures "Does he have React projects?" goes to projects, not about
    if ((lowerMessage.includes('project') || lowerMessage.includes('projeto') || lowerMessage.includes('proyecto') || 
         lowerMessage.includes('projet') || lowerMessage.includes('progetto') || lowerMessage.includes('projekt') || 
         lowerMessage.includes('项目') || lowerMessage.includes('xiangmu') || lowerMessage.includes('purojekuto')) && 
        !lowerMessage.includes('how many') && !lowerMessage.includes('quantos') && !lowerMessage.includes('cuántos') && 
        !lowerMessage.includes('cuantos') && !lowerMessage.includes('combien') && !lowerMessage.includes('wie viele') && 
        !lowerMessage.includes('quanti')) {
      scrollTarget = 'projects';
    }
    
    // SKILLS/TECHNOLOGY - also override to projects
    if (lowerMessage.includes('skill') || lowerMessage.includes('habilidade') || lowerMessage.includes('habilidad') || 
        lowerMessage.includes('compétence') || lowerMessage.includes('competence') || lowerMessage.includes('fähigkeit') || 
        lowerMessage.includes('fahigkeit') || lowerMessage.includes('abilità') || lowerMessage.includes('abilita') || 
        lowerMessage.includes('vaardigheid') || lowerMessage.includes('навык') || lowerMessage.includes('技能') || 
        lowerMessage.includes('jineng') || lowerMessage.includes('ginou') || lowerMessage.includes('competência') || 
        lowerMessage.includes('competencia') || lowerMessage.includes('technolog') || lowerMessage.includes('tecnologia') || 
        lowerMessage.includes('tecnología') || lowerMessage.includes('technologie') || lowerMessage.includes('技术') || 
        lowerMessage.includes('jishu') || lowerMessage.includes('gijutsu')) {
      scrollTarget = 'projects';
    }
    
    // ABOUT keywords - check LAST and only if no other match
    if (!scrollTarget && (lowerMessage.includes('about') || lowerMessage.includes('sobre') || lowerMessage.includes('acerca') || 
                          lowerMessage.includes('à propos') || lowerMessage.includes('über') || lowerMessage.includes('riguardo') || 
                          lowerMessage.includes('over') || lowerMessage.includes('о') || lowerMessage.includes('关于') || 
                          lowerMessage.includes('guanyu') || lowerMessage.includes('nitsuite') || lowerMessage.includes('who is') || 
                          lowerMessage.includes('quem é') || lowerMessage.includes('quem e') || lowerMessage.includes('quién es') || 
                          lowerMessage.includes('quien es') || lowerMessage.includes('qui est') || lowerMessage.includes('wer ist') || 
                          lowerMessage.includes('chi è') || lowerMessage.includes('chi e') || lowerMessage.includes('wie is') || 
                          lowerMessage.includes('background'))) {
      scrollTarget = 'about';
    }

    // Build comprehensive context for OpenRouter AI
    const projectsContext = projects.map(p => {
      const tags = (p.tags || []).map(tag => tag?.name).filter(Boolean);
      return `- ${p.name}: ${sanitize(p.description)}${tags.length ? ` (Technologies: ${tags.join(', ')})` : ''}`;
    }).join('\n');

    const experienceContext = proExps.map(exp => {
      const points = (exp.points || []).map(p => sanitize(p?.text)).filter(Boolean).join('; ');
      return `- ${formatTimelineEntry(exp)}${points ? ` | ${points}` : ''}`;
    }).join('\n');

    const educationContext = education.map(edu => {
      const points = (edu.points || []).map(p => sanitize(p?.text)).filter(Boolean).join('; ');
      return `- ${formatTimelineEntry(edu)}${points ? ` | ${points}` : ''}`;
    }).join('\n');

    const certificationsContext = certifications.map(cert => {
      const tags = (cert.tags || []).map(tag => tag?.name).filter(Boolean);
      return `- ${cert.name}${cert.description ? `: ${sanitize(cert.description)}` : ''}${tags.length ? ` (Topics: ${tags.join(', ')})` : ''}`;
    }).join('\n');

    const articlesContext = articles.map(article => {
      return `- ${article.title}${article.url ? ` (${article.url})` : ''}`;
    }).join('\n');

    // Detect if user is asking about projects with specific technology/tag
    let filterTag = null;
    
    // Technology keyword mappings (aliases that map to the same tag)
    const techAliases = {
      'c#': ['csharp', 'c#', 'c sharp', 'dotnet', '.net'],
      'csharp': ['csharp', 'c#', 'c sharp', 'dotnet', '.net'],
      'node': ['node', 'nodejs', 'node.js'],
      'nodejs': ['node', 'nodejs', 'node.js'],
      'react': ['react', 'reactjs', 'react.js'],
      'typescript': ['typescript', 'ts'],
      'ts': ['typescript', 'ts'],
      'javascript': ['javascript', 'js'],
      'js': ['javascript', 'js'],
      'vue': ['vue', 'vuejs', 'vue.js'],
      'next': ['next', 'nextjs', 'next.js'],
      'three': ['three', 'threejs', 'three.js'],
      'socket.io': ['socket.io', 'socket-io', 'socketio'],
      'entity-framework': ['entity-framework', 'entityframework', 'ef', 'ef core'],
      't-sql': ['t-sql', 'tsql', 'sql server', 'mssql'],
      'asp-net-core': ['asp-net-core', 'asp.net core', 'aspnet core', 'asp.net', 'aspnet']
    };
    
    // Common technology keywords - will be sorted by length (longest first) to match specific terms before short ones
    const techKeywords = [
      'react', 'node', 'nodejs', 'express', 'mongodb', 'mongo', 'javascript', 'js',
      'typescript', 'ts', 'python', 'java', 'csharp', 'c#', '.net', 'dotnet', 'asp.net', 'asp-net-core',
      'angular', 'vue', 'vuejs', 'nextjs', 'next.js', 'tailwind', 'tailwindcss', 'bootstrap',
      'css', 'html', 'sass', 'scss', 'php', 'laravel', 'django', 'flask', 'spring', 'springboot',
      'mysql', 'postgresql', 'postgres', 'sqlite', 'redis', 'firebase', 'aws', 'azure', 'docker',
      'kubernetes', 'git', 'github', 'gitlab', 'jenkins', 'ci/cd', 'rest', 'api', 'graphql',
      'socket.io', 'socket-io', 'websocket', 'jwt', 'oauth', 'authentication', 'security',
      'threejs', 'three.js', 'd3', 'd3.js', 'chartjs', 'chart.js', 'redux', 'mobx', 'zustand',
      'jest', 'testing', 'cypress', 'selenium', 'mocha', 'chai', 'enzyme',
      'sql', 't-sql', 'entity-framework', 'orm', 'prisma', 'sequelize', 'mongoose',
      'winforms', 'wpf', 'unity', 'unreal', 'godot', 'electron', 'tauri',
      'kotlin', 'swift', 'flutter', 'react-native', 'reactnative', 'xamarin', 'ionic',
      'rust', 'go', 'golang', 'ruby', 'rails', 'perl', 'lua', 'r', 'matlab'
    ].sort((a, b) => b.length - a.length); // Sort by length descending - longest keywords checked first
    
    // Check if question is about projects AND contains a technology keyword
    // Only filter if EXPLICITLY asking about a technology (not just project names)
    // Don't skip tech filtering just because a project was matched if the query is clearly about technology
    const isTechQuery = /\b(project|projects)\b/i.test(message) && 
                        techKeywords.some(tech => lowerMessage.includes(tech));
    
    if (scrollTarget === 'projects' && (!matchedProject || isTechQuery)) {
      // Check for explicit technology queries like "show me react projects", "does he have node projects"
      // Look for pattern: technology word + "project(s)" or "project(s)" + technology word
      const hasProjectKeyword = /\b(project|projects)\b/i.test(message);
      
      console.log('Technology filter check:');
      console.log('- Has project keyword:', hasProjectKeyword);
      console.log('- Is tech query:', isTechQuery);
      console.log('- Original message:', message);
      console.log('- Lower message:', lowerMessage);
      
      if (hasProjectKeyword) {
        for (const tech of techKeywords) {
          // Check if the message contains this tech keyword
          const normalizedTech = tech.replace(/[.\-#]/g, '');
          const normalizedMessage = lowerMessage.replace(/[.\-#]/g, '');
          const messageContainsTech = lowerMessage.includes(tech) || normalizedMessage.includes(normalizedTech);
          
          if (messageContainsTech) {
            console.log('- Found tech keyword:', tech);
            // Get all possible aliases for this tech
            const aliases = techAliases[tech.toLowerCase()] || [tech];
            console.log('- Checking aliases:', aliases);
            
            // Find projects that match any of the aliases
            let matchingProjects = [];
            let matchedTag = null;
            
            for (const alias of aliases) {
              console.log('  - Checking alias:', alias);
              matchingProjects = projects.filter(p => 
                (p.tags || []).some(tag => {
                  const tagLower = tag.name.toLowerCase();
                  const aliasLower = alias.toLowerCase();
                  // Check if tag contains alias or alias contains tag
                  const matches = tagLower.includes(aliasLower) || 
                         aliasLower.includes(tagLower) ||
                         tagLower.replace(/[.-]/g, '') === aliasLower.replace(/[.-]/g, '');
                  if (matches) {
                    console.log('    ✓ Matched tag:', tag.name);
                  }
                  return matches;
                })
              );
              
              console.log('  - Matching projects:', matchingProjects.map(p => p.name));
              
              if (matchingProjects.length > 0) {
                // Find the exact tag name from the projects
                const tag = matchingProjects[0].tags.find(t => {
                  const tagLower = t.name.toLowerCase();
                  const aliasLower = alias.toLowerCase();
                  return tagLower.includes(aliasLower) || 
                         aliasLower.includes(tagLower) ||
                         tagLower.replace(/[.-]/g, '') === aliasLower.replace(/[.-]/g, '');
                });
                
                if (tag) {
                  matchedTag = tag.name;
                  console.log('  - Matched tag name:', matchedTag);
                  break;
                }
              }
            }
            
            if (matchedTag) {
              filterTag = matchedTag;
              // Clear matchedProject when filtering by technology
              // User is asking about a category, not a specific project
              matchedProject = null;
              console.log('  - Cleared matchedProject (user asking for tech category, not specific project)');
              break;
            }
          }
        }
      }
    }

    // Detect if we should add action buttons BEFORE building the context (for prompt optimization)
    let willShowActionButtons = false;
    if (scrollTarget === 'contact' || 
        lowerMessage.match(/\b(contact|contato|email|reach|connect|linkedin|cv|resume|curriculum|curriculo|download|msg|message|talk|speak|falar|comunicar|phone|telephone|telefone|number)\b/) ||
        lowerMessage.includes('reach out') || lowerMessage.includes('get in touch')) {
      willShowActionButtons = true;
    }
    if (scrollTarget === 'projects' || matchedProject) {
      willShowActionButtons = true;
    }
    if (scrollTarget === 'certifications' && matchedCertification && matchedCertification.pdfPath) {
      willShowActionButtons = true;
    }

    // Build an advanced intelligence context prompt for OpenRouter LLMs
    const contextPrompt = `You are Tiago Dias's AI Executive Representative and Portfolio Assistant on his personal website (https://tiago-dias.onrender.com/).
Visitors are actively browsing this website and chatting with you through the chat widget.

## ABOUT TIAGO DIAS:
- **Title & Current Position**: Gen AI Software Engineer at **Banco BPI** (July 2025 – Present) in Lisbon, Portugal.
  • Modernizing 500K+ lines of core legacy banking architecture with **Python, LLMs, and .NET 8** (+30% maintainability).
  • Enterprise Agentic workflows, RAG pipelines, Vector Search (FAISS), and prompt engineering.
- **Previous Professional Experience**:
  • Gen AI Software Engineer Intern at **Capgemini Portugal** (March – June 2025): Enterprise RAG, autonomous agents, FAISS vector search, Spacy/NLTK, reducing compliance document research time by 40%.
  • .NET Developer Intern at **Consulteware** (2019): C#, .NET, SQL Server CRUD, employee time-clock tracking 5K+ monthly hours.
  • IT Help Desk Technician Intern at **OGMA** (2017): Windows enterprise deployments, diagnostics, automated reporting with Excel VBA macros.
  • Frontend Developer Intern at **Junta de Freguesia** (2016): Civic public portal redesign with responsive UI.
- **Education**:
  • Master's Degree in Computer Science from **ISTEC** (Oct 2022 – Sep 2025): Specialization in Artificial Intelligence, Intelligent Multi-Agent Systems, and Distributed Software Engineering.
  • Bachelor's Degree in Computer Science from **ISTEC** (Sep 2019 – Oct 2021).
  • Superior Vocational Course in Computer Science Management from **ISTEC** (2017 – 2021).
- **Core Technical Stack**:
  • Gen AI & LLMs: Python, Large Language Models, RAG, FAISS Vector Search, Agentic Workflows, Prompt Engineering, Model Fine-Tuning.
  • Backend: C# (.NET 8, ASP.NET Core MVC), Node.js, Express, RESTful APIs, JWT, Passkeys (WebAuthn).
  • Databases: MongoDB, PostgreSQL, SQL Server.
  • Frontend: React 18, TypeScript, TailwindCSS, Three.js, HTML5/CSS3.
  • Tools & DevOps: Docker, Git, GitHub, Postman, Vite.
- **Languages**: Portuguese (Native C2), English (Advanced C1).
- **Certifications**: 15 Microsoft & Technical credentials, including MOS 2016 Master (Excel & Word Expert), MTA Software Development Fundamentals, MTA Database Administration Fundamentals, MTA Security, MTA Networking, MTA HTML5, MTA Windows OS & Server Administration.
- **Contact & Links**:
  • Email: ${aboutEmail || 'tiagodias.cl@gmail.com'}
  • LinkedIn: https://www.linkedin.com/in/tiagofdias
  • GitHub: https://github.com/tiagofdias
  • CV: Available for download on the website.

## TIAGO'S PROJECTS:
${projectsContext || 'Multiple enterprise and open-source applications built with modern stacks (Condomix, Sonar, Automix, Blood-Pressure-Monitor, Bulky_MVC, Comparador-DIGI).'}

## CRITICAL BEHAVIOR & REASONING RULES:
1. **Real LLM Intelligence & Out-of-the-Box Inquiries**: You are a genuinely smart AI machine, NOT a keyword matcher. When users ask out-of-the-box, hypothetical, or complex questions (e.g. "Is he looking for remote jobs?", "Can he build web scrapers in Python?", "Would he be a great tech lead?", "Compare .NET and Node.js for his stack", "Explain how his master's thesis ties into his current work", "Tell me a joke about coding"):
   - Think and reason deeply based on his comprehensive background.
   - For career/availability questions: Tiago is based in Lisbon, Portugal, but is actively open to **100% Remote**, **Hybrid**, or **Relocation** opportunities worldwide. Warmly invite them to get in touch via email (${aboutEmail || 'tiagodias.cl@gmail.com'}) or LinkedIn.
   - For technical questions: Analyze his stack (.NET 8, Python, LLMs, React, Node.js, MongoDB, Docker, Enterprise Banking experience) and give a thoughtful, reasoned technical evaluation of his competence.
2. **Third-Person Perspective**: Always refer to Tiago in the third person ("he", "his", "Tiago"). You are speaking TO the visitor ABOUT Tiago.
3. **Tone & Style**: Warm, professional, articulate, and concise (typically 2 to 4 well-structured sentences). Highlight key terms with **bold text** where helpful.
4. **Action Buttons Awareness**: Interactive action buttons (LinkedIn, GitHub, CV download, Project links) appear automatically below your message when relevant. ${willShowActionButtons ? 'ABSOLUTELY DO NOT write out raw URLs or links in your text response—the interactive buttons will handle it seamlessly!' : 'Guide visitors naturally to download his CV or connect on LinkedIn.'}
5. **Language Match**: Always respond in the language the visitor used (English, Portuguese, Spanish, French, etc.).`;

    // Use OpenRouter API with prioritized model tier
    const fetch = require('node-fetch');
    const AbortController = require('abort-controller');

    let lastError = null;
    
    // Get OpenRouter API key from database settings (fallback to env variable)
    let OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    try {
      const apiKeySetting = await Settings.findOne({ key: 'OPENROUTER_API_KEY' });
      if (apiKeySetting && apiKeySetting.value) {
        OPENROUTER_API_KEY = apiKeySetting.value;
        console.log('• Using OpenRouter API key from database');
      } else {
        console.log('• Using OpenRouter API key from environment variables');
      }
    } catch (settingsError) {
      console.warn('• Could not fetch settings from database, using env variable:', settingsError.message);
    }
    
    if (!OPENROUTER_API_KEY) {
      lastError = new Error('OPENROUTER_API_KEY not found in settings or environment variables');
      console.error('', lastError.message);
    } else {
      // Prioritized models: top-tier ultra-fast models with free fallbacks
      const openRouterModels = [
        'deepseek/deepseek-chat',                 // Tier 1: Incredible reasoning, ultra-cheap (~$0.14/M tokens)
        'google/gemini-2.0-flash-001',           // Tier 1: Lightning fast, highly accurate (~$0.10/M tokens)
        'meta-llama/llama-3.3-70b-instruct',     // Tier 1: State-of-the-art open-weights
        'openrouter/free',                       // Tier 2: OpenRouter automatic free tier routing
        'nvidia/nemotron-3.5-lightning:free',    // Tier 2: Free model
        'google/gemma-4-31b-it:free',            // Tier 2: Free model
        'google/gemma-4-26b-a4b-it:free',        // Tier 2: Free model
        'minimax/minimax-m3.1-flash:free',        // Tier 2: Free model
        'liquid/lfm-2.5-2.6b:free'               // Tier 2: Free model
      ];

      // Format conversation history for multi-turn context
      const validHistory = Array.isArray(history)
        ? history
            .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
            .slice(-6)
            .map(item => ({ role: item.role, content: item.content.trim() }))
        : [];
      
      for (const modelName of openRouterModels) {
        try {
          console.log(`Trying OpenRouter model: ${modelName}...`);
          
          // 20-second timeout for reliable completions
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20000);
          
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': 'https://tiago-dias.onrender.com',
              'X-Title': 'Tiago Dias Portfolio'
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                {
                  role: 'system',
                  content: contextPrompt
                },
                ...validHistory,
                {
                  role: 'user',
                  content: message
                }
              ],
              temperature: 0.7,
              max_tokens: 800
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeout);

          const data = await response.json();
          
          // Check for API errors
          if (data.error) {
            console.error(`• OpenRouter API Error (${modelName}):`, data.error.message || data.error);
            lastError = new Error(data.error.message || JSON.stringify(data.error));
            continue; // Try next model
          }
          
          if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            aiResponse = data.choices[0].message.content;
            
            // Remove <think> tags and their content from the response
            aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
            
            // If action buttons will be shown, strip any URLs from the response
            if (willShowActionButtons) {
              console.log('Stripping URLs from response');
              aiResponse = aiResponse.replace(/https?:\/\/[^\s,;.!?]+\.?/gi, '');
              aiResponse = aiResponse.replace(/www\.[^\s,;.!?]+\.?/gi, '');
              aiResponse = aiResponse.replace(/\s*(at|on|in|via|through|using|clicking|click)\s+(the\s+)?(link|button|url)\s+(at\s+)?(the\s+)?(top|bottom|above|below)(\s+of\s+(this|the)\s+page)?/gi, '');
              aiResponse = aiResponse.replace(/\s*using the button at the (top|bottom)/gi, '');
              aiResponse = aiResponse.replace(/\s*at the (top|bottom) of (this|the) page/gi, '');
              aiResponse = aiResponse.replace(/(connect|conectar|contatar)\s+(via|through|at|em|no)\s+(LinkedIn|GitHub|his\s+LinkedIn|o\s+LinkedIn)/gi, '');
              aiResponse = aiResponse.replace(/\s*[,;]\s*\./g, '.');
              aiResponse = aiResponse.replace(/\.\s*\./g, '.');
              aiResponse = aiResponse.replace(/\s+/g, ' ').trim();
            }
            
            console.log(`• Successfully got response from OpenRouter (${modelName})`);
            break; // Success! Exit the loop
          } else {
            lastError = new Error(`Invalid response format from ${modelName}`);
            continue; // Try next model
          }
        } catch (aiError) {
          if (aiError.name === 'AbortError') {
            console.error(`• OpenRouter API timeout (${modelName}): Request took longer than 20 seconds`);
            lastError = new Error(`Timeout: ${modelName} took too long to respond`);
          } else {
            console.error(`OpenRouter API error (${modelName}):`, aiError.message);
            lastError = aiError;
          }
          // Try next model
        }
      }
    }
    
    // Intelligent Database Knowledge Synthesizer fallback
    // If OpenRouter is unavailable, rate-limited, or times out, synthesize a smart answer from real database records!
    if (!aiResponse) {
      console.warn('• OpenRouter API unavailable. Synthesizing intelligent response from database knowledge base...');
      const synthesized = synthesizeDatabaseResponse({
        message,
        projects,
        certifications,
        proExps,
        education,
        aboutData,
        aboutText,
        aboutEmail,
        articles
      });
      aiResponse = synthesized.response;
      if (synthesized.scrollTarget && !scrollTarget) {
        scrollTarget = synthesized.scrollTarget;
      }
      if (synthesized.shouldExpandTimeline) {
        shouldExpandTimeline = true;
      }
      if (synthesized.aboutTab && !aboutTab) {
        aboutTab = synthesized.aboutTab;
      }
      if (synthesized.actionButtons && !actionButtons) {
        actionButtons = synthesized.actionButtons;
      }
    }

    // Detect language from the message
    let detectedLanguage = 'en'; // Default to English
    
    // Language detection based on common words and patterns
    if (lowerMessage.match(/\b(projeto|projetos|contato|sobre|quem|qual|como|posso|experiência|educação|certificado|habilidade|dele|ele)\b/)) {
      detectedLanguage = 'pt'; // Portuguese
    } else if (lowerMessage.match(/\b(proyecto|proyectos|contactar|acerca|quién|quien|cual|cómo|como|puedo|experiencia|educación|certificación|habilidad)\b/)) {
      detectedLanguage = 'es'; // Spanish
    } else if (lowerMessage.match(/\b(projet|projets|contact|propos|qui|quel|comment|puis|expérience|éducation|certificat|compétence)\b/)) {
      detectedLanguage = 'fr'; // French
    } else if (lowerMessage.match(/\b(projekt|projekte|kontakt|über|wer|welche|wie|kann|erfahrung|bildung|zertifikat|fähigkeit)\b/)) {
      detectedLanguage = 'de'; // German
    } else if (lowerMessage.match(/\b(progetto|progetti|contatto|riguardo|chi|quale|come|posso|esperienza|educazione|certificazione|abilità)\b/)) {
      detectedLanguage = 'it'; // Italian
    } else if (lowerMessage.match(/\b(project|projecten|contact|over|wie|welke|hoe|kan|ervaring|onderwijs|certificaat|vaardigheid)\b/)) {
      detectedLanguage = 'nl'; // Dutch
    } else if (lowerMessage.match(/\b(проект|контакт|опыт|образование|сертификат|навык)\b/)) {
      detectedLanguage = 'ru'; // Russian
    } else if (lowerMessage.match(/[\u4e00-\u9fa5]/)) {
      detectedLanguage = 'zh'; // Chinese (contains Chinese characters)
    } else if (lowerMessage.match(/[\u3040-\u309f\u30a0-\u30ff]/)) {
      detectedLanguage = 'ja'; // Japanese (contains Hiragana/Katakana)
    }

    console.log(`Detected language: ${detectedLanguage}`);
    
    // POST-AI ANALYSIS: Analyze the AI's response to intelligently determine scroll target and action buttons
    // This is smarter than pre-filtering because the AI understands the user's intent better
    console.log('=== POST-AI ANALYSIS ===');
    console.log('Full AI Response:', aiResponse);
    console.log('Analyzing AI response to determine scroll target and buttons...');
    
    const aiResponseLower = aiResponse.toLowerCase();
    
    // Declare action buttons variable if not already declared
    let actionButtons = null;
    
    // Reset scroll target and buttons - we'll determine them from AI's response
    scrollTarget = null;
    willShowActionButtons = false;
    
    // SMART DETECTION: Check what data the AI is talking about
    // If AI mentions specific project names, it's talking about projects
    const mentionsProjects = projects.some(p => aiResponseLower.includes(p.name.toLowerCase()));
    // If AI mentions specific company names from experience, it's about experience
    const mentionsExperience = proExps.some(exp => {
      const companyName = (exp.company_name || '').toLowerCase();
      const title = (exp.title || '').toLowerCase();
      return (companyName && aiResponseLower.includes(companyName)) || 
             (title && aiResponseLower.includes(title));
    });
    // If AI mentions education institutions
    const mentionsEducation = education.some(edu => {
      const institutionName = (edu.company_name || '').toLowerCase();
      return (institutionName && aiResponseLower.includes(institutionName)) ||
             aiResponseLower.includes('bachelor') || aiResponseLower.includes('master') || 
             aiResponseLower.includes('degree') || aiResponseLower.includes('istec');
    });
    // If AI mentions certifications
    const mentionsCertifications = certifications.some(cert => 
      aiResponseLower.includes(cert.name.toLowerCase())
    );
    
    console.log('Smart detection results:');
    console.log('  - Mentions projects:', mentionsProjects);
    console.log('  - Mentions experience:', mentionsExperience);
    console.log('  - Mentions education:', mentionsEducation);
    console.log('  - Mentions certifications:', mentionsCertifications);
    
    // Detect scroll target from AI response content
    if (aiResponseLower.includes('contact section') || aiResponseLower.includes('seção de contato') || 
        aiResponseLower.includes('sección de contacto') || aiResponseLower.includes('contact form')) {
      scrollTarget = 'contact';
      console.log('  → Detected: Contact section (explicit mention)');
    } else if (aiResponseLower.includes('projects section') || aiResponseLower.includes('seção de projetos') || 
               aiResponseLower.includes('sección de proyectos') || aiResponseLower.includes('filtered the projects') ||
               mentionsProjects) {
      scrollTarget = 'projects';
      console.log('  → Detected: Projects section');
    } else if (aiResponseLower.includes('certifications section') || aiResponseLower.includes('certificações') || 
               aiResponseLower.includes('certificaciones') || mentionsCertifications) {
      scrollTarget = 'certifications';
      console.log('  → Detected: Certifications section');
    } else if (aiResponseLower.includes('blog section') || aiResponseLower.includes('articles section') ||
               aiResponseLower.includes('medium') || aiResponseLower.includes('article') ||
               aiResponseLower.includes('blog')) {
      scrollTarget = 'blog'; // Changed from 'articles' to 'blog' to match frontend section name
      console.log('  → Detected: Blog/Articles section');
    } else if (aiResponseLower.includes('tech stack') || aiResponseLower.includes('technology') ||
               aiResponseLower.includes('technologies') || aiResponseLower.includes('programming languages') ||
               aiResponseLower.includes('languages') && (aiResponseLower.includes('speak') || aiResponseLower.includes('know')) ||
               aiResponseLower.includes('skills') || aiResponseLower.includes('what does') ||
               aiResponseLower.includes('who is') || aiResponseLower.includes('about him') ||
               aiResponseLower.includes('introduction') || aiResponseLower.includes('about section')) {
      scrollTarget = 'about';
      console.log('  → Detected: About/Introduction section (tech stack, languages, skills, or intro)');
    } else if (mentionsExperience || mentionsEducation ||
               aiResponseLower.includes('worked at') || aiResponseLower.includes('trabalhou') ||
               aiResponseLower.includes('career') || aiResponseLower.includes('timeline') ||
               aiResponseLower.includes('experience') && !aiResponseLower.includes('years of experience') ||
               aiResponseLower.includes('education') ||
               aiResponseLower.includes('bpi') || aiResponseLower.includes('capgemini') ||
               aiResponseLower.includes('consulteware') || aiResponseLower.includes('ogma') ||
               aiResponseLower.includes('istec') || aiResponseLower.includes('university')) {
      scrollTarget = 'myjourney';
      shouldExpandTimeline = true;
      console.log('  → Detected: Experience/Education (My Journey section)');
    }
    
    // Determine which My Journey tab to open (experience vs education)
    let aboutTab = null;
    if (scrollTarget === 'myjourney' && shouldExpandTimeline) {
      if (mentionsEducation || 
          aiResponseLower.includes('education') || aiResponseLower.includes('educação') || 
          aiResponseLower.includes('university') || aiResponseLower.includes('istec') ||
          aiResponseLower.includes('bachelor') || aiResponseLower.includes('master') ||
          aiResponseLower.includes('degree') || aiResponseLower.includes('school')) {
        aboutTab = 'education';
        console.log('  → Tab: Education');
      } else if (mentionsExperience || 
                 aiResponseLower.includes('experience') || aiResponseLower.includes('experiência') ||
                 aiResponseLower.includes('worked') || aiResponseLower.includes('trabalhou') ||
                 aiResponseLower.includes('career') || aiResponseLower.includes('job') ||
                 aiResponseLower.includes('bpi') || aiResponseLower.includes('capgemini') ||
                 aiResponseLower.includes('consulteware') || aiResponseLower.includes('ogma')) {
        aboutTab = 'experience';
        console.log('  → Tab: Experience');
      }
    }
    
    // Detect if AI mentions LinkedIn (means user asking about contact/LinkedIn)
    if (aiResponseLower.includes('linkedin') || aiResponseLower.includes('linked in')) {
      scrollTarget = 'contact';
      willShowActionButtons = true;
      actionButtons = [
        {
          type: 'url',
          icon: '',
          label: 'LinkedIn',
          action: 'https://www.linkedin.com/in/tiagofdias'
        },
        {
          type: 'download',
          icon: '',
          label: 'Download CV',
          action: 'cv'
        }
      ];
      console.log('  → Detected: LinkedIn mention - adding contact buttons');
      
      // Strip LinkedIn URLs from response - be aggressive!
      console.log('Original response with LinkedIn URL:', aiResponse);
      aiResponse = aiResponse.replace(/https?:\/\/[^\s]+/gi, ''); // Remove ALL URLs
      aiResponse = aiResponse.replace(/www\.[^\s]+/gi, ''); // Remove www. URLs
      // Remove phrases like "através do LinkedIn em" or "via LinkedIn at"
      aiResponse = aiResponse.replace(/(através|via|at|em|no|on|in)\s+(do\s+)?LinkedIn\s+(em|at|in)?/gi, '');
      aiResponse = aiResponse.replace(/conectar através do/gi, 'conectar com ele via');
      aiResponse = aiResponse.replace(/contactá-lo através do/gi, 'contactá-lo no');
      // Clean up punctuation
      aiResponse = aiResponse.replace(/\s*\.\s*\./g, '.'); // Fix double periods
      aiResponse = aiResponse.replace(/\s*\.\s*Também/gi, '. Também'); // Fix spacing
      aiResponse = aiResponse.replace(/\s+/g, ' ').trim();
      console.log('After URL stripping:', aiResponse);
    }
    
    // Detect if AI mentions specific projects (add project buttons)
    // Use ONLY post-AI detection (what AI actually mentions) - ignore pre-AI matchedProject
    // Don't show buttons for tech category queries (when filterTag is set)
    if (mentionsProjects && scrollTarget === 'projects' && !filterTag) {
      // Find which project was mentioned in the AI response
      const project = projects.find(p => aiResponseLower.includes(p.name.toLowerCase()));
      
      if (project) {
        actionButtons = [];
        willShowActionButtons = true;
        
        console.log('  → Detected: Specific project mentioned - adding buttons for:', project.name);
        
        if (project.source_code_link) {
          actionButtons.push({
            type: 'url',
            icon: '',
            label: 'GitHub',
            action: project.source_code_link
          });
        }
        
        const liveUrl = project.WebsiteText || 
                       (project.source_code_link2 && 
                        !project.source_code_link2.includes('github.com') ? 
                        project.source_code_link2 : null);
        
        if (liveUrl && liveUrl.trim()) {
          actionButtons.push({
            type: 'url',
            icon: '',
            label: 'View Project',
            action: liveUrl
          });
        }
        
        // Strip GitHub URLs from response when project buttons shown
        aiResponse = aiResponse.replace(/https?:\/\/[^\s]+github[^\s]*/gi, '');
        aiResponse = aiResponse.replace(/\s+/g, ' ').trim();
      }
    }
    
    console.log('Final scrollTarget:', scrollTarget);
    console.log('Final shouldExpandTimeline:', shouldExpandTimeline);
    console.log('Final aboutTab:', aboutTab);
    console.log('Final actionButtons:', actionButtons ? `${actionButtons.length} buttons` : 'none');
    console.log('=== END POST-AI ANALYSIS ===');
    
    // Smart technology filtering: analyze AI response to detect which technology the user is asking about
    // This handles cases like "json web token projects" better than keyword matching
    // Post-AI detection can override pre-AI detection for better accuracy
    if (scrollTarget === 'projects' && /\b(project|projects)\b/i.test(message)) {
      console.log('Analyzing AI response for technology detection...');
      console.log('Pre-AI filterTag:', filterTag);
      console.log('Full AI response:', aiResponse);
      
      // Only analyze the first 200 chars of AI response (the actual answer, not metadata)
      const aiResponseStart = aiResponse.substring(0, 200).toLowerCase();
      console.log('AI response start (200 chars):', aiResponseStart);
      
      // Flag to track if we found a specific multi-word tech match
      let foundMultiWordTech = false;
      
      // First, check if the user query contains multi-word tech terms (more specific)
      // These are high-priority and should override pre-AI detection
      const multiWordTechs = ['json web token', 'web socket', 'socket.io', 'react native', 'node.js'];
      for (const multiTech of multiWordTechs) {
        if (lowerMessage.includes(multiTech)) {
          console.log(`  - User query explicitly contains: ${multiTech}`);
          
          // For JWT, always prioritize JWT tags
          if (multiTech === 'json web token') {
            console.log(`  - Prioritizing JWT detection (user explicitly asked for JWT)`);
            
            // Find projects with jwt or authentication tags
            const jwtProjects = projects.filter(p => 
              (p.tags || []).some(tag => 
                tag.name.toLowerCase().includes('jwt') || 
                tag.name.toLowerCase().includes('jsonwebtoken') ||
                tag.name.toLowerCase() === 'authentication'
              )
            );
            
            console.log(`  - Found ${jwtProjects.length} projects with JWT/auth tags`);
            
            if (jwtProjects.length > 0) {
              const jwtTag = jwtProjects[0].tags.find(t => 
                t.name.toLowerCase().includes('jwt') || 
                t.name.toLowerCase().includes('jsonwebtoken') ||
                t.name.toLowerCase() === 'authentication'
              );
              if (jwtTag) {
                filterTag = jwtTag.name;
                foundMultiWordTech = true;
                matchedProject = null; // Clear since user asking for tech category
                console.log(`  ✓ Override with JWT/auth tag: ${filterTag}`);
                console.log(`  ✓ Cleared matchedProject (tech category query)`);
                break;
              }
            }
          }
        }
      }
      
      // If no multi-word match found, use regular tech keyword detection
      // But don't override if we already found a JWT tag
      if (!foundMultiWordTech && (filterTag === 'javascript' || !filterTag)) {
        // Extract technologies mentioned in the AI response
        for (const tech of techKeywords) {
          if (aiResponseStart.includes(tech.toLowerCase())) {
            console.log(`  - AI response mentions: ${tech}`);
            
            // Get all possible aliases for this tech
            const aliases = techAliases[tech.toLowerCase()] || [tech];
            
            // Find projects that match any of the aliases
            let matchingProjects = [];
            let matchedTag = null;
            
            for (const alias of aliases) {
              matchingProjects = projects.filter(p => 
                (p.tags || []).some(tag => {
                  const tagLower = tag.name.toLowerCase();
                  const aliasLower = alias.toLowerCase();
                  return tagLower.includes(aliasLower) || 
                         aliasLower.includes(tagLower) ||
                         tagLower.replace(/[.\-]/g, '') === aliasLower.replace(/[.\-]/g, '');
                })
              );
              
              if (matchingProjects.length > 0) {
                const tag = matchingProjects[0].tags.find(t => {
                  const tagLower = t.name.toLowerCase();
                  const aliasLower = alias.toLowerCase();
                  return tagLower.includes(aliasLower) || 
                         aliasLower.includes(tagLower) ||
                         tagLower.replace(/[.\-]/g, '') === aliasLower.replace(/[.\-]/g, '');
                });
                
                if (tag) {
                  matchedTag = tag.name;
                  console.log(`  ✓ Found matching tag: ${matchedTag}`);
                  break;
                }
              }
            }
            
            if (matchedTag) {
              filterTag = matchedTag;
              matchedProject = null; // Clear since user asking for tech category
              console.log(`  ✓ Cleared matchedProject (tech category query)`);
              break;
            }
          }
        }
      }
    }
    
    if (filterTag) console.log(`Detected filter tag: ${filterTag}`);
    
    // Add certification download button for certification queries
    if (scrollTarget === 'certifications' && matchedCertification && matchedCertification.pdfPath) {
      actionButtons = [
        {
          type: 'download',
          icon: '',
          label: 'View Certificate',
          action: matchedCertification.pdfPath
        }
      ];
    }

    // Log AI chat interaction to database
    try {
      const responseTime = Date.now() - startTime;
      const estimatedTokens = Math.ceil((message.length + aiResponse.length) / 4);
      
      // Get real IP address, handling proxies and IPv6
      let clientIp = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     req.ip || 
                     'unknown';
      
      // If multiple IPs in x-forwarded-for, get the first one
      if (clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
      }
      
      // Convert IPv6 localhost to IPv4
      if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
        clientIp = '127.0.0.1';
      }
      
      await AIChatLog.create({
        ip: clientIp,
        userQuestion: message,
        aiResponse: aiResponse,
        userAgent: req.get('user-agent'),
        responseTime: responseTime,
        tokenCount: estimatedTokens
      });
    } catch (logError) {
      console.error('Failed to log chat interaction:', logError);
      // Don't fail the response if logging fails
    }
    
    res.json({ 
      response: aiResponse,
      scrollTarget: scrollTarget,
      shouldExpandTimeline: shouldExpandTimeline,
      aboutTab: aboutTab,
      detectedLanguage: detectedLanguage,
      filterTag: filterTag,
      actionButtons: actionButtons
    });
    
    console.log('=== RESPONSE SENT TO FRONTEND ===');
    console.log('scrollTarget:', scrollTarget);
    console.log('shouldExpandTimeline:', shouldExpandTimeline);
    console.log('aboutTab:', aboutTab);
    console.log('filterTag:', filterTag);
    console.log('actionButtons:', actionButtons ? `${actionButtons.length} buttons` : 'none');
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message,
      fullError: error.toString()
    });
  }
});

// Statistics endpoint for admin dashboard
// Visitor tracking endpoint (public - no auth required)
app.post('/api/track-visitor', async (req, res) => {
  try {
    const visitorData = req.body;
    
    // Get IP address (handle proxies and various formats)
    let clientIp = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    if (clientIp) {
      clientIp = clientIp.split(',')[0].trim();
      if (clientIp.includes('::ffff:')) {
        clientIp = clientIp.replace('::ffff:', '');
      }
      if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
        clientIp = '127.0.0.1';
      }
    }
    
    // Check if this is the first ever visit from this session (must check FIRST)
    const existingVisit = await VisitorLog.findOne({ sessionId: visitorData.sessionId });
    const isNewVisitor = !existingVisit;
    
    // Check if this session already has a visit logged in the last 5 minutes
    // to avoid duplicate entries for the same page
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentVisit = await VisitorLog.findOne({ 
      sessionId: visitorData.sessionId,
      page: visitorData.page,
      timestamp: { $gte: fiveMinutesAgo }
    }).sort({ timestamp: -1 });
    
    // Only create a new entry if no recent visit to the SAME page exists
    if (!recentVisit) {
      // Create visitor log entry
      await VisitorLog.create({
        ip: clientIp,
        sessionId: visitorData.sessionId,
        page: visitorData.page,
        referrer: visitorData.referrer,
        userAgent: visitorData.userAgent,
        browser: visitorData.browser,
        browserVersion: visitorData.browserVersion,
        os: visitorData.os,
        osVersion: visitorData.osVersion,
        device: visitorData.device,
        screenWidth: visitorData.screenWidth,
        screenHeight: visitorData.screenHeight,
        viewportWidth: visitorData.viewportWidth,
        viewportHeight: visitorData.viewportHeight,
        language: visitorData.language,
        languages: visitorData.languages,
        timezone: visitorData.timezone,
        isNewVisitor,
        visitCount: 1, // Each entry is one page view
        firstSeen: new Date(),
        lastSeen: new Date(),
        timeOnPage: 0,
        timestamp: new Date()
      });
      console.log(`• Tracked visitor: ${clientIp} | Session: ${visitorData.sessionId.substring(0, 15)}... | Page: ${visitorData.page} | New: ${isNewVisitor}`);
    } else {
      console.log(`⏭️  Skipped duplicate: Same page within 5 min`);
    }
    
    res.json({ success: true, tracked: true });
  } catch (error) {
    console.error('Error tracking visitor:', error);
    res.status(500).json({ error: 'Failed to track visitor' });
  }
});

// Heartbeat endpoint to track active time on page
app.post('/api/visitor-heartbeat', async (req, res) => {
  try {
    const { sessionId, page } = req.body;
    
    if (!sessionId || !page) {
      return res.status(400).json({ error: 'Missing sessionId or page' });
    }
    
    // Find the most recent visitor log for this session and page
    const visitorLog = await VisitorLog.findOne({ 
      sessionId, 
      page 
    }).sort({ timestamp: -1 });
    
    if (visitorLog) {
      const now = new Date();
      const timeDiff = Math.floor((now - visitorLog.lastSeen) / 1000); // seconds
      
      // Only update if less than 60 seconds passed (user is still active)
      if (timeDiff < 60) {
        visitorLog.lastSeen = now;
        visitorLog.timeOnPage += timeDiff;
        await visitorLog.save();
        console.log(`•  Updated time: Session ${sessionId.substring(0, 15)}... spent ${visitorLog.timeOnPage}s on ${page}`);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    res.status(500).json({ error: 'Failed to update heartbeat' });
  }
});

// Visitor analytics endpoint (protected - requires auth)
app.get('/api/visitor-analytics', auth, async (req, res) => {
  try {
    const { period = 'day', startDate, endDate } = req.query;
    
    const now = new Date();
    let dateFilter = {};
    
    // Calculate date ranges for different periods
    if (startDate && endDate) {
      dateFilter = {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      // Default period-based filters
      const periodMs = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
      };
      
      dateFilter = {
        timestamp: { $gte: new Date(now - periodMs[period] || periodMs.day) }
      };
    }
    
    // Get total page views and unique visitors (sessions)
    const totalPageViews = await VisitorLog.countDocuments(dateFilter);
    const uniqueVisitorSessions = await VisitorLog.distinct('sessionId', dateFilter);
    
    // Get new visitors (sessions where isNewVisitor is true)
    const newVisitorSessions = await VisitorLog.aggregate([
      { $match: { ...dateFilter, isNewVisitor: true } },
      { $group: { _id: '$sessionId' } }
    ]);
    const newVisitorsCount = newVisitorSessions.length;
    
    // Returning visitors = unique sessions - new visitor sessions
    const returningVisitorsCount = uniqueVisitorSessions.length - newVisitorsCount;
    
    // Get page views breakdown
    const pageViews = await VisitorLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get browser statistics
    const browserStats = await VisitorLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get device statistics
    const deviceStats = await VisitorLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get OS statistics
    const osStats = await VisitorLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get country statistics (if available)
    const countryStats = await VisitorLog.aggregate([
      { $match: { ...dateFilter, country: { $exists: true, $ne: null } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get visitors over time (grouped by hour for day, by day for week/month, by month for year)
    let timeGrouping;
    if (period === 'day') {
      timeGrouping = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      };
    } else if (period === 'week' || period === 'month') {
      timeGrouping = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      };
    } else {
      timeGrouping = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' }
      };
    }
    
    const visitorsOverTime = await VisitorLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: timeGrouping,
          count: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          uniqueCount: { $size: '$uniqueVisitors' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);
    
    // Get top referrers
    const topReferrers = await VisitorLog.aggregate([
      { $match: { ...dateFilter, referrer: { $exists: true, $ne: '', $ne: null } } },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get language statistics
    const languageStats = await VisitorLog.aggregate([
      { $match: { ...dateFilter, language: { $exists: true, $ne: null } } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get average time on page and top visitors by time spent
    const avgTimeOnPage = await VisitorLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, avgTime: { $avg: '$timeOnPage' } } }
    ]);
    
    const topVisitorsByTime = await VisitorLog.aggregate([
      { $match: dateFilter },
      { 
        $group: { 
          _id: { ip: '$ip', sessionId: '$sessionId' }, 
          totalTime: { $sum: '$timeOnPage' },
          pageViews: { $sum: 1 },
          pages: { $addToSet: '$page' }
        } 
      },
      { $sort: { totalTime: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      summary: {
        totalPageViews,
        uniqueVisitors: uniqueVisitorSessions.length,
        newVisitors: newVisitorsCount,
        returningVisitors: returningVisitorsCount,
        avgPageViewsPerVisitor: totalPageViews / Math.max(uniqueVisitorSessions.length, 1),
        avgTimeOnPage: avgTimeOnPage[0]?.avgTime || 0
      },
      topVisitorsByTime: topVisitorsByTime.map(v => ({
        ip: v._id.ip,
        sessionId: v._id.sessionId,
        totalTime: v.totalTime,
        pageViews: v.pageViews,
        pages: v.pages
      })),
      pageViews: pageViews.map(p => ({ page: p._id, views: p.count })),
      browserStats: browserStats.map(b => ({ browser: b._id || 'Unknown', count: b.count })),
      deviceStats: deviceStats.map(d => ({ device: d._id || 'Unknown', count: d.count })),
      osStats: osStats.map(o => ({ os: o._id || 'Unknown', count: o.count })),
      countryStats: countryStats.map(c => ({ country: c._id, count: c.count })),
      visitorsOverTime,
      topReferrers: topReferrers.map(r => ({ referrer: r._id, count: r.count })),
      languageStats: languageStats.map(l => ({ language: l._id, count: l.count }))
    });
  } catch (error) {
    console.error('Error fetching visitor analytics:', error);
    res.status(500).json({ error: 'Failed to fetch visitor analytics' });
  }
});

// Settings endpoints
// Get a specific setting
app.get('/api/settings/:key', auth, async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Settings.findOne({ key });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json(setting);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Update or create a setting
app.post('/api/settings/:key', auth, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    const setting = await Settings.findOneAndUpdate(
      { key },
      { 
        value, 
        description,
        updatedAt: new Date()
      },
      { 
        upsert: true, // Create if doesn't exist
        new: true // Return the updated document
      }
    );
    
    console.log(`• Setting updated: ${key} = ${value.substring(0, 20)}...`);
    res.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

app.get('/api/statistics', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    
    // Get health status from health monitor
    const healthStatus = healthMonitor.checkHealth();
    
    // Build search query for chat logs
    const searchQuery = search ? {
      $or: [
        { userQuestion: { $regex: search, $options: 'i' } },
        { aiResponse: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    // Get total count for pagination
    const totalLogs = await AIChatLog.countDocuments(searchQuery);
    
    // Get paginated chat logs (most recent first)
    const chatLogs = await AIChatLog.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Get statistics summary
    const totalChats = await AIChatLog.countDocuments();
    const avgResponseTime = await AIChatLog.aggregate([
      { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
    ]);
    
    res.json({
      health: {
        status: healthStatus.healthy ? 'healthy' : 'unhealthy',
        lastPing: healthStatus.lastPing,
        timeSinceLastPing: healthStatus.timeSinceLastPing
      },
      chatLogs: {
        logs: chatLogs,
        pagination: {
          total: totalLogs,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalLogs / parseInt(limit))
        }
      },
      summary: {
        totalChats,
        avgResponseTime: avgResponseTime[0]?.avgTime || 0
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Add this before your route definitions
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Only serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));

  // Serve index.html for any non-API routes in production
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

// MongoDB connection and server start
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB ');
  
  const PORT = process.env.PORT || 10000;
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Server is ready to accept connections');
    
    // Start health monitoring
    healthMonitor.startMonitoring();
    console.log('Health monitoring started');
  });
  
  console.log('After app.listen() call');

  // Add graceful shutdown here instead
  /* Temporarily disabled SIGINT handler for debugging
  process.on('SIGINT', () => {
    server.close(() => {
      mongoose.connection.close();
      console.log('Server and MongoDB connection closed');
      process.exit(0);
    });
  });
  */
  
  console.log('Setup complete, server should be running now');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

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