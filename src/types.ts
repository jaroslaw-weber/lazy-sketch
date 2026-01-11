export interface PromptPattern {
  name: string;
  pattern: string;
}

export interface ReplicatePrediction {
  error?: string;
  status: string;
  urls: {
    get: string;
  };
  output?: string[];
}

export interface LazySketchSettings {
  replicateApiToken: string;
  defaultModel: string;
  loraWeights: string;
  selectedPattern: string;
  promptPatterns: PromptPattern[];
  customWidth: number;
  customHeight: number;
  lastGenerationTimeMs: number;
}

export const DEFAULT_SETTINGS: LazySketchSettings = {
  replicateApiToken: "",
  defaultModel:
    "prunaai/z-image-turbo-lora:197b2db2015aa366d2bc61a941758adf4c31ac66b18573f5c66dc388ab081ca2",
  loraWeights:
    "https://huggingface.co/Ttio2/Z-Image-Turbo-pencil-sketch/blob/main/Zimage_pencil_sketch.safetensors",
  selectedPattern: "cute",
  promptPatterns: [
    {
      name: "cute",
      pattern:
        "a color pencil sketch. clear white background. cute & fun & simple. {prompt}",
    },
    {
      name: "detailed",
      pattern:
        "a detailed pencil sketch. clean white background. intricate & realistic. {prompt}",
    },
    {
      name: "whimsical",
      pattern:
        "a playful pencil sketch. white background. whimsical & imaginative. {prompt}",
    },
  ],
  customWidth: 1024,
  customHeight: 512,
  lastGenerationTimeMs: 5000,
};
