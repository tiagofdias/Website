const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  projectid: { type: String, unique: true },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true
  },
  enabled: { 
    type: Boolean, 
    default: false,
    required: true
  },
  tags: [{
    name: {
      type: String,
      required: true,
      trim: true
    }
  }],
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        // Allow both HTTP(S) URLs and base64 data URLs
        return !v || /^(http|https|data):\/\/[^ "]+$/.test(v) || /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(v);
      },
      message: props => `${props.value} is not a valid URL or base64 image!`
    }
  }],
  pdf_links: [String], // Array of PDF URLs to extract images from (Google Drive or other sources)
  source_code_link: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^(http|https):\/\/[^ "]+$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  source_code_link2: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^(http|https):\/\/[^ "]+$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  WebsiteText: {
    type: String,
    trim: true
  },
  order: { 
    type: Number, 
    default: 0,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes
ProjectSchema.index({ order: 1, _id: 1 });

// Middleware to ensure enabled is set before saving
ProjectSchema.pre('save', function(next) {
  if (this.enabled === undefined) {
    this.enabled = true;
  }
  next();
});

const CertificationSchema = new mongoose.Schema({
  name: String,
  description: String,
  tags: [{ name: String, link: String, color: String }],
  images: [String], // Array of base64 encoded images (data:image/jpeg;base64,...)
  pdf_links: [String], // Array of PDF URLs to extract images from (Google Drive or other sources)
  source_code_link2: String,
  order: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true }
});

const ProExpSchema = new mongoose.Schema({
  title: String,
  titleLink: String,
  company_name: String,
  companyLink: String,
  date: String,
  points: [{ text: String }],
  order: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true }
});

const EducationSchema = new mongoose.Schema({
  title: String,
  titleLink: String,
  company_name: String,
  companyLink: String,
  date: String,
  points: [{ text: String }],
  order: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true }
});

const ArticleSchema = new mongoose.Schema({
  articleid: { type: String, unique: true },
  title: String,
  url: String,
  image_url: String,
  order: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true }
});

const AboutSchema = new mongoose.Schema({
  content: [
    {
      text: { type: String, required: true },
      bold: { type: Boolean, default: false },
      link: { type: String, default: null },
      color: { type: String, default: null },
      hovercolor: { type: String, default: null },
    }
  ],
  skills: { type: String, default: "" },
  languages: [{ type: String }],
  PDFCV: { type: String, default: "" } // Move PDFCV here as a top-level field
});

// AI Chat Log Schema for tracking chat interactions
const AIChatLogSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true
  },
  userQuestion: {
    type: String,
    required: true
  },
  aiResponse: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userAgent: String,
  responseTime: Number, // in milliseconds
  tokenCount: Number
}, { timestamps: true });

// Visitor Log Schema for tracking website visitors
const VisitorLogSchema = new mongoose.Schema({
  // Basic Info
  ip: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Page Info
  page: {
    type: String,
    required: true
  },
  referrer: String,
  
  // Browser & Device Info
  userAgent: String,
  browser: String,
  browserVersion: String,
  os: String,
  osVersion: String,
  device: String, // desktop, mobile, tablet
  
  // Screen Info
  screenWidth: Number,
  screenHeight: Number,
  viewportWidth: Number,
  viewportHeight: Number,
  
  // Location & Language
  language: String,
  languages: [String],
  timezone: String,
  
  // Geographic Data (to be populated from IP lookup)
  country: String,
  countryCode: String,
  region: String,
  city: String,
  latitude: Number,
  longitude: Number,
  
  // Tracking Info
  isNewVisitor: {
    type: Boolean,
    default: true
  },
  visitCount: {
    type: Number,
    default: 1
  },
  
  // Time Tracking
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  timeOnPage: {
    type: Number, // in seconds
    default: 0
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Add compound indexes for better query performance
VisitorLogSchema.index({ timestamp: -1, ip: 1 });
VisitorLogSchema.index({ sessionId: 1, timestamp: -1 });
VisitorLogSchema.index({ page: 1, timestamp: -1 });

// Settings Schema - Store application settings
const SettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  value: {
    type: String,
    required: true
  },
  description: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = {
  Project: mongoose.model('Project', ProjectSchema),
  Certification: mongoose.model('Certification', CertificationSchema),
  ProExp: mongoose.model('ProExp', ProExpSchema),
  Education: mongoose.model('Education', EducationSchema),
  Article: mongoose.model('Article', ArticleSchema),
  About: mongoose.model('About', AboutSchema),
  AIChatLog: mongoose.model('AIChatLog', AIChatLogSchema),
  VisitorLog: mongoose.model('VisitorLog', VisitorLogSchema),
  Settings: mongoose.model('Settings', SettingsSchema)
};