import { NextRequest, NextResponse } from 'next/server';
import { mistral, MISTRAL_TEXT_MODEL } from '../../../../../lib/mistral';

export async function POST(req: NextRequest) {
  try {
    const { cssVariables, fonts, colorTokens } = await req.json();

    const response = await mistral.chat.complete({
      model: MISTRAL_TEXT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a design systems expert. Analyze CSS variables and return structured JSON insights.',
        },
        {
          role: 'user',
          content: `Analyze these CSS design tokens:

CSS Variables: ${JSON.stringify(cssVariables, null, 2)}
Color Tokens: ${JSON.stringify(colorTokens, null, 2)}
Fonts: ${JSON.stringify(fonts, null, 2)}

Return JSON:
{
  "designSystem": {
    "hasTokenSystem": true | false,
    "tokenNamingConvention": "BEM | atomic | semantic | custom | inconsistent",
    "colorSystem": {
      "hasScales": true | false,
      "hasPrimary": true | false,
      "hasNeutrals": true | false,
      "hasSemantic": true | false,
      "extractedPalette": {}
    },
    "spacingSystem": "detected spacing scale or null",
    "typographyScale": "detected type scale or null"
  },
  "tokenAudit": {
    "totalTokens": 0,
    "colorTokens": 0,
    "quality": "poor | fair | good | excellent",
    "observations": []
  },
  "reconstructedPalette": {
    "primary": "hex or null",
    "secondary": "hex or null",
    "accent": "hex or null",
    "background": "hex or null",
    "surface": "hex or null",
    "text": "hex or null"
  }
}`,
        },
      ],
      responseFormat: { type: 'json_object' },
      temperature: 0.1,
      maxTokens: 800,
    });

    const content = response.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
        throw new Error('Invalid response from Mistral');
    }

    return NextResponse.json({
      success: true,
      data: JSON.parse(content),
    });
  } catch (error: any) {
    console.error('CSS Deep-dive error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
