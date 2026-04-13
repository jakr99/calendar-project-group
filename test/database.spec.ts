import { expect } from 'chai';

import { createIsolatedTestDatabase } from './helpers/testDatabase';

describe('DatabaseAggregateFunctions', function () {
  it('sets up the schema and supports runQuery/getQuery', async function () {
    const isolated = await createIsolatedTestDatabase('schema');

    try {
      const tables = await isolated.db.getAllQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      );

      expect(tables.map((row: { name: string }) => row.name)).to.include.members([
        'Commands',
        'EventAdd',
        'EventCore',
        'EventTime',
        'Outbox',
        'Users',
      ]);

      await isolated.db.runQuery(
        'INSERT INTO Users (email, username, pass) VALUES (?, ?, ?)',
        ['query@test.dev', 'QueryUser', 'secret'],
      );

      const insertedUser = await isolated.db.getQuery(
        'SELECT username, email FROM Users WHERE email = ?',
        ['query@test.dev'],
      );

      expect(insertedUser).to.deep.equal({
        username: 'QueryUser',
        email: 'query@test.dev',
      });
    } finally {
      await isolated.cleanup();
    }
  });

  it('creates a user together with command and outbox records', async function () {
    const isolated = await createIsolatedTestDatabase('create-user');

    try {
      const userId = await isolated.db.createUserWithOutbox(
        'CreateUser',
        'test-pass',
        'create-user@test.dev',
        'command-create-user',
      );

      expect(userId).to.be.a('number').and.greaterThan(0);

      const createdUser = await isolated.db.getQuery(
        'SELECT Uid, email, username FROM Users WHERE Uid = ?',
        [userId],
      );
      const command = await isolated.db.getQuery(
        'SELECT CommandID FROM Commands WHERE CommandID = ?',
        ['command-create-user'],
      );
      const outbox = await isolated.db.getQuery(
        'SELECT outboxType, AggregateId FROM Outbox WHERE AggregateId = ?',
        [userId],
      );

      expect(createdUser).to.include({
        Uid: userId,
        email: 'create-user@test.dev',
        username: 'CreateUser',
      });
      expect(command).to.deep.equal({ CommandID: 'command-create-user' });
      expect(outbox).to.include({
        outboxType: 'UserCreated',
        AggregateId: userId,
      });
    } finally {
      await isolated.cleanup();
    }
  });

  it('rejects invalid user creation input', async function () {
    const isolated = await createIsolatedTestDatabase('invalid-user');

    try {
      let caughtError: unknown;

      try {
        await isolated.db.createUserWithOutbox(
          null as unknown as string,
          null as unknown as string,
          null as unknown as string,
          null as unknown as string,
        );
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).to.be.instanceOf(Error);
    } finally {
      await isolated.cleanup();
    }
  });

  it('creates an event and exposes group and calendar lookups', async function () {
    const isolated = await createIsolatedTestDatabase('create-event');

    try {
      const userId = await isolated.db.createUserWithOutbox(
        'EventUser',
        'event-pass',
        'event-user@test.dev',
        'command-event-user',
      );

      await isolated.db.addGroup('Event Group', userId);
      const groupId = await isolated.db.findGroupFromUser(userId);
      expect(groupId).to.be.a('number');

      await isolated.db.addBlankCalendar(groupId as number, 'Event Calendar');
      const calendarIds = await isolated.db.findCidsFromGCal(groupId as number);

      expect(calendarIds).to.have.length(1);

      const eventId = await isolated.db.createEventWithOutbox(
        userId,
        groupId as number,
        'Planning Session',
        'Sprint planning',
        '2026-05-01T10:30:00.000Z',
        '3',
      );

      expect(eventId).to.be.a('number').and.greaterThan(0);

      const eventCore = await isolated.db.getQuery(
        'SELECT Eid, Title, Description FROM EventCore WHERE Eid = ?',
        [eventId],
      );
      const eventTime = await isolated.db.getQuery(
        'SELECT EventID FROM EventTime WHERE EventID = ?',
        [eventId],
      );
      const eventType = await isolated.db.getQuery(
        'SELECT TypeID, EventID FROM EventType WHERE EventID = ?',
        [eventId],
      );
      const eventAdd = await isolated.db.getQuery(
        'SELECT CalendarID, EventID FROM EventAdd WHERE EventID = ?',
        [eventId],
      );
      const outbox = await isolated.db.getQuery(
        "SELECT outboxType, AggregateId FROM Outbox WHERE AggregateId = ? AND outboxType = 'EventCreated'",
        [eventId],
      );

      expect(eventCore).to.include({
        Eid: eventId,
        Title: 'Planning Session',
        Description: 'Sprint planning',
      });
      expect(eventTime).to.deep.equal({ EventID: eventId });
      expect(eventType).to.deep.equal({ TypeID: 3, EventID: eventId });
      expect(eventAdd).to.deep.equal({ CalendarID: calendarIds[0], EventID: eventId });
      expect(outbox).to.include({
        outboxType: 'EventCreated',
        AggregateId: eventId,
      });
    } finally {
      await isolated.cleanup();
    }
  });

  it('rolls back event creation when the user group has no calendar', async function () {
    const isolated = await createIsolatedTestDatabase('rollback-event');

    try {
      const userId = await isolated.db.createUserWithOutbox(
        'RollbackUser',
        'rollback-pass',
        'rollback-user@test.dev',
        'command-rollback-user',
      );

      await isolated.db.addGroup('Rollback Group', userId);
      const groupId = await isolated.db.findGroupFromUser(userId);

      let caughtError: unknown;

      try {
        await isolated.db.createEventWithOutbox(
          userId,
          groupId as number,
          'Broken Event',
          'Should fail',
          '2026-05-01T10:30:00.000Z',
          '3',
        );
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).to.be.instanceOf(Error);
      expect((caughtError as Error).message).to.include('No calendar found');

      const createdEventRows = await isolated.db.getAllQuery('SELECT Eid FROM EventCore');
      const createdTimeRows = await isolated.db.getAllQuery('SELECT EventID FROM EventTime');
      const outboxRows = await isolated.db.getAllQuery(
        "SELECT OutboxId FROM Outbox WHERE outboxType = 'EventCreated'",
      );

      expect(createdEventRows).to.have.length(0);
      expect(createdTimeRows).to.have.length(0);
      expect(outboxRows).to.have.length(0);
    } finally {
      await isolated.cleanup();
    }
  });

  it('deletes an event and all related mappings', async function () {
    const isolated = await createIsolatedTestDatabase('delete-event');

    try {
      const userId = await isolated.db.createUserWithOutbox(
        'DeleteUser',
        'delete-pass',
        'delete-user@test.dev',
        'command-delete-user',
      );

      await isolated.db.addGroup('Delete Group', userId);
      const groupId = await isolated.db.findGroupFromUser(userId);
      await isolated.db.addBlankCalendar(groupId as number, 'Delete Calendar');

      const eventId = await isolated.db.createEventWithOutbox(
        userId,
        groupId as number,
        'Delete Event',
        'Delete me',
        '2026-05-01T10:30:00.000Z',
        '3',
      );

      await isolated.db.deleteEvent(eventId);

      const eventCore = await isolated.db.getQuery('SELECT Eid FROM EventCore WHERE Eid = ?', [eventId]);
      const eventTime = await isolated.db.getQuery('SELECT EventID FROM EventTime WHERE EventID = ?', [eventId]);
      const eventType = await isolated.db.getQuery('SELECT EventID FROM EventType WHERE EventID = ?', [eventId]);
      const eventAdd = await isolated.db.getQuery('SELECT EventID FROM EventAdd WHERE EventID = ?', [eventId]);

      expect(eventCore).to.equal(undefined);
      expect(eventTime).to.equal(undefined);
      expect(eventType).to.equal(undefined);
      expect(eventAdd).to.equal(undefined);
    } finally {
      await isolated.cleanup();
    }
  });
});
