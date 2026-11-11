import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

const ROOM_ID_PATTERN = /^[a-f0-9-]{36}$/i;

export function getLiveKitConfig() {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("LiveKit is not configured. Add LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET to the server environment.");
  }
  return { url: LIVEKIT_URL, key: LIVEKIT_API_KEY, secret: LIVEKIT_API_SECRET };
}

export function getRoomService() {
  const config = getLiveKitConfig();
  const httpUrl = config.url.replace(/^ws/i, "http");
  return new RoomServiceClient(httpUrl, config.key, config.secret);
}

export function validateRoomId(roomId: unknown): roomId is string {
  return typeof roomId === "string" && ROOM_ID_PATTERN.test(roomId);
}

export function validateName(name: unknown): name is string {
  return typeof name === "string" && name.trim().length > 0 && name.trim().length <= 32;
}

export async function makeToken(roomId: string, name: string) {
  const config = getLiveKitConfig();
  const token = new AccessToken(config.key, config.secret, {
    identity: `${crypto.randomUUID()}`,
    name: name.trim(),
    ttl: "6h",
  });
  token.addGrant({
    roomJoin: true,
    room: roomId,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return { token: await token.toJwt(), serverUrl: config.url };
}

export function jsonResponse(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}
