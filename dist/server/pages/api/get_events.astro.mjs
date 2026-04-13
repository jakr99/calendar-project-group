import { d as db } from '../../chunks/databaseAggregateFunctions_CoeIMPoz.mjs';
import jwt from 'jsonwebtoken';
export { renderers } from '../../renderers.mjs';

const SECRET = process.env.JWT_SECRET || "supersecret-key-that-no-one-knows";
const GET = async ({ request }) => {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("="))
  );
  const token = cookies["session"];
  if (!token) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }
  let userId;
  try {
    const decoded = jwt.verify(token, SECRET);
    userId = decoded.userId || decoded.userid;
    if (!userId) throw new Error("No user ID in token");
  } catch (error) {
    console.log(`Error: ${error}`);
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401 });
  }
  try {
    const gID = await db.findGroupFromUser(Number(userId));
    if (!gID) {
      return new Response(JSON.stringify({ error: "User group not found" }), { status: 404 });
    }
    const cIDs = await db.findCidsFromGCal(Number(gID));
    const eventIds = (await Promise.all(cIDs.map((c) => db.findEidsFromCalendar(c))))[0];
    console.log("Events IDs:", eventIds);
    const events = await Promise.all(eventIds.map((e) => db.findEvent(e)));
    console.log("Events:", events);
    return new Response(JSON.stringify({
      status: "accepted",
      userId,
      events
    }), { status: 200 });
  } catch (error) {
    console.error("Database Error: ", error.message);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
