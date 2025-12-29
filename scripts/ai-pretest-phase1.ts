#!/usr/bin/env ts-node

/**
 * Phase 1 AI Pre-Validation Harness
 * Tests routing and relevance for 100 prompts across 10 categories
 */

// Dynamic import for node-fetch (ESM compatibility)
let fetchFn: typeof import('node-fetch').default;

// Initialize fetch
async function initFetch() {
  if (!fetchFn) {
    const nodeFetch = await import('node-fetch');
    fetchFn = nodeFetch.default as typeof import('node-fetch').default;
  }
}

const API_URL = process.env.API_URL || 'https://skyras-v2.vercel.app/api/chat';

// Template category mapping (internal -> semantic)
const TEMPLATE_ID_MAP: Record<string, string> = {
  'socialSchedule': 'calendar',
  'socialCaption': 'directions',
  'nextTask': 'start_idea',
};

// Reverse mapping for expected categories
const EXPECTED_TO_INTERNAL: Record<string, string> = {
  'calendar': 'socialSchedule',
  'directions': 'socialCaption',
  'start_idea': 'nextTask',
};

// Test categories and their expected templateIds
const CATEGORIES = [
  { name: 'email', expectedTemplateId: 'email' },
  { name: 'blog', expectedTemplateId: 'blog' },
  { name: 'presentation', expectedTemplateId: 'presentation' },
  { name: 'calendar', expectedTemplateId: 'calendar' },
  { name: 'directions', expectedTemplateId: 'directions' },
  { name: 'video', expectedTemplateId: 'video' },
  { name: 'overwhelm', expectedTemplateId: 'overwhelm' },
  { name: 'start_idea', expectedTemplateId: 'start_idea' },
  { name: 'organize', expectedTemplateId: 'organize' },
  { name: 'default', expectedTemplateId: 'default' },
];

// Generate 10 prompts per category
function generatePrompts(): Array<{ prompt: string; expectedCategory: string; expectedTemplateId: string }> {
  const prompts: Array<{ prompt: string; expectedCategory: string; expectedTemplateId: string }> = [];

  const categoryPrompts: Record<string, string[]> = {
    email: [
      "I need to send an email to my client",
      "I want to email my team about the project",
      "I need to write an email",
      "I should email someone about this",
      "I want to send an email",
      "I need to compose an email",
      "I have to email my boss",
      "I want to write an email subject",
      "I need to draft an email",
      "I should send an email update",
    ],
    blog: [
      "I want to write a blog post",
      "I need to create a blog article",
      "I want to publish a blog post",
      "I need to write blog content",
      "I want to draft a blog post",
      "I need to create blog content",
      "I want to write an article",
      "I need to publish a blog",
      "I want to create a blog post",
      "I need to write for my blog",
    ],
    presentation: [
      "I need to finish my presentation",
      "I want to create a presentation",
      "I need to work on my slides",
      "I want to make a presentation",
      "I need to prepare a presentation",
      "I want to build a slide deck",
      "I need to create slides",
      "I want to finish my slides",
      "I need to work on my presentation",
      "I want to prepare slides",
    ],
    calendar: [
      "I need a content calendar",
      "I want to plan my content calendar",
      "I need to schedule content",
      "I want to plan content for social media",
      "I need to create a content plan",
      "I want to schedule my posts",
      "I need a posting plan",
      "I want to plan my content strategy",
      "I need to organize my content schedule",
      "I want to create a content calendar",
    ],
    directions: [
      "I want to explore creative directions",
      "I need creative direction for my project",
      "I want to explore new directions",
      "I need to find a creative direction",
      "I want to explore different styles",
      "I need creative guidance",
      "I want to explore visual directions",
      "I need direction for my creative work",
      "I want to explore creative concepts",
      "I need to find my creative direction",
    ],
    video: [
      "I'm working on a video script",
      "I need to create a video",
      "I want to make a video",
      "I need to write a video script",
      "I want to produce a video",
      "I need to create video content",
      "I want to film something",
      "I need to edit a video",
      "I want to create a video project",
      "I need video content",
    ],
    overwhelm: [
      "I have too many projects and don't know where to start",
      "I feel overwhelmed with all my tasks",
      "I'm overwhelmed with work",
      "I have too much to do",
      "I'm swamped with projects",
      "I feel overwhelmed",
      "I have too many things to do",
      "I'm overwhelmed by my workload",
      "I have too much on my plate",
      "I feel swamped",
    ],
    start_idea: [
      "I have an idea but don't know how to start",
      "I don't know where to start",
      "I have an idea but don't know how to begin",
      "I don't know how to start",
      "I have a concept but need help starting",
      "I don't know where to begin",
      "I have an idea but need a starting point",
      "I don't know how to get started",
      "I have a project idea but don't know how to start",
      "I need help starting my idea",
    ],
    organize: [
      "I need to organize my workflow",
      "I want to organize my tasks",
      "I need to get organized",
      "I want to organize my work",
      "I need to organize my projects",
      "I want to structure my workflow",
      "I need to organize my schedule",
      "I want to organize my tasks better",
      "I need to get my workflow organized",
      "I want to organize my work better",
    ],
    default: [
      "I need help with something",
      "I want to get started",
      "I need assistance",
      "I want to do something",
      "I need to create something",
      "I want to work on something",
      "I need help",
      "I want to start working",
      "I need to get something done",
      "I want to create a deliverable",
    ],
  };

  for (const category of CATEGORIES) {
    const categoryPromptsList = categoryPrompts[category.name] || [];
    for (const prompt of categoryPromptsList) {
      prompts.push({
        prompt,
        expectedCategory: category.name,
        expectedTemplateId: category.expectedTemplateId,
      });
    }
  }

  return prompts;
}

