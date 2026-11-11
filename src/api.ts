export type Credentials = { token: string; serverUrl: string };
export type BootstrapState = Credentials & { name: string };
type ApiResult = Credentials & { roomId?: string; error?: string };

export async function requestApi(endpoint: string, payload: object): Promise<ApiResult> {
  const response = await fetch(`/.netlify/functions/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  let result: ApiResult;
  try {
    result = await response.json() as ApiResult;
  } catch {
    throw new Error("The room service returned an invalid response. Use Netlify Dev locally or check the deployed Netlify Functions.");
  }
  if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
  return result;
}

export function roomIdFromInput(input: string): string {
  const value = input.trim();
  const path = new URL(value, window.location.origin).pathname;
  const match = path.match(/^\/room\/([a-f0-9-]{36})\/?$/i);
  return (match?.[1] || value).toLowerCase();
}
