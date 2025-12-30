#!/usr/bin/env node

/**
 * Phase 1 Human Validation Tracker
 * Records validation sessions and generates reports
 */

import * as fs from 'fs';
import * as path from 'path';

const VALIDATION_DATA_DIR = path.join(process.cwd(), 'data', 'phase1-validation');
const VALIDATION_DATA_FILE = path.join(VALIDATION_DATA_DIR, 'sessions.json');

// Ensure data directory exists
if (!fs.existsSync(VALIDATION_DATA_DIR)) {
  fs.mkdirSync(VALIDATION_DATA_DIR, { recursive: true });
}

interface PromptResult {
  promptText: string;
  response: string;
  clarity: 'Y' | 'N';
  willDoNow: 'Y' | 'N';
  confidence: number; // 0-10
  signupAfterValue: 'Y' | 'N' | 'N/A'; // N/A if already logged in
  timestamp: string;
  templateId?: string;
}

interface ValidationSession {
  sessionId: string;
  userId: string;
  userType: 'first-time' | 'returning' | 'unknown';
  isLoggedOut: boolean;
  prompts: PromptResult[];
  startedAt: string;
  completedAt?: string;
}

interface ValidationData {
  sessions: ValidationSession[];
  metadata: {
    startedAt: string;
    lastUpdated: string;
    totalSessions: number;
    totalPrompts: number;
  };
}

// Load existing data
function loadData(): ValidationData {
  if (fs.existsSync(VALIDATION_DATA_FILE)) {
    const content = fs.readFileSync(VALIDATION_DATA_FILE, 'utf-8');
    return JSON.parse(content);
  }
  return {
    sessions: [],
    metadata: {
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      totalSessions: 0,
      totalPrompts: 0,
    },
  };
}

// Save data
function saveData(data: ValidationData): void {
  data.metadata.lastUpdated = new Date().toISOString();
  data.metadata.totalSessions = data.sessions.length;
  data.metadata.totalPrompts = data.sessions.reduce((sum, s) => sum + s.prompts.length, 0);
  fs.writeFileSync(VALIDATION_DATA_FILE, JSON.stringify(data, null, 2));
}

// Create new session
export function createSession(userId: string, userType: 'first-time' | 'returning' | 'unknown', isLoggedOut: boolean): string {
  const data = loadData();
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session: ValidationSession = {
    sessionId,
    userId,
    userType,
    isLoggedOut,
    prompts: [],
    startedAt: new Date().toISOString(),
  };
  
  data.sessions.push(session);
  saveData(data);
  
  return sessionId;
}

// Add prompt result to session
export function addPromptResult(
  sessionId: string,
  promptText: string,
  response: string,
  clarity: 'Y' | 'N',
  willDoNow: 'Y' | 'N',
  confidence: number,
  signupAfterValue: 'Y' | 'N' | 'N/A',
  templateId?: string
): void {
  const data = loadData();
  const session = data.sessions.find(s => s.sessionId === sessionId);
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  if (session.prompts.length >= 2) {
    throw new Error(`Session ${sessionId} already has 2 prompts`);
  }
  
  const promptResult: PromptResult = {
    promptText,
    response,
    clarity,
    willDoNow,
    confidence,
    signupAfterValue,
    timestamp: new Date().toISOString(),
    templateId,
  };
  
  session.prompts.push(promptResult);
  
  if (session.prompts.length === 2) {
    session.completedAt = new Date().toISOString();
  }
  
  saveData(data);
}

// Complete session
export function completeSession(sessionId: string): void {
  const data = loadData();
  const session = data.sessions.find(s => s.sessionId === sessionId);
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  session.completedAt = new Date().toISOString();
  saveData(data);
}