interface TestResult {
  prompt: string;
  expectedCategory: string;
  expectedTemplateId: string;
  response: string;
  templateId: string | null;
  latency: number;
  pass: boolean;
  failureReasons: string[];
}

// Grade a response
async function gradeResponse(
  prompt: string,
  response: string,
  expectedTemplateId: string,
  actualTemplateId: string | null
): Promise<{ pass: boolean; reasons: string[] }> {
  const reasons: string[] = [];

  // Check 1: One sentence
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length !== 1) {
    reasons.push(`Not one sentence (found ${sentences.length} sentences)`);
  }

  // Check 2: One action (starts with action verb)
  const actionVerbs = /^(write|open|email|create|send|call|schedule|block|set|add|remove|delete|update|edit|start|finish|complete|submit|post|publish|draft|save|upload|download|go|click|type|fill|do|make|take|get|put|move|copy|paste|cut)/i;
  if (!actionVerbs.test(response.trim())) {
    reasons.push('Does not start with an action verb');
  }

  // Check 3: templateId matches expectedCategory
  if (actualTemplateId !== expectedTemplateId) {
    reasons.push(`TemplateId mismatch: expected "${expectedTemplateId}", got "${actualTemplateId}"`);
  }

  // Check 4: Response is semantically on-category (deterministic check)
  const semanticCheck = checkSemanticRelevance(prompt, response, expectedTemplateId);
  if (!semanticCheck.pass) {
    reasons.push(`Semantic mismatch: ${semanticCheck.reason}`);
  }

  return {
    pass: reasons.length === 0,
    reasons,
  };
}

