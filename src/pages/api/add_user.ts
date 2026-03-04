import { db } from '../../database/databaseAggregateFunctions';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  // In case of a bad JSON
  let command;
  try {
    command = await request.json();
  } catch (error) {
    console.log(`Error: ${error}`);
    return new Response(JSON.stringify({ error: 'Invalid JSON format' }), { status: 400 });
  }

  //check if command != null
  const { name, password, email } = command.payload || {};
  if (!name || !password || !email || !command.commandId) {
    return new Response(JSON.stringify({ error: 'Missing required fields in payload' }), { status: 400 });
  }

  // Idempotency check and create user
  try {
    const newUser = await db.createUserWithOutbox(
      name,
      password,
      email,
      command.commandId
    );

    if (!newUser) {
      return new Response(JSON.stringify({ status: 'Username taken' }), { status: 409 });
    }

    //adds user to a new group
    await db.addGroup(`User-${newUser}\'s Group`, newUser);

    //finds the new group id
    const gid = await db.findGroupFromUser(newUser);
    if (!gid) {
      throw new Error('Failed to find group for the new user');
    }

    await db.addBlankCalendar(gid, `User-${newUser} \'s Calendar`);
    // Outbox entry created inside db.createUserWithOutbox
    return new Response(
      JSON.stringify({ status: 'accepted', commandId: command.commandId, userId: newUser }),
      { status: 202 }
    );
  } catch (error: any) {
    console.error(`Error: ${error}`);
    if (error.message?.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ status: 'already_processed' }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
