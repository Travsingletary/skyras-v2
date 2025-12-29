#!/usr/bin/env node

/**
 * Phase 1 Output Quality Validation Script
 * Runs test prompts and scores outputs on 4 criteria
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api/chat';

// Test prompts
const TEST_PROMPTS = [
  "I want to write a blog post",
  "I need to create content for my client",
  "I'm working on a video script",
  "I need to organize my workflow",
  "I have too many projects and don't know where to start",
  "I want to plan my content calendar",
  "I'm stuck on my project",
  "I don't know what to work on next",
  "I feel overwhelmed with all my tasks",
  "What should I work on?",
  "I have an idea but don't know how to start",
  "I want to explore new creative directions",
  "I need to email my client about the project",
  "I want to schedule social media posts",
  "I need to finish my presentation"
];

// Scoring criteria
const CRITERIA = {
  CONCRETE: 'Concrete (specific action, not abstract)',
  SPECIFIC: 'Specific (clear what to do, not general)',
  SMALL: 'Small (one step, not multiple)',
  ACTIONABLE: 'Immediately Actionable (can do it now, not later)'
};

// Helper to check if output is concrete
function isConcrete(output) {
  const abstractPatterns = [
    /think about/i,
    /consider/i,
    /reflect on/i,
    /explore/i,
    /plan/i,
    /strategy/i,
    /approach/i
  ];
  
  const concretePatterns = [
    /^(open|write|email|create|send|call|schedule|block|set|add|remove|delete|update|edit|start|finish|complete|submit|post|publish|draft|save|upload|download)/i,
    /^go to/i,
    /^click on/i,
    /^type/i,
    /^fill out/i
  ];
  
  // Check for abstract patterns (negative)
  if (abstractPatterns.some(pattern => pattern.test(output))) {
    return false;
  }
  
  // Check for concrete action verbs (positive)
  return concretePatterns.some(pattern => pattern.test(output));
}

// Helper to check if output is specific
function isSpecific(output) {
  // Specific outputs have details: names, times, locations, specific actions
  const hasDetails = /(?:at|on|in|by|with|to|from|for)\s+(?:the|your|a|an)\s+[\w\s]+/i.test(output);
  const hasNames = /['"][^'"]+['"]/.test(output) || /\b(?:email|file|folder|document|project|client|meeting|call|post|message)\s+[\w@.-]+/i.test(output);
  const hasNumbers = /\d+/.test(output);
  const hasSpecificTime = /(?:today|tomorrow|this week|next week|in \d+ (?:hours?|minutes?|days?))/i.test(output);
  
  return hasDetails || hasNames || hasNumbers || hasSpecificTime;
}

// Helper to check if output is small (one step)
function isSmall(output) {
  // Count action verbs
  const actionVerbs = output.match(/\b(?:open|write|email|create|send|call|schedule|block|set|add|remove|delete|update|edit|start|finish|complete|submit|post|publish|draft|save|upload|download|go|click|type|fill|then|next|after|before|and|or)\b/gi);
  
  // Check for multi-step indicators
  const multiStepPatterns = [
    /(?:first|then|next|after|before|second|third|finally|step \d+|step 1|step 2)/i,
    /(?:and|or)\s+(?:then|next|after)/i,
    /(?:do|complete|finish)\s+(?:this|that)\s+(?:and|then|before|after)/i
  ];
  
  if (multiStepPatterns.some(pattern => pattern.test(output))) {
    return false;
  }
  
  // If it's a single sentence with one clear action, it's small
  const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 2) {
    return false; // Too many sentences likely means multiple steps
  }
  
  return true;
}

// Helper to check if output is immediately actionable
function isActionable(output) {
  // Check for future-oriented language
  const futurePatterns = [
    /(?:plan|strategy|schedule|calendar|timeline|roadmap|blueprint)/i,
    /(?:later|eventually|someday|in the future|next month|next quarter|next year)/i,
    /(?:think about|consider|explore|research|investigate|analyze)/i
  ];
  
  if (futurePatterns.some(pattern => pattern.test(output))) {
    return false;
  }
  
  // Check for immediate action verbs
  const immediatePatterns = [
    /^(open|write|email|create|send|call|schedule|block|set|add|remove|delete|update|edit|start|finish|complete|submit|post|publish|draft|save|upload|download|go|click|type|fill)/i,
    /^(do|make|take|get|put|move|copy|paste|cut)/i
  ];
  
  return immediatePatterns.some(pattern => pattern.test(output));
}

// Score an output
function scoreOutput(output, prompt) {
  const scores = {
    concrete: isConcrete(output) ? 4 : (output.length > 50 ? 2 : 1),
    specific: isSpecific(output) ? 4 : (output.length > 50 ? 2 : 1),
    small: isSmall(output) ? 4 : (output.includes('and') || output.includes('then') ? 2 : 1),
    actionable: isActionable(output) ? 4 : (output.includes('plan') || output.includes('think') ? 1 : 2)
  };
  
  // Refine scores based on output analysis
  if (scores.concrete === 4 && scores.specific === 4 && scores.small === 4 && scores.actionable === 4) {
    // All pass - verify it's truly a DO statement
    if (!/^(open|write|email|create|send|call|schedule|block|set|add|remove|delete|update|edit|start|finish|complete|submit|post|publish|draft|save|upload|download|go|click|type|fill|do|make|take|get|put|move|copy|paste|cut)/i.test(output.trim())) {
      scores.concrete = 3;
      scores.actionable = 3;
    }
  }
  
  return scores;
}

// Make API call
async function testPrompt(prompt) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        userId: 'public'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    const output = data.data?.output || data.response || data.data?.message?.content || 'No response';
    
    return output;
  } catch (error) {
    console.error(`Error testing prompt "${prompt}":`, error.message);
    return null;
  }
}

// Main validation
async function main() {
  console.log('=== Phase 1 Output Quality Validation ===\n');
  console.log(`API URL: ${API_URL}\n`);
  
  const results = [];
  let passCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < TEST_PROMPTS.length; i++) {
    const prompt = TEST_PROMPTS[i];
    console.log(`\n[${i + 1}/${TEST_PROMPTS.length}] Testing: "${prompt}"`);
    
    const output = await testPrompt(prompt);
    
    if (!output) {
      console.log('❌ Failed to get response');
      failCount++;
      results.push({ prompt, output: null, scores: null, passed: false });
      continue;
    }
    
    console.log(`Output: ${output.substring(0, 200)}${output.length > 200 ? '...' : ''}`);
    
    const scores = scoreOutput(output, prompt);
    const avg = (scores.concrete + scores.specific + scores.small + scores.actionable) / 4;
    const passed = scores.concrete === 4 && scores.specific === 4 && scores.small === 4 && scores.actionable === 4;
    
    console.log(`Scores: C=${scores.concrete} S=${scores.specific} Sm=${scores.small} A=${scores.actionable} (Avg: ${avg.toFixed(2)})`);
    
    if (passed) {
      console.log('✅ PASS (4/4)');
      passCount++;
    } else {
      console.log('❌ FAIL (not 4/4)');
      failCount++;
    }
    
    results.push({ prompt, output, scores, avg, passed });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n=== Validation Summary ===\n');
  console.log(`Total tests: ${TEST_PROMPTS.length}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Pass rate: ${((passCount / TEST_PROMPTS.length) * 100).toFixed(1)}%\n`);
  
  // Failure analysis
  if (failCount > 0) {
    console.log('=== Failure Analysis ===\n');
    const failures = results.filter(r => !r.passed);
    
    failures.forEach((result, idx) => {
      console.log(`${idx + 1}. "${result.prompt}"`);
      console.log(`   Output: ${result.output.substring(0, 150)}...`);
      console.log(`   Scores: C=${result.scores.concrete} S=${result.scores.specific} Sm=${result.scores.small} A=${result.scores.actionable}`);
      console.log('');
    });
    
    // Pattern analysis
    console.log('=== Pattern Analysis ===\n');
    const lowConcrete = failures.filter(r => r.scores.concrete < 4).length;
    const lowSpecific = failures.filter(r => r.scores.specific < 4).length;
    const lowSmall = failures.filter(r => r.scores.small < 4).length;
    const lowActionable = failures.filter(r => r.scores.actionable < 4).length;
    
    console.log(`Low Concrete: ${lowConcrete} failures`);
    console.log(`Low Specific: ${lowSpecific} failures`);
    console.log(`Low Small: ${lowSmall} failures`);
    console.log(`Low Actionable: ${lowActionable} failures`);
  }
  
  // Exit code
  process.exit(failCount > 0 ? 1 : 0);
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
