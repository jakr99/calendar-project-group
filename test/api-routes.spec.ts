import { expect } from 'chai';
import jwt from 'jsonwebtoken';

import { db } from '../src/database/databaseAggregateFunctions';
import { POST as addUserRoute } from '../src/pages/api/add_user';
import { POST as createEventRoute } from '../src/pages/api/events';
import { POST as findUserRoute } from '../src/pages/api/find_user';
import { GET as getEventsRoute } from '../src/pages/api/get_events';
import { GET as getUserRoute } from '../src/pages/api/get_user';
import { POST as removeEventRoute } from '../src/pages/api/remove_event';
import { POST as signoutRoute } from '../src/pages/api/signout';
import { resetSharedTestDatabase } from './helpers/testDatabase';

const SECRET = process.env.JWT_SECRET || 'supersecret-key-that-no-one-knows';

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

function makeSessionCookie(userId: number | string) {
  const token = jwt.sign({ userId }, SECRET, { expiresIn: '2d' });
  return `session=${token}`;
}

async function readJson(response: Response) {
  return response.json();
}

async function seedUserGroupCalendar() {
  const userId = await db.createUserWithOutbox(
    'ApiUser',
    'api-pass',
    'api-user@test.dev',
    'api-seed-command',
  );

  await db.addGroup('API Group', userId);

  const groupId = await db.findGroupFromUser(userId);
  await db.addBlankCalendar(groupId as number, 'API Calendar');

  return { userId, groupId: groupId as number };
}

