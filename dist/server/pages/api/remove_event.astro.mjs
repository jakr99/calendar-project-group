import { d as db } from '../../chunks/databaseAggregateFunctions_CoeIMPoz.mjs';
export { renderers } from '../../renderers.mjs';

process.env.JWT_SECRET || "supersecret-key-that-no-one-knows";
const POST = async ({ request }) => {
  let command;
  try {
    command = await request.json();
  } catch (error) {
    console.log(`Error: ${error}`);
    return new Response(JSON.stringify({ error: "Invalid JSON format" }), { status: 400 });
  }
  try {
    const exists = await db.getQuery("SELECT CommandID FROM Commands WHERE CommandID = ?", [command.commandId]);
    if (exists) {
      return new Response(JSON.stringify({ status: "already_processed" }), { status: 200 });
    }
    const Eid = command.payload.Eid;
    if (!Eid) {
      return new Response(JSON.stringify({ error: "Missing Event ID (Eid)" }), { status: 400 });
    }
    await db.deleteEvent(Number(Eid));
    const sqlCommand = "INSERT INTO Commands (CommandID) VALUES (?)";
    await db.runQuery(sqlCommand, [command.commandId]);
    return new Response(
      JSON.stringify({ status: "accepted", commandId: command.commandId }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Deletion Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
