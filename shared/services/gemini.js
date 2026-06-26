const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✨ Gemini Generative AI SDK initialized successfully.');
  } catch (e) {
    console.error('❌ Failed to initialize Gemini API Client. Check API Key.', e);
  }
} else {
  console.warn('⚠️ GEMINI_API_KEY environment variable is missing. Running in Realistic Mock AI Mode.');
}

/**
 * Clean JSON output from Gemini response (removes ```json markdown blocks)
 */
function cleanJsonString(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

/**
 * ATS Resume Scanner Service
 */
async function analyzeResume(resumeText) {
  if (!genAI) {
    return getMockATSReport(resumeText);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a professional HR recruiter and ATS (Applicant Tracking System) software parser.
Analyze the following resume text and assess its suitability for a fresher Software Engineer, Web Developer, or Data Engineer role.

Provide a comprehensive rating and advice. Your output MUST be a valid JSON object ONLY. Do not wrap it in other text.
The JSON structure should be:
{
  "atsScore": 72,
  "skills": ["JavaScript", "React.js", "Node.js", "SQL", "Git"],
  "missingKeywords": ["Docker", "TypeScript", "REST APIs", "Unit Testing", "CI/CD"],
  "suggestions": [
    "Include quantitative achievements, e.g., 'Optimized query latency by 20%'.",
    "Add more details about backend integrations in your project description.",
    "Place technical skills in a prominent, dedicated section at the top of the page."
  ]
}

Resume Text:
${resumeText}

Analyze carefully and return only the raw JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = cleanJsonString(response.text());
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini ATS analyze error:', error);
    return getMockATSReport(resumeText);
  }
}

/**
 * AI Mock Interview Question Generator / Feedback
 */
async function getInterviewFeedback(interviewType, history = [], latestAnswer = '') {
  if (!genAI) {
    return getMockInterviewStep(interviewType, history, latestAnswer);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const formattedHistory = history.map(h => `${h.role === 'user' ? 'Candidate' : 'Interviewer'}: ${h.content}`).join('\n');
    
    const prompt = `You are an expert interviewer conducting a ${interviewType} placement interview for a fresher software engineering candidate.
${latestAnswer ? `The candidate just answered the previous question with: "${latestAnswer}"` : `This is the start of the interview. Generate the opening question.`}

Based on the interview history so far:
${formattedHistory}

Generate the next question, short feedback on their last answer (if any), and performance ratings for the last answer.
Your response MUST be a valid JSON object ONLY, with the following format:
{
  "question": "The next question you want to ask...",
  "feedback": "Brief feedback about their previous answer (e.g. Good explanation, but missed discussing indexing details). Empty if this is the start.",
  "score": 8,
  "communicationScore": 7,
  "technicalScore": 8,
  "confidenceScore": 9
}

Provide realistic grades (0-10) and professional questions. If the interview is nearing the end (typically after 4-5 questions), you can state that the interview is complete in the question field.
Return ONLY raw JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = cleanJsonString(response.text());
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini Interview error:', error);
    return getMockInterviewStep(interviewType, history, latestAnswer);
  }
}

/**
 * AI Placement Mentor Service
 */
async function getMentorPlan(readinessScore, solvedProblemsCount, mcqStats = {}) {
  if (!genAI) {
    return getMockMentorPlan(readinessScore, solvedProblemsCount, mcqStats);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert placement officer and coding mentor. A student is preparing for campus recruitments.
Here are their current achievements:
- Placement Readiness Score: ${readinessScore}/100
- Solved Coding Problems: ${solvedProblemsCount}
- MCQ Tests Completed: ${mcqStats.topicsCompleted?.length || 0} topics, with ${mcqStats.correctAnswers || 0} correct answers out of ${mcqStats.totalAttempted || 0} attempts.

Provide a personalized evaluation and 7-day study plan.
Your response MUST be a valid JSON object ONLY, with the following format:
{
  "weakTopicAnalysis": "Based on stats, you need to focus on X and practice Y. Your coding count is solid but your verbal MCQs need improvements.",
  "companyRecommendations": [
    { "name": "TCS", "suitability": "High", "reason": "Cognitive aptitude is strong. Good match for TCS NQT cognitive rounds." },
    { "name": "Amazon", "suitability": "Medium", "reason": "Good foundational coding progress, but requires advanced graph and dynamic programming practice." }
  ],
  "studyPlan": [
    { "day": "Day 1", "topic": "Data Structures - Trees & Graphs", "details": "Solve at least 3 Tree traversal questions and review DFS basics." },
    { "day": "Day 2", "topic": "Aptitude - Time & Work", "details": "Practice TCS NQT style numerical ability calculations." }
  ]
}

Return ONLY raw JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = cleanJsonString(response.text());
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini Mentor error:', error);
    return getMockMentorPlan(readinessScore, solvedProblemsCount, mcqStats);
  }
}

// ----------------------------------------------------
// Fallback Heuristics & Realistic Mock Providers
// ----------------------------------------------------

function getMockATSReport(text) {
  // Simple keyword matching heuristic
  const keywords = ['React', 'Node', 'Express', 'SQL', 'MongoDB', 'Python', 'Java', 'Git', 'HTML', 'CSS', 'JavaScript'];
  const extracted = [];
  const lowerText = text.toLowerCase();
  
  keywords.forEach(kw => {
    if (lowerText.includes(kw.toLowerCase())) {
      extracted.push(kw);
    }
  });

  const missing = keywords.filter(kw => !extracted.includes(kw)).slice(0, 4);
  
  // Calculate score based on extracted keywords count
  let score = 40 + (extracted.length * 6);
  if (score > 95) score = 95;

  return {
    atsScore: score,
    skills: extracted.length > 0 ? extracted : ['JavaScript', 'HTML', 'CSS'],
    missingKeywords: missing.length > 0 ? missing : ['Docker', 'REST APIs', 'Unit Testing'],
    suggestions: [
      'Structure your achievements using the STAR methodology (Situation, Task, Action, Result).',
      'Add a dedicated skills summary matrix section near the top of your resume.',
      'Explicitly list cloud platforms (e.g. AWS) or source control tools (e.g. Git) if you have used them.',
      'Ensure standard PDF typography without complex layout columns that confuse modern ATS parsers.'
    ]
  };
}

const mockQuestions = {
  "HR": [
    "Tell me about yourself and your background.",
    "Why do you want to join our company?",
    "Describe a conflict you had during a team project and how you resolved it.",
    "What are your greatest strengths and weaknesses?",
    "Where do you see yourself in 5 years?",
    "Interview Complete! Thank you for your responses."
  ],
  "Technical": [
    "What is the difference between compiler and interpreter?",
    "Can you explain the difference between a primary key and a unique key in SQL?",
    "What is garbage collection in programming languages like Java or JS?",
    "How does virtual memory function in modern operating systems?",
    "What are RESTful APIs and what HTTP methods do they support?",
    "Interview Complete! Thank you for your responses."
  ],
  "Coding": [
    "Explain how you would check if a given string is a palindrome.",
    "What is the time complexity of searching in a binary search tree?",
    "How do you implement a queue using two stacks?",
    "Explain the concept of memoization in Dynamic Programming.",
    "Interview Complete! Thank you for your responses."
  ],
  "System Design": [
    "How would you design a URL shortening service like TinyURL?",
    "What is horizontal vs vertical scaling, and how does database sharding work?",
    "Design a rate limiter middleware for public APIs.",
    "How would you handle caching to speed up read-heavy global applications?",
    "Interview Complete! Thank you for your responses."
  ]
};

function getMockInterviewStep(type, history = [], latestAnswer = '') {
  const qList = mockQuestions[type] || mockQuestions["HR"];
  
  // Find current question index based on user inputs
  const userAnswersCount = history.filter(h => h.role === 'user').length;
  
  const question = qList[Math.min(userAnswersCount, qList.length - 1)];
  
  if (userAnswersCount === 0) {
    return {
      question: qList[0],
      feedback: "",
      score: 10,
      communicationScore: 10,
      technicalScore: 10,
      confidenceScore: 10
    };
  }

  // Generate realistic scores based on answer length
  const ansLength = latestAnswer.length;
  const score = ansLength > 100 ? 8 : ansLength > 40 ? 7 : 5;
  
  return {
    question: question,
    feedback: ansLength > 40 
      ? "Good answer. You phrased the core concept well. Make sure to touch upon edge cases in your next answer."
      : "Your answer was a bit brief. Try to explain with a concrete example or mention performance trade-offs.",
    score: score,
    communicationScore: Math.min(10, score + 1),
    technicalScore: score,
    confidenceScore: Math.min(10, score + 2)
  };
}

function getMockMentorPlan(score, solvedCount, mcqStats) {
  return {
    weakTopicAnalysis: `Your placement readiness is at ${score}%. With ${solvedCount} coding problems solved and ${mcqStats.topicsCompleted?.length || 0} MCQ topics tested, your basics are developing well. Focus on improving speed in Aptitude calculations, and practice writing clear runtime explanations for code submissions.`,
    companyRecommendations: [
      { name: "TCS", suitability: "High", reason: "Numerical and reasoning basics are in place. Good fit for Cognitive rounds." },
      { name: "Infosys", suitability: "High", reason: "Logical patterns fit the Infosys pseudo-coding sections." },
      { name: "Cognizant", suitability: "Medium", reason: "Requires building confidence in live technical chats." },
      { name: "Accenture", suitability: "Medium", reason: "Needs deeper coverage of cloud basics and MS Office concepts." },
      { name: "Amazon", suitability: "Low", reason: "Needs to solve at least 25+ Medium/Hard coding questions before qualifying for OA stages." }
    ],
    studyPlan: [
      { day: "Day 1", topic: "Quantitative Aptitude - Averages & Percentages", details: "Review basic shortcut formulas and solve 15 TCS NQT practice questions." },
      { day: "Day 2", topic: "Basic Coding - String Manipulation", details: "Solve 'Reverse a String' and 'Palindrome' problems in your chosen language." },
      { day: "Day 3", topic: "DBMS - SQL Queries & Joins", details: "Solve SQL MCQ practice questions. Practice INNER JOIN and GROUP BY syntax." },
      { day: "Day 4", topic: "Operating Systems - Paging & Scheduling", details: "Review CPU scheduling concepts (Round Robin, FCFS) and memory paging schemas." },
      { day: "Day 5", topic: "AI Mock Interview practice", details: "Complete a full 15-minute mock Technical Interview on our AI module." },
      { day: "Day 6", topic: "TCS NQT Full Mock Exam", duration: 120, details: "Attempt a full-length timed mock exam on the placement dashboard." },
      { day: "Day 7", topic: "ATS Resume Tuning", details: "Upload your resume, analyze keyword gaps, and apply recommendations." }
    ]
  };
}

module.exports = {
  analyzeResume,
  getInterviewFeedback,
  getMentorPlan
};
