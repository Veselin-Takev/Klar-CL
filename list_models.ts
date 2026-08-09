import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    for await (const m of ai.models.list()) {
      console.log(m.name);
    }
  } catch (e) {
    console.error(e);
  }
}
run();
