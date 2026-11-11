import type { Handler } from "@netlify/functions";
import { getRoomService, jsonResponse, makeToken, validateName, validateRoomId } from "./shared.js";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed." });

  let payload: { roomId?: unknown; name?: unknown };
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "The request body must be valid JSON." });
  }

  if (!validateRoomId(payload.roomId)) return jsonResponse(400, { error: "That room link isn't valid." });
  if (!validateName(payload.name)) return jsonResponse(400, { error: "Enter a display name between 1 and 32 characters." });
  const roomId = payload.roomId.toLowerCase();

  try {
    const rooms = await getRoomService().listRooms([roomId]);
    if (!rooms.some((room) => room.name === roomId)) {
      return jsonResponse(404, { error: "We couldn't find that room. It may have ended or the link may be incorrect." });
    }

    return jsonResponse(200, await makeToken(roomId, payload.name));
  } catch (error) {
    console.error("Could not join LiveKit room:", error);
    return jsonResponse(503, { error: "We couldn't connect to the room service. Please try again in a moment." });
  }
};
