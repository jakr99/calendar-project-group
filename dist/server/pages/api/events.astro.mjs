import { d as db } from '../../chunks/databaseAggregateFunctions_CoeIMPoz.mjs';
import jwt from 'jsonwebtoken';
export { renderers } from '../../renderers.mjs';

const SECRET = process.env.JWT_SECRET || "supersecret-key-that-no-one-knows";
const POST = async ({ request }) => {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("="))
  );
  const token = cookies["session"];
  if (!token) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }
  let Uid;
  try {
    const decoded = jwt.verify(token, SECRET);
    Uid = decoded.userId || decoded.userid;
    if (!Uid) {
      return new Response(JSON.stringify({ error: "Token missing user identity" }), { status: 401 });
    }
  } catch (error) {
    console.log(`Error: ${error}`);
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401 });
  }
  let command;
  try {
    command = await request.json();
  } catch (error) {
    console.log(`Error: ${error}`);
    return new Response(JSON.stringify({ error: "Invalid JSON format" }), { status: 400 });
  }
  try {
    const sqlCheck = "SELECT CommandID FROM Commands WHERE CommandID = ?";
    const exists = await db.getQuery(sqlCheck, [command.commandId]);
    if (exists) {
      return new Response(JSON.stringify({ status: "already_processed" }), { status: 200 });
    }
    const { title, date, type, time } = command.payload || {};
    if (!command.payload || !title || !date) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }
    const gID = await db.findGroupFromUser(Number(Uid));
    if (!gID) {
      return new Response(JSON.stringify({ error: "User group not found" }), { status: 404 });
    }
    const eId = await db.createEventWithOutbox(Number(Uid), gID, title, "", date, type);
    const sqlCommand = "INSERT INTO Commands (CommandID) VALUES (?)";
    await db.runQuery(sqlCommand, [command.commandId]);
    return new Response(JSON.stringify({
      status: "accepted",
      commandId: command.commandId,
      userId: Uid,
      eventId: eId
    }), { status: 200 });
  } catch (error) {
    console.error("Database Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
