#!/usr/bin/env node
/**
 * Giorgio Image Generation Verification Script
 * Tests all three scenarios: disabled, missing keys, enabled
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testScenario(name, envVars, description) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST ${name}: ${description}`);
  console.log(`${'='.repeat(80)}`);
  
  // Note: In a real environment, we'd set env vars before calling
  // For now, we'll document what should be set
  console.log(`\nEnvironment variables to set:`);
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}=${value}`);
  });

  const requestBody = {
    scenario: 'creative',
    userId: 'public',
    project: 'SkySky',
    input: {
      context: 'A cinematic sequence',
      mood: 'dynamic',
      includeImage: true,
    },
  };

  try {
    console.log(`\nMaking API call to ${API_URL}/api/test/golden-path...`);
    const response = await fetch(`${API_URL}/api/test/golden-path`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    
    // Trim large URLs in artifacts
    if (data.artifacts) {
      data.artifacts = data.artifacts.map(artifact => {
        if (artifact.content && artifact.content.length > 200) {
          artifact.content = artifact.content.substring(0, 200) + '...[TRUNCATED]';
        }
        if (artifact.url && artifact.url.length > 200) {
          artifact.url = artifact.url.substring(0, 200) + '...[TRUNCATED]';
        }
        return artifact;
      });
    }

    console.log(`\nResponse Status: ${response.status}`);
    console.log(`\nResponse JSON:`);
    console.log(JSON.stringify(data, null, 2));

    // Verification checks
    console.log(`\n${'-'.repeat(80)}`);
    console.log('VERIFICATION CHECKS:');
    console.log(`${'-'.repeat(80)}`);

    const checks = {
      'success === true': data.success === true,
      'warnings present (a/b only)': name === 'A' || name === 'B' ? (data.warnings && data.warnings.length > 0) : true,
      'artifacts present': data.artifacts && data.artifacts.length > 0,
      'artifact type correct': name === 'C' 
        ? data.artifacts.some(a => a.type === 'image')
        : data.artifacts.some(a => a.type === 'prompt_package'),
      'proof includes DB_OK': data.proof && data.proof.some(p => p.status === 'DB_OK'),
      'no 500 error': response.status !== 500,
    };

    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✓' : '✗'} ${check}`);
    });

    const allPassed = Object.values(checks).every(v => v);
    console.log(`\n${allPassed ? '✓ ALL CHECKS PASSED' : '✗ SOME CHECKS FAILED'}`);

    return { data, checks, allPassed };
  } catch (error) {
    console.error(`\n✗ ERROR: ${error.message}`);
    return { error: error.message, allPassed: false };
  }
}

async function checkDatabaseAssets(project = 'SkySky') {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n⚠ Skipping database check: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
    return;
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('DATABASE VERIFICATION');
  console.log(`${'='.repeat(80)}`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/assets?project=eq.${project}&order=created_at.desc&limit=10`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.log(`⚠ Database query failed: ${response.status}`);
      return;
    }

    const assets = await response.json();
    console.log(`\nFound ${assets.length} recent assets for project "${project}":`);
    
    assets.forEach((asset, idx) => {
      console.log(`\n  Asset ${idx + 1}:`);
      console.log(`    Type: ${asset.type}`);
      console.log(`    Name: ${asset.name}`);
      console.log(`    Tags: ${asset.tags?.join(', ') || 'none'}`);
      console.log(`    Created: ${asset.created_at}`);
      console.log(`    Agent: ${asset.agent_source || 'unknown'}`);
    });

    // Check for prompt and image assets
    const promptAssets = assets.filter(a => a.type === 'prompt');
    const imageAssets = assets.filter(a => a.type === 'image');
    const promptPackageAssets = assets.filter(a => a.type === 'prompt_package');

    console.log(`\n  Summary:`);
    console.log(`    Prompt assets: ${promptAssets.length}`);
    console.log(`    Image assets: ${imageAssets.length}`);
    console.log(`    Prompt package assets: ${promptPackageAssets.length}`);
  } catch (error) {
    console.error(`\n✗ Database check error: ${error.message}`);
  }
}

async function main() {
  console.log('Giorgio Image Generation Verification Tests');
  console.log('='.repeat(80));

  const results = {};

  // Test A: GIORGIO_IMAGE_ENABLED=false
  results.A = await testScenario('A', {
    GIORGIO_IMAGE_ENABLED: 'false',
  }, 'Image generation disabled');

  // Test B: GIORGIO_IMAGE_ENABLED=true but missing REPLICATE_API_TOKEN
  results.B = await testScenario('B', {
    GIORGIO_IMAGE_ENABLED: 'true',
    REPLICATE_API_TOKEN: '', // Missing
  }, 'Image generation enabled but missing provider keys');

  // Test C: GIORGIO_IMAGE_ENABLED=true with valid keys
  results.C = await testScenario('C', {
    GIORGIO_IMAGE_ENABLED: 'true',
    REPLICATE_API_TOKEN: 'valid-token', // Would need real token
    IMAGE_PROVIDER: 'replicate',
  }, 'Image generation enabled with valid keys');

  // Check database
  await checkDatabaseAssets();

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('TEST SUMMARY');
  console.log(`${'='.repeat(80)}`);
  
  Object.entries(results).forEach(([name, result]) => {
    console.log(`\nTest ${name}: ${result.allPassed ? '✓ PASSED' : '✗ FAILED'}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  const allPassed = Object.values(results).every(r => r.allPassed);
  console.log(`\n${'='.repeat(80)}`);
  console.log(`OVERALL: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
  console.log(`${'='.repeat(80)}\n`);
}

main().catch(console.error);

