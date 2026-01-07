// Standalone test script for Replicate API
// Run with: npm run test-api (reads from .env file)

require('dotenv').config({
  path: '.env',
  override: true
});

const API_TOKEN = process.env.REPLICATE_API_TOKEN;

console.log("Token loaded:", API_TOKEN ? "Yes" : "No");
console.log("Token length:", API_TOKEN ? API_TOKEN.length : 0);
console.log("Token preview:", API_TOKEN ? API_TOKEN.substring(0, 7) : "N/A");

if (!API_TOKEN) {
  console.error("Error: REPLICATE_API_TOKEN environment variable not set");
  process.exit(1);
}

const PROMPT_PATTERNS = {
  cute: "a color pencil sketch. clear white background. cute & fun & simple. {prompt}",
  detailed: "a detailed pencil sketch. clean white background. intricate & realistic. {prompt}",
  whimsical: "a playful pencil sketch. white background. whimsical & imaginative. {prompt}"
};

const CONFIG = {
  model: "prunaai/z-image-turbo-lora:197b2db2015aa366d2bc61a941758adf4c31ac66b18573f5c66dc388ab081ca2",
  loraWeights: "https://huggingface.co/Ttio2/Z-Image-Turbo-pencil-sketch/resolve/main/Zimage_pencil_sketch.safetensors",
  userPrompt: "cat",
  pattern: "cute"
};

function formatPrompt(userPrompt, patternName) {
  const pattern = PROMPT_PATTERNS[patternName] || PROMPT_PATTERNS.cute;
  return pattern.replace("{prompt}", userPrompt);
}

async function callReplicateAPI(userPrompt, patternName) {
  const formattedPrompt = formatPrompt(userPrompt, patternName);

  console.log("=== REQUEST ===");
  console.log("Formatted prompt:", formattedPrompt);
  console.log("LoRA weights:", CONFIG.loraWeights);
  console.log("");

  const requestBody = {
    version: CONFIG.model,
    input: {
      guidance_scale: 0,
      height: 512,
      lora_scales: [1],
      lora_weights: [CONFIG.loraWeights],
      num_inference_steps: 8,
      output_format: "jpg",
      output_quality: 80,
      prompt: formattedPrompt,
      width: 1024
    }
  };

  console.log("Request body:", JSON.stringify(requestBody, null, 2));
  console.log("");

  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
      "Prefer": "wait"
    },
    body: JSON.stringify(requestBody)
  });

  console.log("=== RESPONSE ===");
  console.log("Status:", response.status);
  console.log("OK:", response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response:", errorText);
    throw new Error(`API request failed with status ${response.status}`);
  }

  const prediction = await response.json();
  console.log("Prediction ID:", prediction.id);
  console.log("Initial status:", prediction.status);
  console.log("Get URL:", prediction.urls.get);
  console.log("");

  console.log("=== POLLING ===");
  let attempts = 0;
  const maxAttempts = 120;

  while (prediction.status !== "succeeded" && prediction.status !== "failed") {
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error("Timeout: Polling took too long");
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const statusResponse = await fetch(prediction.urls.get, {
      headers: {
        "Authorization": `Token ${API_TOKEN}`
      }
    });

    const statusData = await statusResponse.json();
    Object.assign(prediction, statusData);

    console.log(`[${attempts}s] Status: ${prediction.status}`);
  }

  console.log("");

  if (prediction.status === "failed") {
    throw new Error(prediction.error || "Generation failed");
  }

  return prediction.output[0];
}

async function main() {
  console.log("========================================");
  console.log("Obsidian Lazy Sketch - API Test");
  console.log("========================================");
  console.log("");

  try {
    const imageUrl = await callReplicateAPI(CONFIG.userPrompt, CONFIG.pattern);

    console.log("=== SUCCESS ===");
    console.log("Image URL:", imageUrl);
    console.log("");
    console.log("You can view the image at:");
    console.log(imageUrl);

  } catch (error) {
    console.error("=== ERROR ===");
    console.error("Message:", error.message);
    console.error("");
    console.error("Stack trace:");
    console.error(error.stack);
    process.exit(1);
  }
}

main();
