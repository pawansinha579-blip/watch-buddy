import type { Handler } from "@netlify/functions";
import { getRoomService, jsonResponse, makeToken, validateName } from "./shared.js";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed." });

  let name: unknown;
  try {
    name = JSON.parse(event.body || "{}").name;
  } catch {
    return jsonResponse(400, { error: "The request body must be valid JSON." });
  }

  if (!validateName(name)) {
    return jsonResponse(400, { error: "Enter a display name between 1 and 32 characters." });
  }

  try {
    const roomId = crypto.randomUUID();
    await getRoomService().createRoom({
      name: roomId,
      emptyTimeout: 300,
      maxParticipants: 20,
    });
    const credentials = await makeToken(roomId, name);
    return jsonResponse(201, { roomId, ...credentials });
  } catch (error) {
    console.error("Could not create LiveKit room:", error);
    return jsonResponse(503, { error: "We couldn't create your room right now. Check the service configuration and try again." });
  }
};
