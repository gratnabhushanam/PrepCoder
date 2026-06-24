const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Database connection initialization
async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coding_platform';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('⚡ Connected to MongoDB successfully.');
    await seedAdmin();
  } catch (err) {
    console.error('❌ Could not connect to MongoDB:', err.message);
    process.exit(1);
  }
}

// ----------------------------------------------------
// Schemas
// ----------------------------------------------------

// 1. Users Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  readinessScore: { type: Number, default: 45 },
  dailyStreak: { type: Number, default: 0 },
  solvedProblems: [{ type: String }],
  userProgress: {
    total_solved: { type: Number, default: 0 },
    easy_solved: { type: Number, default: 0 },
    medium_solved: { type: Number, default: 0 },
    hard_solved: { type: Number, default: 0 },
    current_streak: { type: Number, default: 0 }
  },
  mcqStats: {
    totalAttempted: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    topicsCompleted: [{ type: String }]
  },
  aiInterviewStats: [{
    interviewType: String,
    score: Number,
    communicationScore: Number,
    technicalScore: Number,
    confidenceScore: Number,
    date: { type: Date, default: Date.now }
  }],
  resumeData: {
    atsScore: Number,
    skills: [String],
    missingKeywords: [String],
    suggestions: [String],
    uploadedAt: Date
  }
});

// Transform _id to id for frontend compatibility
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// 2. Concept Schema
const ConceptSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  icon: { type: String },
  createdAt: { type: Date, default: Date.now }
});

ConceptSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const Concept = mongoose.models.Concept || mongoose.model('Concept', ConceptSchema);

// 3. Question Schema (Replacing the old ProblemSchema)
const QuestionSchema = new mongoose.Schema({
  concept_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Concept' },
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  statement: { type: String, required: true },
  constraints: { type: String },
  input_format: { type: String },
  output_format: { type: String },
  examples: [{ type: mongoose.Schema.Types.Mixed }],
  hints: [{ type: mongoose.Schema.Types.Mixed }],
  editorial: { type: String },
  video_solution: { type: String },
  status: { type: String, enum: ['Active', 'Hidden'], default: 'Active' },
  public_testcases: [{
    input: { type: String, required: true },
    expected_output: { type: String, required: true }
  }],
  hidden_testcases: [{
    input: { type: String, required: true },
    expected_output: { type: String, required: true }
  }],
  companies: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

QuestionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

// 4. Submission Schema
const SubmissionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  status: { type: String, required: true }, // Accepted, Wrong Answer, etc.
  passed_cases: { type: Number, default: 0 },
  total_cases: { type: Number, default: 0 },
  execution_time: { type: Number, default: 0 },
  memory_used: { type: Number, default: 0 },
  submitted_at: { type: Date, default: Date.now }
});

SubmissionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

// 5. MCQs Schema
const McqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  description: { type: String },
  optionA: { type: String, required: true },
  optionB: { type: String, required: true },
  optionC: { type: String, required: true },
  optionD: { type: String, required: true },
  correctAnswer: { type: String, required: true }, // "A", "B", "C", "D"
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  category: { type: String, required: true },
  points: { type: Number, default: 1 },
  status: { type: String, enum: ['Active', 'Draft'], default: 'Active' }
}, { timestamps: true });

McqSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; } });
const Mcq = mongoose.models.Mcq || mongoose.model('Mcq', McqSchema);

// 6. Companies Schema
const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  examPattern: {
    rounds: [{ name: String, duration: Number, description: String }],
    syllabus: [String],
    difficulty: String
  },
  previousQuestions: [{
    question: String,
    answer: String,
    year: String
  }],
  interviewExperiences: [{
    role: String,
    experience: String,
    author: String,
    result: String,
    date: String
  }],
  technicalQuestions: [{
    question: String,
    answer: String,
    topic: String
  }],
  hrQuestions: [{
    question: String,
    answer: String
  }]
});

CompanySchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; } });
const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);

// Admin Seeder
async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@prepai.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPassword, salt);
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: hash,
        role: 'admin'
      });
      console.log(`✅ Seeded admin user: ${adminEmail}`);
    }
  } catch (error) {
    console.error('❌ Failed to seed admin:', error.message);
  }
}

module.exports = {
  connectDB,
  User,
  Concept,
  Question,
  Submission,
  Mcq,
  Company
};
