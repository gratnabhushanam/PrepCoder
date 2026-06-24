const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isJSONDb = false;
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists for JSON fallback
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read and write JSON files
const jsonDb = {
  read(collection) {
    const filePath = path.join(DATA_DIR, `${collection}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error reading ${collection}.json`, e);
      return [];
    }
  },
  write(collection, data) {
    const filePath = path.join(DATA_DIR, `${collection}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
};

// Database connection initialization
async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petadoption';
  if (process.env.DB_TYPE === 'json') {
    console.log('⚠️ Database configured to run in JSON local file mode.');
    isJSONDb = true;
    return;
  }
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('⚡ Connected to MongoDB successfully.');
  } catch (err) {
    console.warn('⚠️ Could not connect to MongoDB. Falling back to local JSON file-based database.');
    isJSONDb = true;
  }
}

// ----------------------------------------------------
// Core Schemas & Fallback Models Implementation
// ----------------------------------------------------

// 1. Users Collection Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  readinessScore: { type: Number, default: 45 },
  dailyStreak: { type: Number, default: 0 },
  solvedProblems: [{ type: String }],
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

const UserMongoose = mongoose.models.User || mongoose.model('User', UserSchema);

const UserStore = {
  async findOne(query) {
    if (!isJSONDb) return await UserMongoose.findOne(query);
    const users = jsonDb.read('users');
    return users.find(u => {
      for (let key in query) {
        if (u[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  },
  async findById(id) {
    if (!isJSONDb) return await UserMongoose.findById(id);
    const users = jsonDb.read('users');
    return users.find(u => u._id === id) || null;
  },
  async create(userData) {
    if (!isJSONDb) {
      const newUser = new UserMongoose(userData);
      return await newUser.save();
    }
    const users = jsonDb.read('users');
    const newUser = {
      _id: Date.now().toString(),
      createdAt: new Date(),
      readinessScore: 45,
      dailyStreak: 0,
      solvedProblems: [],
      mcqStats: { totalAttempted: 0, correctAnswers: 0, topicsCompleted: [] },
      aiInterviewStats: [],
      ...userData
    };
    users.push(newUser);
    jsonDb.write('users', users);
    return newUser;
  },
  async findByIdAndUpdate(id, update, options = {}) {
    if (!isJSONDb) return await UserMongoose.findByIdAndUpdate(id, update, { new: true, ...options });
    const users = jsonDb.read('users');
    const index = users.findIndex(u => u._id === id);
    if (index === -1) return null;
    
    // Simple update logic ($set or direct properties)
    const current = users[index];
    const updateFields = update.$set || update;
    
    // Apply updates
    const updated = { ...current, ...updateFields };
    
    // Special handling for array push, like solvedProblems or stats
    if (update.$push) {
      for (let key in update.$push) {
        if (!updated[key]) updated[key] = [];
        updated[key].push(update.$push[key]);
      }
    }
    
    users[index] = updated;
    jsonDb.write('users', users);
    return updated;
  },
  async find() {
    if (!isJSONDb) return await UserMongoose.find();
    return jsonDb.read('users');
  }
};

// 2. MCQs Collection Schema
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

const McqMongoose = mongoose.models.Mcq || mongoose.model('Mcq', McqSchema);

const McqStore = {
  async find(query = {}) {
    if (!isJSONDb) return await McqMongoose.find(query);
    const mcqs = jsonDb.read('mcqs');
    return mcqs.filter(m => {
      for (let key in query) {
        if (m[key] !== query[key]) return false;
      }
      return true;
    });
  },
  async create(mcqData) {
    if (!isJSONDb) {
      const newMcq = new McqMongoose(mcqData);
      return await newMcq.save();
    }
    const mcqs = jsonDb.read('mcqs');
    const newMcq = { _id: Date.now().toString() + Math.random().toString(36).substr(2, 5), createdAt: new Date(), updatedAt: new Date(), ...mcqData };
    mcqs.push(newMcq);
    jsonDb.write('mcqs', mcqs);
    return newMcq;
  },
  async findByIdAndUpdate(id, update, options = {}) {
    if (!isJSONDb) return await McqMongoose.findByIdAndUpdate(id, update, { new: true, ...options });
    const mcqs = jsonDb.read('mcqs');
    const index = mcqs.findIndex(m => m._id === id);
    if (index === -1) return null;
    
    const current = mcqs[index];
    const updateFields = update.$set || update;
    
    const updated = { ...current, ...updateFields, updatedAt: new Date() };
    mcqs[index] = updated;
    jsonDb.write('mcqs', mcqs);
    return updated;
  },
  async insertMany(list) {
    if (!isJSONDb) return await McqMongoose.insertMany(list);
    const mcqs = jsonDb.read('mcqs');
    const records = list.map((item, idx) => ({ _id: (Date.now() + idx).toString() + Math.random().toString(36).substr(2, 5), ...item }));
    mcqs.push(...records);
    jsonDb.write('mcqs', mcqs);
    return records;
  },
  async deleteMany(query) {
    if (!isJSONDb) return await McqMongoose.deleteMany(query);
    if (Object.keys(query).length === 0) {
      jsonDb.write('mcqs', []);
      return { deletedCount: 0 };
    }
    const mcqs = jsonDb.read('mcqs');
    const filtered = mcqs.filter(m => {
      for (let key in query) {
        if (m[key] === query[key]) return false;
      }
      return true;
    });
    jsonDb.write('mcqs', filtered);
    return { deletedCount: mcqs.length - filtered.length };
  }
};

// 3. Problems Collection Schema
const ProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, required: true }, // Easy, Medium, Hard
  category: { type: String },
  testCases: [{
    input: { type: String },
    expected: { type: String },
    isHidden: { type: Boolean, default: false }
  }],
  starterTemplates: {
    javascript: String,
    python: String,
    java: String
  },
  companyTags: [{ type: String }]
});

const ProblemMongoose = mongoose.models.Problem || mongoose.model('Problem', ProblemSchema);

const ProblemStore = {
  async find(query = {}) {
    if (!isJSONDb) return await ProblemMongoose.find(query);
    const problems = jsonDb.read('problems');
    return problems.filter(p => {
      for (let key in query) {
        if (p[key] !== query[key]) return false;
      }
      return true;
    });
  },
  async findById(id) {
    if (!isJSONDb) return await ProblemMongoose.findById(id);
    const problems = jsonDb.read('problems');
    return problems.find(p => p._id === id) || null;
  },
  async create(probData) {
    if (!isJSONDb) return await (new ProblemMongoose(probData)).save();
    const problems = jsonDb.read('problems');
    const newProb = { _id: Date.now().toString(), ...probData };
    problems.push(newProb);
    jsonDb.write('problems', problems);
    return newProb;
  },
  async insertMany(list) {
    if (!isJSONDb) return await ProblemMongoose.insertMany(list);
    const problems = jsonDb.read('problems');
    const records = list.map((item, idx) => ({ _id: (Date.now() + idx).toString(), ...item }));
    problems.push(...records);
    jsonDb.write('problems', problems);
    return records;
  },
  async deleteMany(query) {
    if (!isJSONDb) return await ProblemMongoose.deleteMany(query);
    if (Object.keys(query).length === 0) {
      jsonDb.write('problems', []);
      return { deletedCount: 0 };
    }
    const problems = jsonDb.read('problems');
    const filtered = problems.filter(p => {
      for (let key in query) {
        if (p[key] === query[key]) return false;
      }
      return true;
    });
    jsonDb.write('problems', filtered);
    return { deletedCount: problems.length - filtered.length };
  }
};

// 4. Submissions Schema
const SubmissionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String },
  problemId: { type: String, required: true },
  problemTitle: { type: String },
  code: { type: String, required: true },
  language: { type: String, required: true },
  status: { type: String, required: true }, // Accepted, Wrong Answer, Compilation Error, Runtime Error, Time Limit Exceeded
  passedCases: { type: Number, default: 0 },
  totalCases: { type: Number, default: 0 },
  executionTime: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
});

const SubmissionMongoose = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

const SubmissionStore = {
  async find(query = {}) {
    if (!isJSONDb) return await SubmissionMongoose.find(query).sort({ submittedAt: -1 });
    const subs = jsonDb.read('submissions');
    const filtered = subs.filter(s => {
      for (let key in query) {
        if (s[key] !== query[key]) return false;
      }
      return true;
    });
    return filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  },
  async create(subData) {
    if (!isJSONDb) return await (new SubmissionMongoose(subData)).save();
    const subs = jsonDb.read('submissions');
    const newSub = {
      _id: Date.now().toString(),
      submittedAt: new Date(),
      ...subData
    };
    subs.push(newSub);
    jsonDb.write('submissions', subs);
    return newSub;
  }
};

// 5. Companies Schema
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
    result: String, // Selected, Rejected
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

const CompanyMongoose = mongoose.models.Company || mongoose.model('Company', CompanySchema);

const CompanyStore = {
  async find(query = {}) {
    if (!isJSONDb) return await CompanyMongoose.find(query);
    const comps = jsonDb.read('companies');
    return comps.filter(c => {
      for (let key in query) {
        if (c[key] !== query[key]) return false;
      }
      return true;
    });
  },
  async findOne(query) {
    if (!isJSONDb) return await CompanyMongoose.findOne(query);
    const comps = jsonDb.read('companies');
    return comps.find(c => {
      for (let key in query) {
        if (c[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  },
  async create(compData) {
    if (!isJSONDb) return await (new CompanyMongoose(compData)).save();
    const comps = jsonDb.read('companies');
    const newComp = { _id: Date.now().toString(), ...compData };
    comps.push(newComp);
    jsonDb.write('companies', comps);
    return newComp;
  },
  async insertMany(list) {
    if (!isJSONDb) return await CompanyMongoose.insertMany(list);
    const comps = jsonDb.read('companies');
    const records = list.map((item, idx) => ({ _id: (Date.now() + idx).toString(), ...item }));
    comps.push(...records);
    jsonDb.write('companies', comps);
    return records;
  },
  async deleteMany(query) {
    if (!isJSONDb) return await CompanyMongoose.deleteMany(query);
    if (Object.keys(query).length === 0) {
      jsonDb.write('companies', []);
      return { deletedCount: 0 };
    }
    const comps = jsonDb.read('companies');
    const filtered = comps.filter(c => {
      for (let key in query) {
        if (c[key] === query[key]) return false;
      }
      return true;
    });
    jsonDb.write('companies', filtered);
    return { deletedCount: comps.length - filtered.length };
  }
};

module.exports = {
  connectDB,
  isJSONDb: () => isJSONDb,
  User: UserStore,
  Mcq: McqStore,
  Problem: ProblemStore,
  Submission: SubmissionStore,
  Company: CompanyStore
};
