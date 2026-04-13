import { d as db } from '../../chunks/databaseAggregateFunctions_CoeIMPoz.mjs';
import jwt from 'jsonwebtoken';
export { renderers } from '../../renderers.mjs';

const SECRET = process.env.JWT_SECRET || "supersecret-key-that-no-one-knows";
const POST = async ({ request }) => {
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
    if (!command?.payload?.email || !command?.payload?.password) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }
    const sql = "SELECT Uid, pass FROM users WHERE email = ?";
    const user = await db.getQuery(sql, [command.payload.email]);
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }
    if (user.pass !== command.payload.password) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }
    const sqlCommand = "INSERT INTO Commands (CommandID) VALUES (?)";
    await db.runQuery(sqlCommand, [command.commandId]);
    const token = jwt.sign({ userId: user.Uid }, SECRET, { expiresIn: "2d" });
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `session=${token}; HttpOnly; path=/; Max-Age=${2 * 24 * 60 * 60}; Same-Site=Strict`
    );
    return new Response(
      JSON.stringify({ status: "accepted", commandId: command.commandId, userId: user.Uid }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Database Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
