// ─────────────────────────────────────────────
//  AI Service — supports Claude & Gemini
//  v3 — fixed token limits, robust JSON parser
// ─────────────────────────────────────────────

const GEMINI_MODELS = [
  "gemini-2.5-flash",      // best free tier — fast + smart
  "gemini-2.5-flash-lite", // lightest, highest quota
  "gemini-2.0-flash",      // stable fallback
  "gemini-2.0-flash-lite", // last resort fallback
];

// ── Delay helper ──
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ── Retry wrapper with exponential backoff ──
async function withRetry(fn, retries = 3, baseDelayMs = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err.message?.includes("429") || err.message?.includes("503");
      const isLast = attempt === retries;
      if (is429 && !isLast) {
        const wait = baseDelayMs * attempt;
        console.warn(`[Gemini] Rate limited (429). Retrying in ${wait / 1000}s... (attempt ${attempt}/${retries})`);
        await delay(wait);
      } else {
        throw err;
      }
    }
  }
}

// ─────────────────────────────────────────────
//  Robust JSON extractor
//  Handles: truncated JSON, extra text, markdown fences
// ─────────────────────────────────────────────
export function parseJSON(text) {
  // 1. Strip markdown fences
  let clean = text.replace(/```json|```/g, "").trim();

  // 2. Try parsing as-is first
  try {
    return JSON.parse(clean);
  } catch (_) {}

  // 3. Extract the first { ... } block
  const start = clean.indexOf("{");
  let end = clean.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(clean.slice(start, end + 1));
    } catch (_) {}
  }

  // 4. JSON is truncated — attempt to auto-close it
  if (start !== -1) {
    let partial = clean.slice(start);
    // Close any open string
    const quoteCount = (partial.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) partial += '"';
    // Count unclosed brackets/braces
    let braces = 0, brackets = 0;
    for (const ch of partial) {
      if (ch === "{") braces++;
      else if (ch === "}") braces--;
      else if (ch === "[") brackets++;
      else if (ch === "]") brackets--;
    }
    // Remove trailing comma before closing
    partial = partial.replace(/,\s*$/, "");
    // Close arrays first, then objects
    partial += "]".repeat(Math.max(0, brackets));
    partial += "}".repeat(Math.max(0, braces));
    try {
      return JSON.parse(partial);
    } catch (_) {}
  }

  throw new Error("Could not parse AI response as JSON. Raw: " + clean.slice(0, 200));
}

// ─────────────────────────────────────────────
//  Claude (Anthropic)
// ─────────────────────────────────────────────
export async function callClaude(apiKey, messages, system = "") {
  const body = {
    model: "claude-opus-4-5",
    max_tokens: 8096,  // max Claude allows
    messages,
  };
  if (system) body.system = system;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Claude API error: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  return data.content.map((i) => i.text || "").join("");
}

// ─────────────────────────────────────────────
//  Gemini (Google) — model fallback + retry
// ─────────────────────────────────────────────
export async function callGemini(apiKey, prompt, modelIndex = 0) {
  const model = GEMINI_MODELS[modelIndex] || GEMINI_MODELS[0];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const attempt = async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,        // lower = more consistent JSON output
          maxOutputTokens: 8192,   // max Gemini allows
          responseMimeType: "application/json", // tell Gemini to return JSON
        },
      }),
    });

    if (res.status === 429 || res.status === 503) {
      if (modelIndex + 1 < GEMINI_MODELS.length) {
        console.warn(`[Gemini] ${model} rate limited, trying ${GEMINI_MODELS[modelIndex + 1]}...`);
        return callGemini(apiKey, prompt, modelIndex + 1);
      }
      throw new Error("Gemini API error: 429/503 — All models busy. Wait 1 minute and retry.");
    }

    if (res.status === 404) {
      if (modelIndex + 1 < GEMINI_MODELS.length) {
        console.warn(`[Gemini] ${model} not found, trying ${GEMINI_MODELS[modelIndex + 1]}...`);
        return callGemini(apiKey, prompt, modelIndex + 1);
      }
      throw new Error("Gemini API error: 404 — No available models found.");
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Gemini API error: ${res.status} — ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned empty response.");
    return text;
  };

  return withRetry(attempt, 3, 5000);
}

// ─────────────────────────────────────────────
//  Unified call — picks provider
// ─────────────────────────────────────────────
export async function callAI(provider, apiKey, prompt, systemPrompt = "", contentParts = null) {
  if (provider === "gemini") {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    return callGemini(apiKey, fullPrompt);
  }
  const messages = contentParts
    ? [{ role: "user", content: contentParts }]
    : [{ role: "user", content: prompt }];
  return callClaude(apiKey, messages, systemPrompt);
}

// ─────────────────────────────────────────────
//  Analyze uploaded notes
// ─────────────────────────────────────────────
export async function analyzeNotesWithAI(provider, apiKey, files) {
  const analysisPrompt = `Analyze these student notes/documents and extract key study insights.
Return ONLY a valid JSON object. No explanation. No markdown. Pure JSON only.
Use short values — keep each string under 80 characters to avoid truncation.
{
  "detectedSubjects": ["subject1", "subject2"],
  "keyTopics": ["topic1", "topic2", "topic3"],
  "weakAreas": ["weak area 1", "weak area 2"],
  "strongAreas": ["strong area 1"],
  "difficulty": "Easy",
  "estimatedCoverage": "One short sentence here.",
  "studyRecommendation": "One short sentence here.",
  "importantFormulas": ["formula 1", "formula 2"],
  "suggestedTopicsToRevise": ["topic 1", "topic 2"]
}`;

  if (provider === "claude") {
    const contentParts = [];
    for (const file of files) {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || "text/plain";
      if (mimeType === "application/pdf") {
        contentParts.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } });
      } else if (mimeType.startsWith("image/")) {
        contentParts.push({ type: "image", source: { type: "base64", media_type: mimeType, data: base64 } });
      } else {
        const text = atob(base64);
        contentParts.push({ type: "text", text: `File: ${file.name}\n\n${text}` });
      }
    }
    contentParts.push({ type: "text", text: analysisPrompt });
    const result = await callClaude(apiKey, [{ role: "user", content: contentParts }]);
    return parseJSON(result);

  } else {
    let combined = "";
    for (const file of files) {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        // Limit text to 3000 chars to avoid token overflow
        combined += `\n\nFile: ${file.name}\n${text.slice(0, 3000)}`;
      } else {
        combined += `\n\n[File: ${file.name} — ${(file.size / 1024).toFixed(0)}KB, type: ${file.type}]`;
      }
    }

    const fullPrompt = `Student notes:\n${combined}\n\n${analysisPrompt}`;
    await delay(1000);
    const result = await callGemini(apiKey, fullPrompt);
    return parseJSON(result);
  }
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
export function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(file);
  });
}