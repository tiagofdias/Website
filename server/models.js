const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: String,
  description: String,
  tags: [{ name: String }],
  images: [String],
  source_code_link: String,
  source_code_link2: String,
  WebsiteText: String,
  order: { type: Number, default: 0 },
});

const CertificationSchema = new mongoose.Schema({
  name: String,
  description: String,
  tags: [{ name: String, link: String, color: String }],
  images: [String],
  source_code_link2: String,
  order: { type: Number, default: 0 },
});

const ProExpSchema = new mongoose.Schema({
  title: String,
  titleLink: String,
  company_name: String,
  companyLink: String,
  date: String,
  points: [{ text: String }],
  order: { type: Number, default: 0 },
});

const EducationSchema = new mongoose.Schema({
  title: String,
  titleLink: String,
  company_name: String,
  companyLink: String,
  date: String,
  points: [{ text: String }],
  order: { type: Number, default: 0 },
});

const ArticleSchema = new mongoose.Schema({
  articleid: { type: String, unique: true },
  title: String,
  url: String,
  image_url: String,
  order: { type: Number, default: 0 },
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