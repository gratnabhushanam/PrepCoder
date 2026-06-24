const sampleMcqs = [
  {
    question: "Which of the following is NOT a feature of Java?",
    optionA: "Dynamic",
    optionB: "Architecture Neutral",
    optionC: "Use of pointers",
    optionD: "Object-oriented",
    correctAnswer: "C",
    difficulty: "Medium",
    category: "Java",
    points: 1,
    status: "Active",
    description: "Java does not support explicit pointer arithmetic for safety and simplicity reasons."
  },
  {
    question: "What is the size of double variable in Java?",
    optionA: "8 bits",
    optionB: "16 bits",
    optionC: "32 bits",
    optionD: "64 bits",
    correctAnswer: "D",
    difficulty: "Easy",
    category: "Java",
    points: 1,
    status: "Active",
    description: "A double data type in Java is a double-precision 64-bit IEEE 754 floating point."
  },
  {
    question: "Which OOP concept is defined as 'wrapping up of data and methods into a single unit'?",
    optionA: "Inheritance",
    optionB: "Polymorphism",
    optionC: "Encapsulation",
    optionD: "Abstraction",
    correctAnswer: "C",
    difficulty: "Easy",
    category: "OOPs",
    points: 1,
    status: "Active",
    description: "Encapsulation binds data and code together in a single class capsule, protecting it from outside interference."
  },
  {
    question: "What is the full form of ACID in database transactions?",
    optionA: "Atomicity, Consistency, Isolation, Durability",
    optionB: "Access, Control, Integration, Distribution",
    optionC: "Accuracy, Completeness, Indexing, Direct",
    optionD: "Automated, Concurrent, Internal, Deferred",
    correctAnswer: "A",
    difficulty: "Medium",
    category: "DBMS",
    points: 1,
    status: "Active",
    description: "ACID stands for Atomicity, Consistency, Isolation, and Durability, which guarantee database transactions are processed reliably."
  }
];

const sampleProblems = [
  {
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
    difficulty: "Easy",
    category: "Arrays",
    testCases: [
      { input: "[2, 7, 11, 15]\n9", expected: "[0, 1]", isHidden: false },
      { input: "[3, 2, 4]\n6", expected: "[1, 2]", isHidden: false },
      { input: "[3, 3]\n6", expected: "[0, 1]", isHidden: true }
    ],
    starterTemplates: {
      javascript: `// Two Sum - JavaScript
const nums = JSON.parse(__readline__());
const target = parseInt(__readline__());

function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) return [map.get(diff), i];
        map.set(nums[i], i);
    }
    return [];
}

console.log(JSON.stringify(twoSum(nums, target)));`,
      python: `# Two Sum - Python
import json

nums = json.loads(input())
target = int(input())

def two_sum(nums, target):
    lookup = {}
    for i, num in enumerate(nums):
        if target - num in lookup:
            return [lookup[target - num], i]
        lookup[num] = i
    return []

print(two_sum(nums, target))`,
      java: `import java.util.*;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line1 = sc.nextLine();
        int target = Integer.parseInt(sc.nextLine());
        int[] nums = Arrays.stream(line1.replaceAll("[\\\\[\\\\]]", "").split(",")).map(String::trim).mapToInt(Integer::parseInt).toArray();
        Map<Integer, Integer> map = new HashMap<>();
        for(int i=0; i<nums.length; i++) {
            if(map.containsKey(target - nums[i])) {
                System.out.println("[" + map.get(target - nums[i]) + ", " + i + "]");
                return;
            }
            map.put(nums[i], i);
        }
    }
}`
    },
    companyTags: ["TCS", "Accenture", "Amazon", "Microsoft"]
  },
  {
    title: "Reverse a String",
    description: "Write a function that reverses a string.",
    difficulty: "Easy",
    category: "Strings",
    testCases: [
      { input: "hello", expected: "olleh", isHidden: false },
      { input: "OpenAI", expected: "IAnepO", isHidden: false },
      { input: "a", expected: "a", isHidden: true }
    ],
    starterTemplates: {
      javascript: `// Reverse a String - JavaScript
const s = __readline__();

function reverseString(s) {
    return s.split('').reverse().join('');
}

console.log(reverseString(s));`,
      python: `# Reverse a String - Python
s = input()

def reverse_string(s):
    return s[::-1]

print(reverse_string(s))`,
      java: `import java.util.*;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        System.out.println(new StringBuilder(s).reverse().toString());
    }
}`
    },
    companyTags: ["TCS", "Infosys", "Wipro", "Cognizant"]
  },
  {
    title: "Length of Longest Substring",
    description: "Find the length of the longest substring without repeating characters.",
    difficulty: "Medium",
    category: "Sliding Window",
    testCases: [
      { input: "abcabcbb", expected: "3", isHidden: false },
      { input: "bbbbb", expected: "1", isHidden: false },
      { input: "pwwkew", expected: "3", isHidden: true }
    ],
    starterTemplates: {
      javascript: `// Length of Longest Substring - JavaScript
const s = __readline__();

function lengthOfLongestSubstring(s) {
    let map = new Map(), max = 0, start = 0;
    for (let i = 0; i < s.length; i++) {
        if (map.has(s[i])) start = Math.max(start, map.get(s[i]) + 1);
        map.set(s[i], i);
        max = Math.max(max, i - start + 1);
    }
    return max;
}

console.log(lengthOfLongestSubstring(s));`,
      python: `# Length of Longest Substring - Python
s = input()

def length_of_longest_substring(s):
    used, start, max_len = {}, 0, 0
    for i, c in enumerate(s):
        if c in used and start <= used[c]:
            start = used[c] + 1
        else:
            max_len = max(max_len, i - start + 1)
        used[c] = i
    return max_len

print(length_of_longest_substring(s))`,
      java: `import java.util.*;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        Map<Character, Integer> map = new HashMap<>();
        int max = 0, start = 0;
        for (int i = 0; i < s.length(); i++) {
            if (map.containsKey(s.charAt(i)))
                start = Math.max(start, map.get(s.charAt(i)) + 1);
            map.put(s.charAt(i), i);
            max = Math.max(max, i - start + 1);
        }
        System.out.println(max);
    }
}`
    },
    companyTags: ["Amazon", "Microsoft", "Flipkart"]
  }
];

