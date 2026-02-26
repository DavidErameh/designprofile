import { NextRequest, NextResponse } from 'next/server';
import { analyzeColors } from '../../../../../lib/analysis/colors';
import { analyzeImageWithMistral } from '../../../../../lib/analysis/mistral';
import { buildProfile } from '../../../../../lib/analysis/assembler';
import { convex } from '../../../../../lib/convex-client';
import { internal } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const analysisId = formData.get('analysisId') as string;

    if (!imageFile || !analysisId) {
      return NextResponse.json({ error: 'Missing image or analysisId' }, { status: 400 });
    }

    const id = analysisId as Id<"analyses">;

    // 1. Set status to processing
    await convex.mutation(internal.analyses.setStatus, { id, status: "processing" });
    await convex.mutation(internal.analyses.setStage, { id, stage: "Extracting colors & preparing image..." });

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = imageFile.type;

    const start = Date.now();

    // 2. Run Parallel Analysis
    await convex.mutation(internal.analyses.setStage, { id, stage: "Running AI vision analysis..." });
    const [colorProfile, mistralData] = await Promise.all([
      analyzeColors(base64Image),
      analyzeImageWithMistral(base64Image, mimeType)
    ]);

    await convex.mutation(internal.analyses.setStage, { id, stage: "Assembling final profile..." });
    const aiData: any = {
      design_style: mistralData.designLanguage?.style,
      brand_personality: mistralData.designLanguage?.personality,
      visual_weight: mistralData.composition?.visualWeight || "medium", // Default or map
      layout_pattern: mistralData.composition?.layoutType,
      whitespace_usage: mistralData.composition?.whitespace,
      quality_scores: {
        consistency: mistralData.designScore?.consistency || 5,
        hierarchy: mistralData.designScore?.hierarchy || 5,
        whitespace: mistralData.designScore?.clarity || 5, // Mapping clarity to whitespace for now or use another logic
        typography: mistralData.designScore?.overall || 5,
        color_harmony: mistralData.designScore?.overall || 5,
      },
      designer_insight: mistralData.summary,
      components: mistralData.typography?.estimatedFonts || [], // Or another list
      fonts_detected: mistralData.typography?.estimatedFonts?.map((f: string) => ({
        name: f,
        role: "heading",
        confidence: 90
      })) || []
    };

    // 4. Assemble Profile
    const finalProfile = buildProfile({
      colorProfile,
      aiData,
      sourceType: "image",
      sourceValue: "Uploaded Image",
      processingMs: Date.now() - start,
    });

    // 5. Complete Analysis in Convex
    await convex.mutation(internal.analyses.completeAnalysis, {
      id,
      profile: finalProfile,
      processingMs: Date.now() - start,
    });

    return NextResponse.json({ success: true, profile: finalProfile });

  } catch (error: any) {
    console.error('Image analysis API error:', error);
    const analysisId = (await req.formData()).get('analysisId') as string;
    if (analysisId) {
      await convex.mutation(internal.analyses.setError, {
        id: analysisId as Id<"analyses">,
        errorMessage: error.message || "Unknown error during image analysis",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
