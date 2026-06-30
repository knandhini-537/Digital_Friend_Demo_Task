import { getMockResponse } from './mockAgent.js';

console.log("=== Testing Mock Support Agent ===");

const testQueries = [
  "Hello, who are you?",
  "What services do you offer?",
  "How much do you charge for website design?",
  "Can I apply for an internship?",
  "How do I contact you?",
  "What is Digital Friend?"
];

testQueries.forEach((q) => {
  console.log(`\nUser: ${q}`);
  const response = getMockResponse(q);
  console.log(`Agent: ${response}`);
  const wordCount = response.split(/\s+/).length;
  console.log(`[Word Count: ${wordCount}]`);
  
  if (wordCount > 150) {
    console.error("❌ ERROR: Response exceeds 150 words limit!");
  } else {
    console.log("✅ OK: Under 150 words constraint");
  }
});
