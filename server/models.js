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
        return !v || /^(http|https):\/\/[^ "]+$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  }],
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
  images: [String],
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

module.exports = {
  Project: mongoose.model('Project', ProjectSchema),
  Certification: mongoose.model('Certification', CertificationSchema),
  ProExp: mongoose.model('ProExp', ProExpSchema),
  Education: mongoose.model('Education', EducationSchema),
  Article: mongoose.model('Article', ArticleSchema),
  About: mongoose.model('About', AboutSchema)
};