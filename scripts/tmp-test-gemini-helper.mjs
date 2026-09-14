import { config } from "dotenv";
config({ path: ".env.local" });

const { generateGeminiText } = await import("../src/lib/ai/gemini.ts");

const result = await generateGeminiText({
  prompt:
    'Return JSON {"markdown":"# ok","json":{"problem_statement":"a","solution":"b","impact":"c","implementation":"d"}} only',
  json: true,
  maxOutputTokens: 1024,
  temperature: 0.2,
});

console.log(JSON.stringify(result, null, 2).slice(0, 800));
