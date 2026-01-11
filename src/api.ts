import { requestUrl } from "obsidian";
import type { ReplicatePrediction, LazySketchSettings } from "./types";

export async function callReplicateAPI(
  userPrompt: string,
  settings: LazySketchSettings,
  width: number,
  height: number
): Promise<string> {
  const selectedPattern =
    settings.promptPatterns.find((p) => p.name === settings.selectedPattern) ||
    settings.promptPatterns[0];

  const formattedPrompt = selectedPattern.pattern.replace("{prompt}", userPrompt);

  try {
    const requestBody = {
      version: settings.defaultModel,
      input: {
        guidance_scale: 0,
        height,
        lora_scales: [1],
        lora_weights: [settings.loraWeights],
        num_inference_steps: 8,
        output_format: "jpg",
        output_quality: 80,
        prompt: formattedPrompt,
        width,
      },
    };

    const response = await requestUrl({
      url: "https://api.replicate.com/v1/predictions",
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.replicateApiToken}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify(requestBody),
    });

    const prediction = response.json as ReplicatePrediction;

    if (prediction.error) {
      throw new Error(prediction.error);
    }

    let attempts = 0;
    const maxAttempts = 120;

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      attempts++;
      if (attempts > maxAttempts) {
        throw new Error("Timeout: Polling took too long.");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await requestUrl({
        url: prediction.urls.get,
        method: "GET",
        headers: {
          Authorization: `Token ${settings.replicateApiToken}`,
        },
      });

      Object.assign(prediction, statusResponse.json as ReplicatePrediction);
    }

    if (prediction.status === "failed") {
      throw new Error(prediction.error || "Generation failed.");
    }

    return prediction.output ? prediction.output[0] : "";
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to connect to Replicate API.");
  }
}
