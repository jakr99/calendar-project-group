import { d as db } from '../../chunks/databaseAggregateFunctions_CoeIMPoz.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  let command;
  try {
    command = await request.json();
  } catch (error) {
    console.log(`Error: ${error}`);
    return new Response(JSON.stringify({ error: "Invalid JSON format" }), { status: 400 });
  }
  const { name, password, email } = command.payload || {};
  if (!name || !password || !email || !command.commandId) {
    return new Response(JSON.stringify({ error: "Missing required fields in payload" }), { status: 400 });
  }
  try {
    const newUser = await db.createUserWithOutbox(
      name,
      password,
      email,
      command.commandId
    );
    if (!newUser) {
      return new Response(JSON.stringify({ status: "Username taken" }), { status: 409 });
    }
    await db.addGroup(`User-${newUser}'s Group`, newUser);
    const gid = await db.findGroupFromUser(newUser);
    if (!gid) {
      throw new Error("Failed to find group for the new user");
    }
    await db.addBlankCalendar(gid, `User-${newUser} 's Calendar`);
    return new Response(
      JSON.stringify({ status: "accepted", commandId: command.commandId, userId: newUser }),
      { status: 202 }
    );
  } catch (error) {
    console.error(`Error: ${error}`);
    if (error.message?.includes("UNIQUE constraint failed")) {
      return new Response(JSON.stringify({ status: "already_processed" }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