// Deterministic semantic relevance check
function checkSemanticRelevance(
  prompt: string,
  response: string,
  expectedTemplateId: string
): { pass: boolean; reason?: string } {
  const lowerPrompt = prompt.toLowerCase();
  const lowerResponse = response.toLowerCase();

  // Category-specific checks
  switch (expectedTemplateId) {
    case 'email':
      if (!lowerResponse.includes('email') && !lowerResponse.includes('subject')) {
        return { pass: false, reason: 'Response does not mention email or subject' };
      }
      break;
    case 'blog':
      if (!lowerResponse.includes('blog') && !lowerResponse.includes('headline') && !lowerResponse.includes('post')) {
        return { pass: false, reason: 'Response does not mention blog, headline, or post' };
      }
      break;
    case 'presentation':
      if (!lowerResponse.includes('slide') && !lowerResponse.includes('presentation') && !lowerResponse.includes('title')) {
        return { pass: false, reason: 'Response does not mention slide, presentation, or title' };
      }
      break;
    case 'calendar':
      if (!lowerResponse.includes('platform') && !lowerResponse.includes('content') && !lowerResponse.includes('post')) {
        return { pass: false, reason: 'Response does not mention platform, content, or post' };
      }
      break;
    case 'directions':
      if (!lowerResponse.includes('color') && !lowerResponse.includes('direction') && !lowerResponse.includes('style') && !lowerResponse.includes('tone')) {
        return { pass: false, reason: 'Response does not mention color, direction, style, or tone' };
      }
      break;
    case 'video':
      if (!lowerResponse.includes('video') && !lowerResponse.includes('logline')) {
        return { pass: false, reason: 'Response does not mention video or logline' };
      }
      break;
    case 'overwhelm':
      if (!lowerResponse.includes('project') && !lowerResponse.includes('urgent') && !lowerResponse.includes('deadline')) {
        return { pass: false, reason: 'Response does not mention project, urgent, or deadline' };
      }
      break;
    case 'start_idea':
      if (!lowerResponse.includes('project') && !lowerResponse.includes('idea') && !lowerResponse.includes('concept') && !lowerResponse.includes('topic')) {
        return { pass: false, reason: 'Response does not mention project, idea, concept, or topic' };
      }
      break;
    case 'organize':
      if (!lowerResponse.includes('task') && !lowerResponse.includes('verb')) {
        return { pass: false, reason: 'Response does not mention task or verb' };
      }
      break;
    case 'default':
      // Default is catch-all, so any response is acceptable
      break;
  }

  return { pass: true };
}

// Initialize fetch
async function initFetch() {
  if (!fetchFn) {
    const nodeFetch = await import('node-fetch');
    fetchFn = nodeFetch.default as typeof import('node-fetch').default;
  }
}

// Call production API
async function callAPI(prompt: string): Promise<{ response: string; templateId: string | null; latency: number }> {
  await initFetch();
  const startTime = Date.now();
  
  try {
    const response = await fetchFn(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        userId: 'public',
      }),
    });

    const data = await response.json() as any;
    const latency = Date.now() - startTime;

    const responseText = data.response || data.data?.output || '';
    const templateId = data.data?.notes?.instrumentation?.templateId || null;

    return { response: responseText, templateId, latency };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      response: `ERROR: ${error instanceof Error ? error.message : String(error)}`,
      templateId: null,
      latency,
    };
  }
}

