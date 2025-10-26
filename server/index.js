const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
const fetch = require('node-fetch');
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

// Middleware setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://tiago-dias.onrender.com'  // Production URL
    : 'http://localhost:5173', // Development URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json()); // Add express built-in JSON parser as backup

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

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

const { Project, Certification, ProExp, Education, Article, About } = require('./models');
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
    // Create new project with request data
    const project = new Project({
      projectid: req.body.projectid,
      name: req.body.name,
      description: req.body.description,
      enabled: req.body.enabled !== undefined ? req.body.enabled : true,
      tags: req.body.tags || [],
      images: req.body.images || [],
      source_code_link: req.body.source_code_link || '',
      source_code_link2: req.body.source_code_link2 || '',
      WebsiteText: req.body.WebsiteText || '',
      order: req.body.order || 0
    });

    // Log the project data before saving
    console.log('Creating project with data:', project);

    // Save the project
    const savedProject = await project.save();

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
    const projectData = req.body;  // Remove the spread operator here
    const project = await Project.findByIdAndUpdate(
      req.params.id, 
      projectData, 
      { new: true }
    );
    res.json(project);  // Add this line to send response

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
  const cert = new Certification(req.body);
  await cert.save();
  res.json(cert);
});

app.put('/api/certifications/:id', auth, async (req, res) => {
  try {
    const cert = await Certification.findByIdAndUpdate(
      req.params.id,
      req.body,
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
  res.json({ message: 'Chat endpoint is working. Use POST to send messages. Version: 2.0' });
});

// Chat endpoint with OpenRouter AI (MiniMax model)
app.post('/api/chat', async (req, res) => {
  try {
    console.log('=== CHAT ENDPOINT HIT ===');
    const { message } = req.body || {};
    
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
      const points = (exp.points || []).map(p => sanitize(p?.text)).filter(Boolean).join(' ');
      return `${formatTimelineEntry(exp)}${points ? ` Highlights: ${points}` : ''}`;
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

    // Build the context prompt for OpenRouter
    const contextPrompt = `You are an AI assistant embedded in Tiago Dias's professional portfolio website (https://tiago-dias.onrender.com/). Visitors are ALREADY on this website talking to you through the chat widget.

IMPORTANT CONTEXT AWARENESS:
- The visitor is ALREADY browsing Tiago's portfolio website right now
- DO NOT tell them to "visit the portfolio website" - they are already here!
- Instead, guide them to specific sections on THIS website (Contact section, Projects section, etc.)
${willShowActionButtons ? '- CRITICAL INSTRUCTION: Interactive action buttons will appear BELOW your message that the user can click. ABSOLUTELY DO NOT write any URLs, links, web addresses, LinkedIn URLs (like linkedin.com/in/...), GitHub links (like github.com/...), or mention "button at the top of this page" in your text response. DO NOT write out any clickable links or URLs at all. The buttons will handle all actions automatically. Just describe what they can do without providing the actual links!' : '- When mentioning the CV, say "You can download his CV using the button at the top of this page"'}

IMPORTANT ABOUT AUTO-SCROLL: ${scrollTarget ? `The page WILL automatically scroll to the "${scrollTarget}" section when you respond.${filterTag ? ` Additionally, the projects will be automatically filtered to show only ${filterTag} projects.` : ''}` : 'No auto-scrolling will occur for this question.'}

CRITICAL RESPONSE GUIDELINES:
${scrollTarget ? `- Since the page will scroll to the ${scrollTarget} section${filterTag ? ` and filter by ${filterTag}` : ''}, acknowledge this with: "I've scrolled to the ${scrollTarget.charAt(0).toUpperCase() + scrollTarget.slice(1)} section${filterTag ? ` and filtered the projects to show ${filterTag} projects` : ''} for you!"
- Keep it BRIEF (2-3 sentences max) - visitors can SEE the content on the page
- DON'T list everything in detail since it's already visible` : '- Provide a helpful, concise answer (2-3 sentences)'}
- Only give detailed descriptions if asked about a SPECIFIC item (e.g., "What is Sonar?")
- For general questions about Tiago, you can provide a summary

RESPONSE LENGTH: Keep ALL responses SHORT and CONCISE (2-3 sentences maximum). Be friendly but brief. Users prefer quick, direct answers.

IMPORTANT: Always refer to Tiago in the THIRD PERSON (use "he", "his", "Tiago", not "you" or "your"). You are speaking TO the visitor ABOUT Tiago, not speaking to Tiago himself.

Answer questions about Tiago's background, projects, skills, experience, education, and certifications based ONLY on the information provided below. Be conversational, professional, and concise.

PROFESSIONAL SUMMARY:
Title: Gen AI Software Engineer
${aboutText || 'Software professional focused on building impactful solutions with expertise in Generative AI, full-stack development, and system modernization.'}

CONTACT INFORMATION:
${aboutEmail ? `Direct Email: ${aboutEmail}` : ''}
LinkedIn: https://www.linkedin.com/in/tiagofdias
Contact Form: Available in the Contact section on this page
CV Download: Use the "Download CV" button at the top of this page
GitHub: Projects section on this page shows GitHub links

IMPORTANT FOR CONTACT QUESTIONS: When someone asks how to contact Tiago:
- Tell them "I've automatically scrolled the page to the Contact section for you" or "The page has been scrolled to the Contact section - you can fill out the form right there"
- The chat widget AUTOMATICALLY scrolls to the relevant section, so DON'T tell them to scroll manually
- Mention they can also connect via LinkedIn at https://www.linkedin.com/in/tiagofdias
- Remind them they can download his CV using the button at the top of THIS page
- DO NOT say "visit the portfolio website" or "scroll down" - they are already on the page and it auto-scrolls!

LANGUAGES:
Portuguese: Native (C2)
English: Advanced (C1)
${(aboutData.languages || []).length > 2 ? `Additional: ${(aboutData.languages || []).slice(2).join(', ')}` : ''}

TIAGO'S PROJECTS (${projects.length}):
${projectsContext || 'No projects listed yet.'}

TIAGO'S PROFESSIONAL EXPERIENCE (${proExps.length}):
${experienceContext || 'No experience listed yet.'}

TIAGO'S EDUCATION (${education.length}):
${educationContext || 'No education listed yet.'}

TIAGO'S CERTIFICATIONS (${certifications.length}):
${certificationsContext || 'No certifications listed yet.'}

TIAGO'S ARTICLES (${articles.length}):
${articlesContext || 'No articles listed yet.'}

INTERPERSONAL SKILLS:
Analytical Skills, Interpersonal Relationships, Problem Solving, Teamwork, Communication

User Question: ${message}

Provide a helpful, accurate response in THIRD PERSON about Tiago based on the above information:`;

    // Try to use OpenRouter AI (MiniMax model) for intelligent responses
    try {
      const fetch = require('node-fetch');
      
      console.log('Calling OpenRouter AI (MiniMax)...');
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://tiagofdias.com',
          'X-Title': 'Tiago Dias Portfolio'
        },
        body: JSON.stringify({
          model: 'minimax/minimax-m2:free',
          messages: [
            {
              role: 'system',
              content: contextPrompt
            },
            {
              role: 'user',
              content: message
            }
          ]
        })
      });

      const data = await response.json();
      console.log('OpenRouter response received');
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        aiResponse = data.choices[0].message.content;
        
        // Remove <think> tags and their content from the response
        aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
        
        // If action buttons will be shown, strip any URLs from the response as a safety net
        if (willShowActionButtons) {
          console.log('Stripping URLs from response. willShowActionButtons:', willShowActionButtons);
          console.log('Original response:', aiResponse);
          
          // Remove URLs (http://, https://, www.) - more aggressive matching
          aiResponse = aiResponse.replace(/https?:\/\/[^\s,;.!?]+\.?/gi, '');
          aiResponse = aiResponse.replace(/www\.[^\s,;.!?]+\.?/gi, '');
          
          // Remove common phrases about buttons and links
          aiResponse = aiResponse.replace(/\s*(at|on|in|via|through|using|clicking|click)\s+(the\s+)?(link|button|url)\s+(at\s+)?(the\s+)?(top|bottom|above|below)(\s+of\s+(this|the)\s+page)?/gi, '');
          aiResponse = aiResponse.replace(/\s*using the button at the (top|bottom)/gi, '');
          aiResponse = aiResponse.replace(/\s*at the (top|bottom) of (this|the) page/gi, '');
          
          // Remove phrases like "connect via LinkedIn at" or "através do LinkedIn em"
          aiResponse = aiResponse.replace(/(connect|conectar|contatar)\s+(via|through|at|em|no)\s+(LinkedIn|GitHub|his\s+LinkedIn|o\s+LinkedIn)/gi, '');
          
          // Clean up any leftover punctuation and double spaces
          aiResponse = aiResponse.replace(/\s*[,;]\s*\./g, '.'); // Fix ", ." or "; ."
          aiResponse = aiResponse.replace(/\.\s*\./g, '.'); // Fix ".."
          aiResponse = aiResponse.replace(/\s+/g, ' ').trim();
          
          console.log('After URL stripping:', aiResponse);
        }
      } else {
        throw new Error('Invalid response format from OpenRouter');
      }
    } catch (aiError) {
      console.error('OpenRouter AI error:', aiError);
      
      // Fallback to rule-based responses if AI fails
      if (matchedProject) {
        aiResponse = describeProject(matchedProject);
      } else if (matchedCertification) {
        aiResponse = describeCertification(matchedCertification);
      } else if (matchedExperience) {
        aiResponse = describeExperience(matchedExperience);
      } else if (matchedEducation) {
        aiResponse = describeEducation(matchedEducation);
      } else if (matchedArticle) {
        aiResponse = describeArticle(matchedArticle);
      } else if (rankedKnowledge.length > 0) {
        const topScore = rankedKnowledge[0].score;
        const topMatches = rankedKnowledge.filter(item => item.score === topScore).slice(0, 2);
        aiResponse = topMatches.map(item => item.detail).join(' ');
      } else {
        aiResponse = respondWithOverview();
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
    } else if (aiResponseLower.includes('about section') || mentionsExperience || mentionsEducation ||
               aiResponseLower.includes('worked at') || aiResponseLower.includes('trabalhou') ||
               aiResponseLower.includes('career') || aiResponseLower.includes('timeline')) {
      scrollTarget = 'about';
      shouldExpandTimeline = true;
      console.log('  → Detected: Experience/About section');
    }
    
    // Detect if AI mentions LinkedIn (means user asking about contact/LinkedIn)
    if (aiResponseLower.includes('linkedin') || aiResponseLower.includes('linked in')) {
      scrollTarget = 'contact';
      willShowActionButtons = true;
      actionButtons = [
        {
          type: 'url',
          icon: '💼',
          label: 'LinkedIn',
          action: 'https://www.linkedin.com/in/tiagofaldias'
        },
        {
          type: 'download',
          icon: '📄',
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
            icon: '💻',
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
            icon: '🔗',
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
          icon: '🎓',
          label: 'View Certificate',
          action: matchedCertification.pdfPath
        }
      ];
    }

    res.json({ 
      response: aiResponse,
      scrollTarget: scrollTarget,
      shouldExpandTimeline: shouldExpandTimeline,
      detectedLanguage: detectedLanguage,
      filterTag: filterTag,
      actionButtons: actionButtons
    });
    
    console.log('=== RESPONSE SENT TO FRONTEND ===');
    console.log('scrollTarget:', scrollTarget);
    console.log('shouldExpandTimeline:', shouldExpandTimeline);
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