import { Mistral } from "@mistralai/mistralai";

const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
  console.warn("MISTRAL_API_KEY is not set. Mistral AI features will not work.");
}

export const mistral = new Mistral({
  apiKey: apiKey || "",
});

export const MISTRAL_VISION_MODEL = process.env.MISTRAL_VISION_MODEL || "ministral-3-14b-25-12";
export const MISTRAL_TEXT_MODEL = process.env.MISTRAL_TEXT_MODEL || "mistral-small-2506";