const sampleCompanies = [
  {
    name: "TCS",
    examPattern: {
      rounds: [
        { name: "Part A: Cognitive Skills", duration: 120, description: "Numerical Ability, Verbal Ability, Reasoning Ability" },
        { name: "Part B: Programming", duration: 60, description: "Email Writing, MCQ Coding, 2 Hands-on Coding questions" }
      ],
      syllabus: ["Quantitative Aptitude", "Logical Reasoning", "English/Verbal", "C/C++/Java/Python Basic Programming", "Data Structures"],
      difficulty: "Medium"
    },
    previousQuestions: [
      { question: "If the ratio of two numbers is 3:4 and their LCM is 180. Find the sum of numbers?", answer: "LCM of 3x and 4x is 12x. Therefore, 12x = 180 => x = 15. The numbers are 45 and 60. Sum is 105.", year: "2024" },
      { question: "Write a program to check if a number is a Strong Number (sum of factorials of digits equals the number).", answer: "Input: 145. Factorials: 1! + 4! + 5! = 1 + 24 + 120 = 145 (Yes).", year: "2023" }
    ],
    interviewExperiences: [
      { role: "Systems Engineer", experience: "The interview was divided into TR, MR, and HR. Technical round focused on basic Java, DBMS questions, and writing a bubble sort algorithm. MR was situational-based, and HR checked background credentials and flexibility in shift timings.", author: "Pranav M.", result: "Selected", date: "Feb 2025" }
    ],
    technicalQuestions: [
      { question: "What is the difference between Method Overloading and Method Overriding?", answer: "Overloading occurs in the same class with same name but different signatures (compile-time). Overriding happens in sub-classes with same signature (runtime polymorphism).", topic: "OOPs" },
      { question: "What is normalized form in SQL (1NF, 2NF, 3NF)?", answer: "1NF removes duplicate columns. 2NF removes partial dependencies. 3NF removes transitive dependencies to minimize data redundancy.", topic: "DBMS" }
    ],
    hrQuestions: [
      { question: "Why TCS?", answer: "TCS is a global leader and offers an excellent platform for learning. The company's work environment, diversity, and training programs like 'TCS Initial Learning Program (ILP)' are perfect for freshers to start their careers." },
      { question: "Are you willing to relocate?", answer: "Yes, I am completely flexible to relocate to any location as it provides a great opportunity to explore new environments and gain corporate exposure." }
    ]
  },
  {
    name: "Infosys",
    examPattern: {
      rounds: [
        { name: "Online Test", duration: 100, description: "Mathematical Ability, Verbal, Pseudo Code, Puzzle Solving" },
        { name: "Technical & HR Interview", duration: 30, description: "Consolidated online technical/HR interview" }
      ],
      syllabus: ["Maths", "Verbal", "Data Structures", "Pseudo Code reasoning"],
      difficulty: "Medium-Hard"
    },
    previousQuestions: [
      { question: "Solve a puzzle: 5 members of a family are traveling. Group conditions given...", answer: "See detailed reasoning solutions in Infosys puzzle templates.", year: "2024" }
    ],
    interviewExperiences: [
      { role: "System Engineer Specialist", experience: "Coding question in python about string sorting. Simple SQL queries for join. Very friendly interviewer.", author: "Sunita R.", result: "Selected", date: "Jan 2025" }
    ],
    technicalQuestions: [
      { question: "What are static classes in Java?", answer: "In Java, you cannot make top-level classes static. Only nested classes can be static, which means they can be instantiated without an instance of the outer class.", topic: "Java" }
    ],
    hrQuestions: [
      { question: "Where do you see yourself in 5 years?", answer: "In 5 years, I see myself as a senior technical developer or team lead, possessing deep technical knowledge and helping mentor new graduates." }
    ]
  },
  {
    name: "Wipro",
    examPattern: {
      rounds: [
        { name: "Wipro Elite National Talent Hunt", duration: 120, description: "Aptitude, Written English Test (Essay), Coding" }
      ],
      syllabus: ["Quantitative", "Logical", "Verbal", "Coding (2 questions)"],
      difficulty: "Medium"
    },
    previousQuestions: [],
    interviewExperiences: [],
    technicalQuestions: [],
    hrQuestions: []
  },
  {
    name: "Amazon",
    examPattern: {
      rounds: [
        { name: "Online Assessment (OA)", duration: 120, description: "2 Coding Questions + Work Simulation + Code Review" },
        { name: "Technical Interviews (3 Rounds)", duration: 180, description: "Algorithms, System Design, and Leadership Principles" }
      ],
      syllabus: ["Arrays & Hashing", "Graphs & Trees", "Dynamic Programming", "Object Oriented Design"],
      difficulty: "Hard"
    },
    previousQuestions: [
      { question: "Implement a function to find the maximum storage capacity of a grid pattern.", answer: "Use monotonic stack approach or standard sliding window algorithm.", year: "2024" }
    ],
    interviewExperiences: [
      { role: "SDE-1", experience: "Deep focus on Amazon Leadership Principles like Customer Obsession and Bias for Action. Coding questions were graph-related.", author: "Amit S.", result: "Selected", date: "March 2025" }
    ],
    technicalQuestions: [
      { question: "How does a Hash Map work under the hood?", answer: "It uses an array of buckets and a hash function to map keys to bucket indices. Collisions are handled using linked lists or red-black trees (Java 8+).", topic: "Data Structures" }
    ],
    hrQuestions: [
      { question: "Tell me about a time you faced a difficult challenge and how you solved it.", answer: "Discuss using a STAR method (Situation, Task, Action, Result) focusing on your individual contribution." }
    ]
  }
];

// Seed function
async function seedDatabase(db) {
  try {
    const mcqCount = await db.Mcq.find({});
    if (mcqCount.length === 0) {
      console.log('🌱 Seeding MCQ database...');
      await db.Mcq.insertMany(sampleMcqs);
    }
    
    const probCount = await db.Problem.find({});
    if (probCount.length === 0) {
      console.log('🌱 Seeding Coding Problem database...');
      await db.Problem.insertMany(sampleProblems);
    }

    const compCount = await db.Company.find({});
    if (compCount.length === 0) {
      console.log('🌱 Seeding Company database...');
      await db.Company.insertMany(sampleCompanies);
    }
    
    console.log('✅ Database checked/seeded successfully.');
  } catch (err) {
    console.error('❌ Failed to seed database:', err);
  }
}

module.exports = { seedDatabase };