describe('API routes', function () {
  beforeEach(async function () {
    await resetSharedTestDatabase();
  });

  it('add_user returns 400 for invalid JSON', async function () {
    const response = await addUserRoute({
      request: makeRequest('http://test.local/api/add_user', {
        method: 'POST',
        body: '{bad json',
        headers: { 'content-type': 'application/json' },
      }),
    } as never);

    expect(response.status).to.equal(400);
    expect(await readJson(response)).to.deep.equal({ error: 'Invalid JSON format' });
  });

  it('add_user creates the user, group, calendar, and outbox records', async function () {
    const response = await addUserRoute({
      request: makeRequest('http://test.local/api/add_user', {
        method: 'POST',
        body: JSON.stringify({
          commandId: 'register-command',
          payload: {
            name: 'RegisterUser',
            email: 'register-user@test.dev',
            password: 'register-pass',
          },
        }),
        headers: { 'content-type': 'application/json' },
      }),
    } as never);

    const body = await readJson(response);

    expect(response.status).to.equal(202);
    expect(body.status).to.equal('accepted');
    expect(body.userId).to.be.a('number').and.greaterThan(0);

    const createdUser = await db.getQuery('SELECT Uid FROM Users WHERE email = ?', ['register-user@test.dev']);
    const groupId = await db.findGroupFromUser(body.userId);
    const calendarIds = await db.findCidsFromGCal(groupId as number);
    const outboxRows = await db.getAllQuery('SELECT OutboxId FROM Outbox WHERE AggregateId = ?', [body.userId]);

    expect(createdUser.Uid).to.equal(body.userId);
    expect(groupId).to.be.a('number');
    expect(calendarIds).to.have.length(1);
    expect(outboxRows).to.have.length(1);
  });

  it('find_user returns 400 for missing payload values', async function () {
    const response = await findUserRoute({
      request: makeRequest('http://test.local/api/find_user', {
        method: 'POST',
        body: JSON.stringify({
          commandId: 'missing-login-fields',
          payload: { email: 'missing@test.dev' },
        }),
        headers: { 'content-type': 'application/json' },
      }),
    } as never);

    expect(response.status).to.equal(400);
    expect(await readJson(response)).to.deep.equal({ error: 'Invalid payload' });
  });

  it('find_user signs the user in and sets the session cookie', async function () {
    await db.createUserWithOutbox(
      'SigninUser',
      'signin-pass',
      'signin-user@test.dev',
      'signin-seed-command',
    );

    const response = await findUserRoute({
      request: makeRequest('http://test.local/api/find_user', {
        method: 'POST',
        body: JSON.stringify({
          commandId: 'signin-command',
          payload: {
            email: 'signin-user@test.dev',
            password: 'signin-pass',
          },
        }),
        headers: { 'content-type': 'application/json' },
      }),
    } as never);

    const body = await readJson(response);
    const cookie = response.headers.get('Set-Cookie');

    expect(response.status).to.equal(200);
    expect(body.status).to.equal('accepted');
    expect(cookie).to.include('session=');
    expect(cookie).to.include('HttpOnly');
  });

  it('get_user returns 401 without a session cookie', async function () {
    const response = await getUserRoute({
      request: makeRequest('http://test.local/api/get_user'),
    } as never);

    expect(response.status).to.equal(401);
    expect(await readJson(response)).to.deep.equal({ error: 'Not Authenticated' });
  });

  it('get_user returns 401 for an invalid token', async function () {
    const response = await getUserRoute({
      request: makeRequest('http://test.local/api/get_user', {
        headers: { cookie: 'session=not-a-real-token' },
      }),
    } as never);

    expect(response.status).to.equal(401);
    expect(await readJson(response)).to.deep.equal({ error: 'Invalid or expired token' });
  });

  it('get_user returns the current user data', async function () {
    const userId = await db.createUserWithOutbox(
      'CurrentUser',
      'current-pass',
      'current-user@test.dev',
      'current-user-command',
    );

    const response = await getUserRoute({
      request: makeRequest('http://test.local/api/get_user', {
        headers: { cookie: makeSessionCookie(userId) },
      }),
    } as never);

    const body = await readJson(response);

    expect(response.status).to.equal(200);
    expect(body.data).to.include({
      Uid: userId,
      email: 'current-user@test.dev',
      username: 'CurrentUser',
    });
  });

  it('events returns 401 without authentication', async function () {
    const response = await createEventRoute({
      request: makeRequest('http://test.local/api/events', {
        method: 'POST',
        body: JSON.stringify({ commandId: 'unauth-event', payload: {} }),
        headers: { 'content-type': 'application/json' },
      }),
    } as never);

    expect(response.status).to.equal(401);
    expect(await readJson(response)).to.deep.equal({ error: 'Not authenticated' });
  });

  it('events returns 400 for invalid JSON', async function () {
    const response = await createEventRoute({
      request: makeRequest('http://test.local/api/events', {
        method: 'POST',
        body: '{broken json',
        headers: {
          'content-type': 'application/json',
          cookie: makeSessionCookie(1),
        },
      }),
    } as never);

    expect(response.status).to.equal(400);
    expect(await readJson(response)).to.deep.equal({ error: 'Invalid JSON format' });
  });

  it('events returns 400 for missing payload fields', async function () {
    const { userId } = await seedUserGroupCalendar();

    const response = await createEventRoute({
      request: makeRequest('http://test.local/api/events', {
        method: 'POST',
        body: JSON.stringify({
          commandId: 'missing-event-payload',
          payload: { title: 'Only Title' },
        }),
        headers: {
          'content-type': 'application/json',
          cookie: makeSessionCookie(userId),
        },
      }),
    } as never);

    expect(response.status).to.equal(400);
    expect(await readJson(response)).to.deep.equal({ error: 'Invalid payload' });
  });

  it('events creates an event and persists the related records', async function () {
    const { userId } = await seedUserGroupCalendar();

    const response = await createEventRoute({
      request: makeRequest('http://test.local/api/events', {
        method: 'POST',
        body: JSON.stringify({
          commandId: 'create-event-command',
          payload: {
            title: 'API Event',
            date: '2026-06-10T12:00:00.000Z',
            time: '2026-06-10T12:00:00.000Z',
            type: '3',
          },
        }),
        headers: {
          'content-type': 'application/json',
          cookie: makeSessionCookie(userId),
        },
      }),
    } as never);

    const body = await readJson(response);
    const eventCore = await db.getQuery('SELECT Title FROM EventCore WHERE Eid = ?', [body.eventId]);
    const command = await db.getQuery('SELECT CommandID FROM Commands WHERE CommandID = ?', ['create-event-command']);
    const outbox = await db.getQuery(
      "SELECT outboxType FROM Outbox WHERE AggregateId = ? AND outboxType = 'EventCreated'",
      [body.eventId],
    );

    expect(response.status).to.equal(200);
    expect(body.status).to.equal('accepted');
    expect(body.eventId).to.be.a('number').and.greaterThan(0);
    expect(eventCore).to.deep.equal({ Title: 'API Event' });
    expect(command).to.deep.equal({ CommandID: 'create-event-command' });
    expect(outbox).to.deep.equal({ outboxType: 'EventCreated' });
  });

  it('get_events returns 401 without a session cookie', async function () {
    const response = await getEventsRoute({
      request: makeRequest('http://test.local/api/get_events'),
    } as never);

    expect(response.status).to.equal(401);
    expect(await readJson(response)).to.deep.equal({ error: 'Not authenticated' });
  });

  it('get_events returns transformed event payloads for the signed-in user', async function () {
    const { userId, groupId } = await seedUserGroupCalendar();

    const eventId = await db.createEventWithOutbox(
      userId,
      groupId,
      'Shared Event',
      'Visible in get_events',
      '2026-07-01T09:15:00.000Z',
      '3',
    );

    const response = await getEventsRoute({
      request: makeRequest('http://test.local/api/get_events', {
        headers: { cookie: makeSessionCookie(userId) },
      }),
    } as never);

    const body = await readJson(response);

    expect(response.status).to.equal(200);
    expect(body.status).to.equal('accepted');
    expect(body.events).to.have.length(1);
    expect(body.events[0]).to.include({
      title: 'Shared Event',
      id: eventId,
    });
  });

  it('remove_event returns 400 when the event id is missing', async function () {
    const response = await removeEventRoute({
      request: makeRequest('http://test.local/api/remove_event', {
        method: 'POST',
        body: JSON.stringify({
          commandId: 'missing-remove-eid',
          payload: {},
        }),
        headers: { 'content-type': 'application/json' },
      }),
    } as never);

    expect(response.status).to.equal(400);
    expect(await readJson(response)).to.deep.equal({ error: 'Missing Event ID (Eid)' });
  });

  it('remove_event deletes the event and records the command', async function () {
    const { userId, groupId } = await seedUserGroupCalendar();
    const eventId = await db.createEventWithOutbox(
      userId,
      groupId,
      'Delete via API',
      'API delete flow',
      '2026-08-01T14:00:00.000Z',
      '3',
    );

    const response = await removeEventRoute({
      request: makeRequest('http://test.local/api/remove_event', {
        method: 'POST',
        body: JSON.stringify({
          commandId: 'remove-event-command',
          payload: { Eid: eventId },
        }),
        headers: { 'content-type': 'application/json' },
      }),
    } as never);

    const body = await readJson(response);
    const deletedEvent = await db.getQuery('SELECT Eid FROM EventCore WHERE Eid = ?', [eventId]);
    const command = await db.getQuery('SELECT CommandID FROM Commands WHERE CommandID = ?', ['remove-event-command']);

    expect(response.status).to.equal(200);
    expect(body.status).to.equal('accepted');
    expect(deletedEvent).to.equal(undefined);
    expect(command).to.deep.equal({ CommandID: 'remove-event-command' });
  });

  it('signout clears the session cookie', async function () {
    const response = await signoutRoute({
      request: makeRequest('http://test.local/api/signout', { method: 'POST' }),
    } as never);

    expect(response.status).to.equal(200);
    expect(await readJson(response)).to.deep.equal({ status: 'signed_out' });
    expect(response.headers.get('Set-Cookie')).to.include('Max-Age=0');
  });
});