// Run all tests
async function runTests(): Promise<TestResult[]> {
  const prompts = generatePrompts();
  const results: TestResult[] = [];

  console.log(`\n🧪 Running ${prompts.length} tests against ${API_URL}\n`);
  console.log('='.repeat(80));

  for (let i = 0; i < prompts.length; i++) {
    const { prompt, expectedCategory, expectedTemplateId } = prompts[i];
    
    process.stdout.write(`[${i + 1}/${prompts.length}] Testing "${prompt.substring(0, 50)}..." `);
    
    const { response, templateId, latency } = await callAPI(prompt);
    const grade = await gradeResponse(prompt, response, expectedTemplateId, templateId);
    
    const result: TestResult = {
      prompt,
      expectedCategory,
      expectedTemplateId,
      response,
      templateId,
      latency,
      pass: grade.pass,
      failureReasons: grade.reasons,
    };

    results.push(result);
    
    if (grade.pass) {
      console.log(`✅ PASS (${latency}ms)`);
    } else {
      console.log(`❌ FAIL (${latency}ms)`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

// Generate report
function generateReport(results: TestResult[]): void {
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log('\n' + '='.repeat(80));
  console.log('📊 PHASE 1 PRE-VALIDATION REPORT');
  console.log('='.repeat(80));

  // Overall stats
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   Total Tests: ${total}`);
  console.log(`   ✅ Passed: ${passed} (${passRate}%)`);
  console.log(`   ❌ Failed: ${failed} (${(100 - parseFloat(passRate)).toFixed(1)}%)`);
  console.log(`   Average Latency: ${Math.round(results.reduce((sum, r) => sum + r.latency, 0) / total)}ms`);

  // Failures by category
  console.log(`\n📋 Failures by Category:`);
  const failuresByCategory: Record<string, { total: number; failed: number }> = {};
  for (const result of results) {
    if (!failuresByCategory[result.expectedCategory]) {
      failuresByCategory[result.expectedCategory] = { total: 0, failed: 0 };
    }
    failuresByCategory[result.expectedCategory].total++;
    if (!result.pass) {
      failuresByCategory[result.expectedCategory].failed++;
    }
  }

  for (const [category, stats] of Object.entries(failuresByCategory)) {
    const categoryPassRate = ((stats.total - stats.failed) / stats.total * 100).toFixed(1);
    const status = stats.failed === 0 ? '✅' : '❌';
    console.log(`   ${status} ${category}: ${stats.failed}/${stats.total} failed (${categoryPassRate}% pass)`);
  }

  // Failures by templateId
  console.log(`\n🔖 Failures by TemplateId:`);
  const failuresByTemplateId: Record<string, { total: number; failed: number }> = {};
  for (const result of results) {
    const tid = result.templateId || 'null';
    if (!failuresByTemplateId[tid]) {
      failuresByTemplateId[tid] = { total: 0, failed: 0 };
    }
    failuresByTemplateId[tid].total++;
    if (!result.pass) {
      failuresByTemplateId[tid].failed++;
    }
  }

  for (const [templateId, stats] of Object.entries(failuresByTemplateId).sort((a, b) => b[1].failed - a[1].failed)) {
    const tidPassRate = ((stats.total - stats.failed) / stats.total * 100).toFixed(1);
    const status = stats.failed === 0 ? '✅' : '❌';
    console.log(`   ${status} ${templateId}: ${stats.failed}/${stats.total} failed (${tidPassRate}% pass)`);
  }

  // Suggested keyword gaps
  console.log(`\n🔍 Suggested Keyword Gaps:`);
  const mismatches: Array<{ prompt: string; expected: string; actual: string | null; reasons: string[] }> = [];
  for (const result of results) {
    if (!result.pass && result.templateId !== result.expectedTemplateId) {
      mismatches.push({
        prompt: result.prompt,
        expected: result.expectedTemplateId,
        actual: result.templateId,
        reasons: result.failureReasons,
      });
    }
  }

  if (mismatches.length === 0) {
    console.log(`   ✅ No routing mismatches found!`);
  } else {
    console.log(`   Found ${mismatches.length} routing mismatches:\n`);
    for (const mismatch of mismatches.slice(0, 10)) { // Show first 10
      console.log(`   ❌ "${mismatch.prompt}"`);
      console.log(`      Expected: ${mismatch.expected}, Got: ${mismatch.actual || 'null'}`);
      console.log(`      Reasons: ${mismatch.reasons.join('; ')}`);
      console.log('');
    }
    if (mismatches.length > 10) {
      console.log(`   ... and ${mismatches.length - 10} more mismatches`);
    }
  }

  // Failure breakdown by reason
  console.log(`\n📉 Failure Breakdown by Reason:`);
  const failureReasons: Record<string, number> = {};
  for (const result of results) {
    if (!result.pass) {
      for (const reason of result.failureReasons) {
        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
      }
    }
  }

  for (const [reason, count] of Object.entries(failureReasons).sort((a, b) => b[1] - a[1])) {
    console.log(`   • ${reason}: ${count} failures`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n🎯 Target: 100% pass rate for Phase 1 validation`);
  console.log(`📊 Current: ${passRate}% pass rate\n`);
}

// Main execution
async function main() {
  try {
    const results = await runTests();
    generateReport(results);
    
    // Exit with error code if not 100% pass
    const allPassed = results.every(r => r.pass);
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Error running tests:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