// Generate report
export function generateReport(): {
  totalSessions: number;
  totalPrompts: number;
  clarityRate: number;
  willDoNowRate: number;
  avgConfidence: number;
  signupAfterValueRate: number;
  passesGate: boolean;
  details: {
    clarity: { passed: number; total: number; rate: number; target: number };
    willDoNow: { passed: number; total: number; rate: number; target: number };
    confidence: { avg: number; target: number };
    signupAfterValue: { passed: number; total: number; rate: number; target: number };
  };
} {
  const data = loadData();
  const allPrompts = data.sessions.flatMap(s => s.prompts);
  
  if (allPrompts.length === 0) {
    return {
      totalSessions: 0,
      totalPrompts: 0,
      clarityRate: 0,
      willDoNowRate: 0,
      avgConfidence: 0,
      signupAfterValueRate: 0,
      passesGate: false,
      details: {
        clarity: { passed: 0, total: 0, rate: 0, target: 80 },
        willDoNow: { passed: 0, total: 0, rate: 0, target: 60 },
        confidence: { avg: 0, target: 7 },
        signupAfterValue: { passed: 0, total: 0, rate: 0, target: 25 },
      },
    };
  }
  
  const clarityPassed = allPrompts.filter(p => p.clarity === 'Y').length;
  const willDoNowPassed = allPrompts.filter(p => p.willDoNow === 'Y').length;
  const avgConfidence = allPrompts.reduce((sum, p) => sum + p.confidence, 0) / allPrompts.length;
  const signupPrompts = allPrompts.filter(p => p.signupAfterValue !== 'N/A');
  const signupPassed = signupPrompts.filter(p => p.signupAfterValue === 'Y').length;
  
  const clarityRate = (clarityPassed / allPrompts.length) * 100;
  const willDoNowRate = (willDoNowPassed / allPrompts.length) * 100;
  const signupAfterValueRate = signupPrompts.length > 0 ? (signupPassed / signupPrompts.length) * 100 : 0;
  
  const passesGate = clarityRate >= 80 && willDoNowRate >= 60 && avgConfidence >= 7 && signupAfterValueRate >= 20;
  
  return {
    totalSessions: data.sessions.length,
    totalPrompts: allPrompts.length,
    clarityRate,
    willDoNowRate,
    avgConfidence,
    signupAfterValueRate,
    passesGate,
    details: {
      clarity: { passed: clarityPassed, total: allPrompts.length, rate: clarityRate, target: 80 },
      willDoNow: { passed: willDoNowPassed, total: allPrompts.length, rate: willDoNowRate, target: 60 },
      confidence: { avg: avgConfidence, target: 7 },
      signupAfterValue: { passed: signupPassed, total: signupPrompts.length, rate: signupAfterValueRate, target: 25 },
    },
  };
}

// Print report
export function printReport(): void {
  const report = generateReport();
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 PHASE 1 HUMAN VALIDATION REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   Total Sessions: ${report.totalSessions}/10`);
  console.log(`   Total Prompts: ${report.totalPrompts}/20`);
  
  console.log(`\n🎯 Gate Criteria:`);
  console.log(`   Clarity: ${report.details.clarity.rate.toFixed(1)}% (${report.details.clarity.passed}/${report.details.clarity.total}) - Target: ≥${report.details.clarity.target}% ${report.details.clarity.rate >= report.details.clarity.target ? '✅' : '❌'}`);
  console.log(`   Will Do Now: ${report.details.willDoNow.rate.toFixed(1)}% (${report.details.willDoNow.passed}/${report.details.willDoNow.total}) - Target: ≥${report.details.willDoNow.target}% ${report.details.willDoNow.rate >= report.details.willDoNow.target ? '✅' : '❌'}`);
  console.log(`   Avg Confidence: ${report.details.confidence.avg.toFixed(1)}/10 - Target: ≥${report.details.confidence.target}/10 ${report.details.confidence.avg >= report.details.confidence.target ? '✅' : '❌'}`);
  console.log(`   Signup After Value: ${report.details.signupAfterValue.rate.toFixed(1)}% (${report.details.signupAfterValue.passed}/${report.details.signupAfterValue.total}) - Target: ≥${report.details.signupAfterValue.target}% ${report.details.signupAfterValue.rate >= report.details.signupAfterValue.target ? '✅' : '❌'}`);
  
  console.log(`\n🚪 Phase 2 Gate:`);
  if (report.passesGate) {
    console.log(`   ✅ PASS - All criteria met! Proceed to Phase 2.`);
  } else {
    console.log(`   ❌ FAIL - Criteria not met. Fix issues before proceeding.`);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'report') {
    printReport();
  } else if (command === 'create-session') {
    const userId = process.argv[3] || 'user_' + Date.now();
    const userType = (process.argv[4] as 'first-time' | 'returning' | 'unknown') || 'unknown';
    const isLoggedOut = process.argv[5] === 'true';
    const sessionId = createSession(userId, userType, isLoggedOut);
    console.log(`Created session: ${sessionId}`);
  } else if (command === 'add-prompt') {
    const sessionId = process.argv[3];
    const promptText = process.argv[4];
    const response = process.argv[5];
    const clarity = process.argv[6] as 'Y' | 'N';
    const willDoNow = process.argv[7] as 'Y' | 'N';
    const confidence = parseInt(process.argv[8] || '0');
    const signupAfterValue = (process.argv[9] as 'Y' | 'N' | 'N/A') || 'N/A';
    const templateId = process.argv[10];
    
    addPromptResult(sessionId, promptText, response, clarity, willDoNow, confidence, signupAfterValue, templateId);
    console.log(`Added prompt result to session ${sessionId}`);
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/phase1-human-validation.ts report');
    console.log('  npx tsx scripts/phase1-human-validation.ts create-session [userId] [userType] [isLoggedOut]');
    console.log('  npx tsx scripts/phase1-human-validation.ts add-prompt <sessionId> <promptText> <response> <clarity> <willDoNow> <confidence> <signupAfterValue> [templateId]');
  }
}
