import { d as db } from '../../chunks/databaseAggregateFunctions_CoeIMPoz.mjs';
import jwt from 'jsonwebtoken';
export { renderers } from '../../renderers.mjs';

const SECRET = process.env.JWT_SECRET || "supersecret-key-that-no-one-knows";
const GET = async ({ request }) => {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => c.trim().split("="))
    );
    const token = cookies["session"];
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Not Authenticated" }),
        { status: 401 }
      );
    }
    let userId;
    try {
      const decoded = jwt.verify(token, SECRET);
      userId = Number(decoded.userId);
    } catch (error) {
      console.log(`Error: ${error.message}`);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401 }
      );
    }
    const sql = "SELECT Uid, email, username FROM Users WHERE Uid = ?";
    const data = await db.getQuery(sql, [userId]);
    if (!data) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({ data }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.log("Get user error: ", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
