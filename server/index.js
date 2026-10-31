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
const { originalProjectVideo } = require('./projectVideo.cjs');
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

const { Project, Certification, ProExp, Education, Article, About, VisitorLog, Settings } = require('./models');
app.get('/api/media/drive-video/:fileId', originalProjectVideo({
  loadProjects: () => Project.find({ enabled: true }).select('demo_video_url').lean(),
  fetchImpl: fetch,
}));


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
      demo_video_url: projectData.demo_video_url || '',
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
      { new: true, runValidators: true }
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
    const certData = { ...req.body };
    const existing = await Certification.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Certification not found' });
    // Metadata-only updates must never clear existing credential previews.
    if (Object.prototype.hasOwnProperty.call(certData, 'pdf_links')) {
      if (!Array.isArray(certData.pdf_links)) return res.status(400).json({ error: 'PDF links must be a list' });
      const previous = existing.pdf_links || [];
      const changed = JSON.stringify([...certData.pdf_links].sort()) !== JSON.stringify([...previous].sort());
      if (certData.pdf_links.length && changed) {
        try {
          const images = await extractImagesFromPdfLinks(certData.pdf_links);
          if (!images.length) return res.status(422).json({ error: 'No credential pages could be read from these PDF links. Check the public links and try again. Existing previews have been kept.' });
          certData.images = images;
        } catch {
          return res.status(422).json({ error: 'The credential PDFs could not be processed. Check the public links and try again. Existing previews have been kept.' });
        }
      } else if (!certData.pdf_links.length && previous.length && !Object.prototype.hasOwnProperty.call(certData, 'images')) {
        certData.images = [];
      }
    }
    const cert = await Certification.findByIdAndUpdate(req.params.id, certData, { new: true });
    res.json(cert);
  } catch (error) {
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

// --- Dedicated CV Endpoints (No Google Sign-in Required) ---
// Get current active CV status & URL
app.get('/api/cv', async (req, res) => {
  try {
    const about = await About.findOne();
    const pdfCv = about?.PDFCV || '';
    
    // Check if CV is stored as base64 in MongoDB
    if (pdfCv.startsWith('data:application/pdf;base64,')) {
      return res.json({
        url: '/api/cv/file',
        downloadUrl: '/api/cv/download',
        type: 'base64',
        isCustom: true,
      });
    }

    // Check if it's a direct valid URL (excluding google drive which requires sign-in)
    if (pdfCv && !pdfCv.includes('drive.google.com') && (pdfCv.startsWith('http://') || pdfCv.startsWith('https://') || pdfCv.startsWith('/'))) {
      return res.json({
        url: pdfCv,
        downloadUrl: pdfCv,
        type: 'url',
        isCustom: true,
      });
    }

    // Default bundled static CV file
    return res.json({
      url: '/CV.pdf',
      downloadUrl: '/CV.pdf',
      type: 'static',
      isCustom: false,
    });
  } catch (error) {
    console.error('Error fetching CV info:', error);
    res.status(500).json({ error: 'Failed to fetch CV information' });
  }
});

// Stream PDF inline for viewer
app.get('/api/cv/file', async (req, res) => {
  try {
    const about = await About.findOne();
    const pdfCv = about?.PDFCV || '';
    if (pdfCv.startsWith('data:application/pdf;base64,')) {
      const base64Data = pdfCv.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="Tiago_Dias_CV.pdf"');
      return res.send(buffer);
    }
    // If not base64 or empty, redirect to static bundled /CV.pdf
    res.redirect('/CV.pdf');
  } catch (error) {
    console.error('Error serving CV file:', error);
    res.redirect('/CV.pdf');
  }
});

// Binary download endpoint
app.get('/api/cv/download', async (req, res) => {
  try {
    const about = await About.findOne();
    const pdfCv = about?.PDFCV || '';
    if (pdfCv.startsWith('data:application/pdf;base64,')) {
      const base64Data = pdfCv.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Tiago_Dias_CV.pdf"');
      return res.send(buffer);
    }
    res.redirect('/CV.pdf');
  } catch (error) {
    console.error('Error downloading CV file:', error);
    res.redirect('/CV.pdf');
  }
});

// Admin upload / modify CV endpoint
app.post('/api/cv/upload', auth, async (req, res) => {
  try {
    const { pdfBase64, url } = req.body;
    let targetCv = '';

    if (pdfBase64 && typeof pdfBase64 === 'string' && pdfBase64.startsWith('data:application/pdf;base64,')) {
      targetCv = pdfBase64;
    } else if (url && typeof url === 'string') {
      targetCv = url.trim();
    } else {
      return res.status(400).json({ error: 'Valid PDF data or URL required' });
    }

    await About.findOneAndUpdate(
      {},
      { PDFCV: targetCv },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'CV updated successfully',
      url: targetCv.startsWith('data:application/pdf;base64,') ? '/api/cv/file' : targetCv,
    });
  } catch (error) {
    console.error('Error updating CV:', error);
    res.status(500).json({ error: 'Failed to update CV' });
  }
});

// Admin reset CV to default bundled static file
app.delete('/api/cv', auth, async (req, res) => {
  try {
    await About.findOneAndUpdate({}, { PDFCV: '' });
    res.json({ success: true, url: '/CV.pdf' });
  } catch (error) {
    console.error('Error resetting CV:', error);
    res.status(500).json({ error: 'Failed to reset CV' });
  }
});

// The portfolio assistant has been removed; legacy clients cannot call providers.
app.all(['/api/chat', '/api/chat/answers'], (_req, res) => {
  res.status(410).json({ error: 'The portfolio assistant has been removed.' });
});

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
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
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
