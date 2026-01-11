import { requestUrl } from "obsidian";
import type { App } from "obsidian";

export async function downloadAndSaveImage(
  app: App,
  imageUrl: string,
  prompt: string
): Promise<string> {
  const adapter = app.vault.adapter;
  const filesDir = "files";

  if (!(await adapter.exists(filesDir))) {
    await adapter.mkdir(filesDir);
  }

  const response = await requestUrl({
    url: imageUrl,
    method: "GET",
  });

  const timestamp = Date.now();
  const sanitizedPrompt = prompt
    .replace(/[^a-zA-Z0-9]/g, "_")
    .substring(0, 50);
  const filename = `sketch_${sanitizedPrompt}_${timestamp}.jpg`;
  const filePath = `${filesDir}/${filename}`;

  await adapter.writeBinary(filePath, response.arrayBuffer);

  return filePath;
}
