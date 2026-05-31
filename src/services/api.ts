import * as FileSystem from 'expo-file-system/legacy';

// Builds the base URL from IP and port stored in Redux.
export const buildBaseUrl = (ip: string, port: string): string =>
  `http://${ip}:${port}`;

// GET / — returns true if server responds with success message.
export async function testConnection(baseUrl: string): Promise<boolean> {
  const response = await fetch(`${baseUrl}/`);
  if (!response.ok) return false;
  const text = await response.text();
  return text.toLowerCase().includes('success');
}

// GET /getmodels — returns list of available model names.
export async function getModels(baseUrl: string): Promise<string[]> {
  const response = await fetch(`${baseUrl}/getmodels`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  // Server may return { models: [...] } or a plain array
  if (Array.isArray(data)) return data as string[];
  if (Array.isArray(data.models)) return data.models as string[];
  throw new Error('Unexpected /getmodels response format');
}

// GET /selectModel/<name> — selects the active model on the server.
export async function selectModel(baseUrl: string, name: string): Promise<void> {
  const response = await fetch(`${baseUrl}/selectModel/${encodeURIComponent(name)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

// POST /upload — sends audio file via multipart; returns server confirmation body.
export async function uploadClip(baseUrl: string, fileUri: string): Promise<string> {
  const response = await FileSystem.uploadAsync(`${baseUrl}/upload`, fileUri, {
    fieldName: 'file',
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    headers: { filename: fileUri },
  });
  if (response.status >= 400) throw new Error(`Upload failed: HTTP ${response.status}`);
  return response.body;
}

// GET /download — downloads the transformed file; returns its local URI.
// Uses a timestamped filename so the URI always changes between calls,
// which forces AudioPlayer to remount and play the new result rather than
// replaying a cached previous result.
export async function downloadResult(baseUrl: string): Promise<string> {
  const dir = FileSystem.documentDirectory + 'rave/';
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  // Delete previous result files to avoid accumulating stale audio on disk.
  try {
    const existing = await FileSystem.readDirectoryAsync(dir);
    await Promise.all(
      existing
        .filter((f) => f.startsWith('result_'))
        .map((f) => FileSystem.deleteAsync(dir + f, { idempotent: true }))
    );
  } catch {}

  const ts = Date.now();
  const destUri = `${dir}result_${ts}.wav`;
  // Cache-buster: forces a fresh HTTP request even if the URL was previously cached.
  const result = await FileSystem.downloadAsync(`${baseUrl}/download?_=${ts}`, destUri);
  if (result.status >= 400) {
    await FileSystem.deleteAsync(destUri, { idempotent: true });
    throw new Error(
      `Le serveur n'a pas pu fournir le fichier transformé (HTTP ${result.status}).\n` +
      `Vérifiez que le modèle RAVE a bien traité l'audio.`
    );
  }
  return result.uri;
}