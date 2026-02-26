export const IMAGE_ANALYSIS_SYSTEM_PROMPT = `You are an expert design analyst and creative director. 
Analyze the provided image and extract a complete design profile.
Always respond with valid JSON only. No prose, no markdown, just raw JSON.`;

export const IMAGE_ANALYSIS_USER_PROMPT = `Analyze this design image and return a JSON object with exactly this structure:
{
  "typography": {
    "primaryFont": "detected font name or style description",
    "fontCategory": "serif | sans-serif | display | monospace | script",
    "fontWeight": "light | regular | medium | semibold | bold | black",
    "typographyStyle": "description of typography personality",
    "hierarchy": "description of typographic hierarchy observed",
    "estimatedFonts": ["list", "of", "detected", "fonts"]
  },
  "composition": {
    "layoutType": "grid | asymmetric | centered | rule-of-thirds | golden-ratio | freeform",
    "visualBalance": "symmetric | asymmetric | radial",
    "whitespace": "minimal | moderate | generous | extreme",
    "contentDensity": "sparse | balanced | dense | chaotic",
    "focalPoint": "description of where the eye is drawn",
    "gridStructure": "description of underlying grid",
    "visualFlow": "description of how the eye moves through the design"
  },
  "designLanguage": {
    "style": "minimal | brutalist | material | glassmorphism | neumorphism | flat | skeuomorphic | corporate | playful | editorial | luxury",
    "era": "design era or movement (e.g. Swiss Style, Memphis, Y2K, Contemporary)",
    "mood": "description of emotional tone",
    "personality": ["adjective1", "adjective2", "adjective3"],
    "influences": ["design movement or brand this resembles"]
  },
  "colorProfile": {
    "colorScheme": "monochromatic | analogous | complementary | triadic | split-complementary",
    "colorTemperature": "warm | cool | neutral | mixed",
    "contrast": "low | medium | high | ultra-high",
    "colorMood": "description of how colors feel"
  },
  "designScore": {
    "clarity": 0-10,
    "hierarchy": 0-10,
    "consistency": 0-10,
    "overall": 0-10
  },
  "summary": "2-3 sentence expert summary of the design"
}`;

export const WEB_VISION_SYSTEM_PROMPT = `You are an expert UI/UX designer and brand analyst. Analyze websites and return only valid JSON.`;

export const WEB_VISION_USER_PROMPT = (contextStr: string) => `Analyze this website screenshot. I've also extracted this technical context: ${contextStr}
              
Return a JSON object with this exact structure:
{
  "visualStyle": {
    "designSystem": "custom | material | tailwind | bootstrap | ant-design | chakra | shadcn",
    "styleCategory": "minimal | corporate | playful | editorial | luxury | startup | saas | ecommerce | portfolio",
    "colorUsage": "monochrome | duotone | full-color | gradient-heavy | muted | vibrant",
    "spacing": "tight | comfortable | spacious | inconsistent",
    "borderRadius": "sharp | slightly-rounded | rounded | pill | mixed",
    "shadows": "none | subtle | moderate | heavy | neumorphic",
    "darkMode": true | false,
    "glassEffect": true | false
  },
  "typography": {
    "headingStyle": "description",
    "bodyStyle": "description",
    "scaleHarmony": "tight | harmonious | dramatic | inconsistent",
    "readability": 0-10
  },
  "composition": {
    "layoutPattern": "hero-cta | magazine | dashboard | landing | blog | portfolio | ecommerce",
    "aboveFold": "description of what user sees first",
    "navigationStyle": "minimal | expanded | mega-menu | sidebar | hamburger",
    "gridSystem": "single-col | two-col | three-col | masonry | custom",
    "responsiveClues": "description of responsive design approach"
  },
  "brandPersonality": ["word1", "word2", "word3", "word4"],
  "summary": "Expert 2-3 sentence design critique"
}`;

export const UX_TACTICS_SYSTEM_PROMPT = `You are a UX strategist and conversion rate expert. Return only valid JSON.`;

export const UX_TACTICS_USER_PROMPT = (context: any) => `Analyze this website DOM data and identify UX tactics used.
          
URL: ${context.url}
DOM Data: ${JSON.stringify(context.domData, null, 2)}
Detected Fonts: ${context.fonts?.detected?.join(', ')}
CSS Variable Count: ${context.cssData?.variableCount}

Return this JSON structure:
{
  "uxTactics": {
    "persuasion": ["social proof", "scarcity", "authority"],
    "navigation": "description of navigation UX strategy",
    "conversionOptimization": ["CTA strategy", "funnel patterns detected"],
    "trustSignals": ["list of trust signals found"],
    "accessibility": {
      "likelyScore": "poor | fair | good | excellent",
      "observations": ["list of accessibility observations"]
    }
  },
  "designPatterns": ["sticky nav", "hero banner", "card grid"],
  "technologyClues": {
    "cssFramework": "likely CSS framework",
    "animationLibrary": "detected or likely approach",
    "designTokens": true
  },
  "improvementOpportunities": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "overallUXRating": {
    "score": 0-10,
    "label": "Poor | Fair | Good | Excellent",
    "reasoning": "justification"
  }
}`;
