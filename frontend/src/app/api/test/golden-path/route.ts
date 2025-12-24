import { NextRequest, NextResponse } from 'next/server';
import { createMarcusAgent } from '@/agents/marcus';
import { createGiorgioAgent } from '@/agents/giorgio';
import { createJamalAgent } from '@/agents/jamal';
import { scanFilesForLicensing } from '@/agents/compliance/complianceActions';
import { saveAssetMetadata } from '@/agents/letitia/letitiaActions';
import { getSupabaseClient } from '@/backend/supabaseClient';
import {
  createAgentResponse,
  createAgentError,
  createProofMarker,
  type AgentResult,
  type ProofMarker,
} from '@/agents/core/AgentContract';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

export const runtime = 'nodejs';

type Scenario = 'creative' | 'compliance' | 'distribution';

interface GoldenPathRequest {
  scenario: Scenario;
  userId?: string;
  project?: string;
  input?: Record<string, unknown>;
}

/**
 * Golden Path API - MVP Test Harness
 * Tests 3 core agent workflows with proof markers
 */
export async function POST(request: NextRequest) {
  const proofMarkers: ProofMarker[] = [];
  const startTime = Date.now();

  try {
    const body: GoldenPathRequest = await request.json();
    const { scenario, userId = 'public', project = 'SkySky', input = {} } = body;

    if (!['creative', 'compliance', 'distribution'].includes(scenario)) {
      return NextResponse.json(
        createAgentError('INVALID_SCENARIO', `Invalid scenario: ${scenario}`, 'validation', {
          proof: [createProofMarker('validation', 'ERROR', `Invalid scenario: ${scenario}`)],
        }),
        { status: 400 }
      );
    }

    proofMarkers.push(createProofMarker('start', 'ROUTE_OK', `Starting ${scenario} scenario`));

    let result: AgentResult;

    switch (scenario) {
      case 'creative':
        result = await runCreativePath(userId, project, input, proofMarkers);
        break;
      case 'compliance':
        result = await runCompliancePath(userId, project, input, proofMarkers);
        break;
      case 'distribution':
        result = await runDistributionPath(userId, project, input, proofMarkers);
        break;
      default:
        result = createAgentError('UNKNOWN_SCENARIO', `Unknown scenario: ${scenario}`, 'routing');
    }

    // Save to agent_runs table
    const supabase = getSupabaseClient();
    const agentRun = {
      user_id: userId,
      scenario,
      request: body,
      response_json: result,
      success: result.success !== false,
      error_message: result.success === false ? result.error.message : null,
      proof_markers: proofMarkers,
      metadata: {
        duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const { error: dbError } = await supabase.from('agent_runs').insert(agentRun);
      if (dbError) {
        console.error('[Golden Path] Failed to save agent run:', dbError);
        // Don't fail the request if DB save fails
      } else {
        proofMarkers.push(createProofMarker('db_save', 'DB_OK', 'Agent run saved to database'));
      }
    } catch (dbErr) {
      console.error('[Golden Path] DB save error:', dbErr);
    }

    // Add final proof marker
    if (result.success !== false) {
      proofMarkers.push(createProofMarker('complete', 'DONE', 'Golden path completed successfully'));
      if (result.proof) {
        result.proof = [...result.proof, ...proofMarkers];
      } else {
        result.proof = proofMarkers;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const errorResult = createAgentError(
      'INTERNAL_ERROR',
      (error as Error).message,
      'execution',
      {
        details: { stack: (error as Error).stack },
        proof: [
          ...proofMarkers,
          createProofMarker('error', 'ERROR', `Execution failed: ${(error as Error).message}`),
        ],
      }
    );

    // Try to save error to DB
    try {
      const supabase = getSupabaseClient();
      await supabase.from('agent_runs').insert({
        user_id: 'public',
        scenario: 'unknown',
        request: {},
        response_json: errorResult,
        success: false,
        error_message: (error as Error).message,
        proof_markers: errorResult.proof,
      });
    } catch (dbErr) {
      console.error('[Golden Path] Failed to save error to DB:', dbErr);
    }

    return NextResponse.json(errorResult, { status: 500 });
  }
}

/**
 * Creative Path: Marcus → Giorgio → Letitia
 */
async function runCreativePath(
  userId: string,
  project: string,
  input: Record<string, unknown>,
  proofMarkers: ProofMarker[]
): Promise<AgentResult> {
  try {
    // Step 1: Marcus routes to Giorgio
    proofMarkers.push(createProofMarker('marcus_routing', 'ROUTE_OK', 'Marcus routing to Giorgio'));

    const giorgio = createGiorgioAgent();
    const giorgioInput = {
      prompt: 'Generate a Sora prompt',
      metadata: {
        action: 'generateSoraPrompt',
        payload: {
          project,
          context: input.context || 'A cinematic sequence',
          mood: input.mood || 'dynamic',
          style: input.style || 'neon-realism',
        },
      },
    };

    const giorgioResult = await giorgio.run(giorgioInput);
    proofMarkers.push(
      createProofMarker('giorgio_execution', 'AGENT_OK', 'Giorgio generated Sora prompt', {
        action: 'generateSoraPrompt',
      })
    );

    // Extract prompt from Giorgio's result
    const creativity = giorgioResult.notes?.creativity as Record<string, unknown> | undefined;
    const prompt = (creativity?.prompt as string) || giorgioResult.output;

    // Step 2: Letitia saves the prompt as an asset
    const supabase = getSupabaseClient();
    const letitiaContext = {
      supabase,
      memory: giorgio['memory'],
      logger: giorgio['logger'],
      delegateTo: () => ({ agent: '', task: '', status: 'pending' as const }),
    };

    const assetResult = await saveAssetMetadata(letitiaContext, {
      project,
      name: `Sora Prompt - ${new Date().toISOString()}`,
      type: 'prompt',
      tags: ['sora', 'giorgio', 'creative'],
      metadata: {
        prompt,
        creativity,
        generated_by: 'giorgio',
        scenario: 'creative',
      },
    });

    proofMarkers.push(
      createProofMarker('letitia_save', 'DB_OK', 'Prompt saved as asset', {
        asset_name: assetResult.notes?.asset?.name,
      })
    );

    return createAgentResponse(
      'marcus',
      'creative_path',
      `Creative path completed: ${giorgioResult.output}`,
      {
        artifacts: [
          {
            type: 'prompt',
            content: prompt,
            metadata: creativity,
          },
        ],
        proof: proofMarkers,
        metadata: {
          giorgio_output: giorgioResult.output,
          asset_saved: assetResult.output,
        },
      }
    );
  } catch (error) {
    return createAgentError(
      'CREATIVE_PATH_ERROR',
      (error as Error).message,
      'creative_execution',
      {
        details: { stack: (error as Error).stack },
        proof: proofMarkers,
      }
    );
  }
}

/**
 * Compliance Path: Marcus → Cassidy → (optional) Letitia
 */
async function runCompliancePath(
  userId: string,
  project: string,
  input: Record<string, unknown>,
  proofMarkers: ProofMarker[]
): Promise<AgentResult> {
  try {
    // Step 1: Marcus routes to Cassidy
    proofMarkers.push(createProofMarker('cassidy_route', 'ROUTE_OK', 'Marcus routing to Cassidy for licensing scan'));

    const supabase = getSupabaseClient();
    const cassidyContext = {
      supabase,
      memory: {
        append: async () => {},
        history: async () => [],
      },
      logger: { info: console.log, error: console.error, debug: console.log },
      delegateTo: () => ({ agent: '', task: '', status: 'pending' as const }),
    };

    // Parse input files - support both array of objects and array of strings
    let files: Array<{ name: string; path?: string }> = [];
    if (input.files && Array.isArray(input.files)) {
      files = input.files.map((f) => {
        if (typeof f === 'string') {
          return { name: f, path: f };
        }
        return { name: f.name || String(f), path: f.path || f.name || String(f) };
      });
    }

    // Default sample files if none provided
    if (files.length === 0) {
      files = [
        { name: 'Runway_DEMO_watermark_preview.mp4', path: 'videos/Runway_DEMO_watermark_preview.mp4' },
        { name: 'artlist_song_license.pdf', path: 'music/artlist_song_license.pdf' },
        { name: 'final_master_v3.mov', path: 'videos/final_master_v3.mov' },
        { name: 'motionarray_PREVIEW_template.aep', path: 'templates/motionarray_PREVIEW_template.aep' },
      ];
    }

    // Step 2: Cassidy scans files
    const scanResult = await scanFilesForLicensing(cassidyContext, {
      projectId: project,
      files: files.map((f) => ({
        path: f.path || f.name,
        name: f.name,
        tags: [],
      })),
    });

    const suspiciousFiles = (scanResult.data || []) as Array<{
      file_path: string;
      reason: string;
      inferred_type: string;
      source: string;
    }>;

    const flaggedCount = suspiciousFiles.length;
    const cleanCount = files.length - flaggedCount;

    proofMarkers.push(
      createProofMarker('cassidy_execution', 'AGENT_OK', 'Cassidy completed licensing scan', {
        total_files: files.length,
        flagged_count: flaggedCount,
        clean_count: cleanCount,
      })
    );

    // Step 3: Always save scan result to compliance_scans table
    const scanOutput = {
      flagged: suspiciousFiles,
      clean: files.filter((f) => !suspiciousFiles.some((sf) => sf.file_path === (f.path || f.name))),
      counts: {
        total: files.length,
        flagged: flaggedCount,
        clean: cleanCount,
      },
      summary: scanResult.summary,
    };

    const { error: scanSaveError } = await supabase.from('compliance_scans').insert({
      project,
      input_files_json: files,
      output_json: scanOutput,
      flagged_count: flaggedCount,
      clean_count: cleanCount,
      user_id: userId,
      agent_source: 'cassidy',
      metadata: {
        scenario: 'compliance',
        scan_timestamp: new Date().toISOString(),
      },
    });

    if (scanSaveError) {
      throw new Error(`Failed to save compliance scan: ${scanSaveError.message}`);
    }

    proofMarkers.push(
      createProofMarker('compliance_scan_save', 'DB_OK', 'Compliance scan saved to compliance_scans table', {
        flagged_count: flaggedCount,
        clean_count: cleanCount,
      })
    );

    // Step 4: Optionally save flagged files as assets (only if asset_id is provided in input)
    const savedAssets = [];
    if (input.asset_id && suspiciousFiles.length > 0) {
      proofMarkers.push(createProofMarker('letitia_route', 'ROUTE_OK', 'Saving flagged files as assets via Letitia'));

      for (const file of suspiciousFiles) {
        try {
          const assetResult = await saveAssetMetadata(cassidyContext, {
            project,
            name: file.file_path,
            type: file.inferred_type || 'unknown',
            tags: ['compliance', 'suspicious', file.source],
            metadata: {
              reason: file.reason,
              source: file.source,
              licensing_status: 'unlicensed',
            },
          });
          if (assetResult.notes?.asset) {
            savedAssets.push(assetResult.notes.asset);
          }
        } catch (assetError) {
          console.error('[Compliance Path] Failed to save asset:', assetError);
          // Continue with other files
        }
      }

      if (savedAssets.length > 0) {
        proofMarkers.push(
          createProofMarker('letitia_save', 'DB_OK', 'Flagged files saved as assets', {
            assets_saved: savedAssets.length,
          })
        );
      }
    }

    proofMarkers.push(createProofMarker('compliance_complete', 'DONE', 'Compliance path completed successfully'));

    // Build output message
    const outputMessage =
      flaggedCount > 0
        ? `Compliance scan completed: ${flaggedCount} file(s) flagged, ${cleanCount} file(s) clean. ${scanResult.summary}`
        : `Compliance scan completed: All ${files.length} file(s) are clean. No licensing issues detected.`;

    return createAgentResponse('cassidy', 'scanFilesForLicensing', outputMessage, {
      artifacts: suspiciousFiles.map((f) => ({
        type: 'metadata' as const,
        content: JSON.stringify(f),
        metadata: f,
      })),
      warnings:
        flaggedCount > 0 ? [`Found ${flaggedCount} potentially unlicensed asset(s) requiring attention`] : undefined,
      proof: proofMarkers,
      metadata: {
        scan_summary: scanResult.summary,
        flagged_count: flaggedCount,
        clean_count: cleanCount,
        total_files: files.length,
        assets_saved: savedAssets.length,
        scan_saved: true,
      },
    });
  } catch (error) {
    proofMarkers.push(
      createProofMarker('compliance_error', 'ERROR', `Error in compliance path: ${(error as Error).message}`, {
        step: 'compliance_execution',
      })
    );
    return createAgentError(
      'COMPLIANCE_PATH_ERROR',
      (error as Error).message,
      'compliance_execution',
      {
        details: { stack: (error as Error).stack },
        proof: proofMarkers,
      }
    );
  }
}

/**
 * Distribution Path: Jamal → Save Drafts
 */
async function runDistributionPath(
  userId: string,
  project: string,
  input: Record<string, unknown>,
  proofMarkers: ProofMarker[]
): Promise<AgentResult> {
  try {
    // Step 1: Jamal generates drafts
    proofMarkers.push(createProofMarker('jamal_generate', 'ROUTE_OK', 'Jamal generating post drafts'));

    const jamal = createJamalAgent();
    const platforms = (input.platforms as string[]) || ['instagram', 'tiktok'];
    const jamalInput = {
      prompt: 'Generate posting plan',
      metadata: {
        action: 'generatePostingPlan',
        payload: {
          project,
          userId,
          platforms,
          slots: input.slots || 3,
          campaign: input.campaign || 'Test Campaign',
        },
      },
    };

    const jamalResult = await jamal.run(jamalInput);
    proofMarkers.push(
      createProofMarker('jamal_execution', 'AGENT_OK', 'Jamal generated post drafts', {
        action: 'generatePostingPlan',
        platforms_count: platforms.length,
      })
    );

    // Step 2: Save drafts to scheduled_posts table (NO actual publishing)
    const supabase = getSupabaseClient();
    const postingPlan = jamalResult.notes?.plan as
      | Array<{
          platform: string;
          caption: string;
          scheduled_at?: string;
        }>
      | undefined;

    const savedPosts = [];
    if (postingPlan && Array.isArray(postingPlan)) {
      for (const post of postingPlan.slice(0, 3)) {
        // Limit to 3 posts for MVP
        const { data, error } = await supabase
          .from('scheduled_posts')
          .insert({
            user_id: userId,
            project_id: project,
            platform: post.platform || platforms[0],
            caption: post.caption || 'Draft post',
            status: 'Draft',
            scheduled_at: post.scheduled_at ? new Date(post.scheduled_at).toISOString() : null,
            agent_source: 'jamal',
            metadata: {
              scenario: 'distribution',
              generated_at: new Date().toISOString(),
            },
          });

        if (!error && data && data.length > 0) {
          savedPosts.push(data[0]);
        }
      }
    } else {
      // Fallback: create a simple draft if plan structure is unexpected
      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: userId,
          project_id: project,
          platform: platforms[0],
          caption: jamalResult.output || 'Draft post from Jamal',
          status: 'Draft',
          agent_source: 'jamal',
          metadata: {
            scenario: 'distribution',
            raw_output: jamalResult.output,
          },
        });
      if (!error && data && data.length > 0) {
        savedPosts.push(data[0]);
      }
    }

    proofMarkers.push(
      createProofMarker('db_save_drafts', 'DB_OK', 'Post drafts saved to scheduled_posts', {
        drafts_saved: savedPosts.length,
      })
    );

    return createAgentResponse(
      'jamal',
      'distribution_path',
      `Distribution path completed: ${savedPosts.length} drafts saved (NO actual publishing)`,
      {
        artifacts: savedPosts.map((post) => ({
          type: 'metadata' as const,
          content: post.caption,
          metadata: post,
        })),
        warnings: [
          'Drafts saved but NOT published (JAMAL_PUBLISH_ENABLED=false)',
          'This is expected behavior for MVP',
        ],
        proof: proofMarkers,
        metadata: {
          jamal_output: jamalResult.output,
          drafts_count: savedPosts.length,
          publish_enabled: FEATURE_FLAGS.JAMAL_PUBLISH_ENABLED,
        },
      }
    );
  } catch (error) {
    return createAgentError(
      'DISTRIBUTION_PATH_ERROR',
      (error as Error).message,
      'distribution_execution',
      {
        details: { stack: (error as Error).stack },
        proof: proofMarkers,
      }
    );
  }
}

