require('dotenv').config();
const mongoose = require('mongoose');
const { Concept, Question } = require('./config/db');

async function addProblem() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let concept = await Concept.findOne({ name: 'Strings' });
    if (!concept) {
      concept = await Concept.create({ name: 'Strings', description: 'String manipulation problems', icon: '📝' });
      console.log('Created concept: Strings');
    }

    const existingProb = await Question.findOne({ title: 'Reverse a String' });
    if (existingProb) {
      console.log('Problem already exists!');
      process.exit(0);
    }

    await Question.create({
      concept_id: concept._id,
      title: 'Reverse a String',
      difficulty: 'Easy',
      statement: 'Write a function that reverses a string. Return the reversed string.',
      constraints: '1 <= s.length <= 10^5\ns consists of printable ascii characters.',
      input_format: 'A single string s.',
      output_format: 'The reversed string.',
      public_testcases: [
        { input: 'hello', expected_output: 'olleh' },
        { input: 'Hannah', expected_output: 'hannaH' }
      ],
      hidden_testcases: [
        { input: 'a', expected_output: 'a' },
        { input: '12345', expected_output: '54321' }
      ],
      starterTemplates: {
        javascript: `// Reverse a String - JavaScript\nconst s = __readline__();\n\nfunction reverseString(s) {\n    return s.split('').reverse().join('');\n}\n\nconsole.log(reverseString(s));`,
        python: `# Reverse a String - Python\ns = input()\n\ndef reverse_string(s):\n    return s[::-1]\n\nprint(reverse_string(s))`,
        java: `import java.util.*;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        System.out.println(new StringBuilder(s).reverse().toString());\n    }\n}`
      },
      companies: ['Amazon', 'Microsoft', 'Apple']
    });

    console.log('Successfully added "Reverse a String" problem!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

addProblem();
