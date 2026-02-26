import { mistral, MISTRAL_VISION_MODEL, MISTRAL_TEXT_MODEL } from "../mistral";
import { 
  IMAGE_ANALYSIS_SYSTEM_PROMPT, 
  IMAGE_ANALYSIS_USER_PROMPT,
  WEB_VISION_SYSTEM_PROMPT,
  WEB_VISION_USER_PROMPT,
  UX_TACTICS_SYSTEM_PROMPT,
  UX_TACTICS_USER_PROMPT
} from "./prompts";

export async function analyzeImageWithMistral(base64Image: string, mimeType: string) {
  try {
    const result = await mistral.chat.complete({
      model: MISTRAL_VISION_MODEL,
      messages: [
        { role: "system", content: IMAGE_ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            { type: "text", text: IMAGE_ANALYSIS_USER_PROMPT },
          ],
        },
      ],
      responseFormat: { type: "json_object" },
      temperature: 0.1,
      maxTokens: 1500,
    });

    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
        throw new Error("Invalid response from Mistral");
    }
    return JSON.parse(content);
  } catch (error) {
    console.error("Mistral image analysis failed:", error);
    throw error;
  }
}

export async function analyzeWebScreenshot(
  base64Screenshot: string,
  context: { cssData: any; fonts: any; domData: any }
) {
  const contextStr = JSON.stringify({
    cssVariables: context.cssData?.variableCount,
    colorVars: context.cssData?.colorVariables,
    fonts: context.fonts?.detected?.slice(0, 5),
    dom: context.domData,
  }, null, 2);

  try {
    const result = await mistral.chat.complete({
      model: MISTRAL_VISION_MODEL,
      messages: [
        { role: "system", content: WEB_VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Screenshot}` },
            },
            { type: "text", text: WEB_VISION_USER_PROMPT(contextStr) },
          ],
        },
      ],
      responseFormat: { type: "json_object" },
      temperature: 0.1,
      maxTokens: 1200,
    });

    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
        throw new Error("Invalid response from Mistral");
    }
    return JSON.parse(content);
  } catch (error) {
    console.error("Mistral web vision analysis failed:", error);
    throw error;
  }
}

export async function analyzeUXTactics(context: {
  cssData: any;
  fonts: any;
  domData: any;
  url: string;
}) {
  try {
    const result = await mistral.chat.complete({
      model: MISTRAL_TEXT_MODEL,
      messages: [
        { role: "system", content: UX_TACTICS_SYSTEM_PROMPT },
        {
          role: "user",
          content: UX_TACTICS_USER_PROMPT(context),
        },
      ],
      responseFormat: { type: "json_object" },
      temperature: 0.2,
      maxTokens: 1000,
    });

    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
        throw new Error("Invalid response from Mistral");
    }
    return JSON.parse(content);
  } catch (error) {
    console.error("Mistral UX tactics analysis failed:", error);
    throw error;
  }
}
