import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const models = ['gemini-2.0-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.1-flash-lite-preview', 'gemini-3.5-flash-lite'];
  for (const m of models) {
    try {
      await ai.models.generateContent({ model: m, contents: 'hi' });
      console.log(`${m} works`);
    } catch (e) {
      console.log(`${m} failed: ${String(e).slice(0, 300)}`);
    }
  }
}
run();
