//src/database/databaseAggregateFunctions.ts
import sqlite3 from "sqlite3";
import path from 'node:path';

class DatabaseAggregateFunctions {

  db: sqlite3.Database;

  constructor(name: string) {
    const dbPath = path.resolve(process.cwd(), `${name}`);
    this.db = new sqlite3.Database(dbPath, (err: Error | null) => {
      if (err)
        console.error(err.message);
      else
        console.log(`Connected to the SQLite database: ./${name}.`);
    });
  }

  //gets all rows in database from sql statement
  getAllQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, function (this: sqlite3.RunResult, err: Error | null, rows: any) {
        if (err) {
          console.error("Error running sql: " + sql);
          console.error(err.message);
          reject(err);
        }
        else
          resolve(rows || []);
      });
    });
  }

  //runs provided sql query with parameters
  runQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          console.error(err.message);
          console.log("Error running sql: " + sql);
          console.log(err);
          reject(err);
        }
        else
          resolve({ id: (this && (this as any).lastID) });
      });
    });
  }

  //gets a single row from the database
  getQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err: Error | null, row: any) => {
        if (err) return reject(err);
        console.log("Row found!:", row);
        resolve(row);
      });
    });
  }

  async findEvent(EventId: number) {
    const sqlCore = "SELECT * FROM EventCore WHERE Eid=?";
    const sqlTime = "SELECT * FROM EventTime WHERE EventID=?";
    const sqlTypeId = "SELECT * FROM EventType WHERE EventID=?";
    const sqlType = "SELECT Tname FROM Type WHERE Tid=?";

    try {
      const Core = await this.getQuery(sqlCore, [EventId]);
      const Time = await this.getQuery(sqlTime, [EventId]);
      const TypeID = await this.getQuery(sqlTypeId, [EventId]);
      const Type = await this.getQuery(sqlType, TypeID.TypeID);

      console.log("findEvents:");
      console.log(Core);
      console.log(Time);
      console.log(TypeID);
      console.log(Type);
      const outboxPayload = {
        title: Core.Title,
        date: new Date(Time.EYear, (Time.Month - 1), Time.Day, Time.StartTime.split(":")[0] as unknown as number, Time.StartTime.split(":")[1] as unknown as number),
        type: Type.Tname,
        id: EventId,
      };

      console.log("outbox payload");
      console.log(outboxPayload);

      return outboxPayload;
    }
    catch (err: any) {
      console.error("Transaction failed", err);
      throw err;
    }
  }

  async addOutbox(type: string, aggregateId: number, payload: any, createdAt: string): Promise<void> {
    const sql = "INSERT INTO Outbox (outboxType, AggregateId, Payload, CreatedAt, Processed) VALUES (?, ?, ?, ?, ?)";
    await this.runQuery(sql, [type, aggregateId, JSON.stringify(payload), createdAt, 0]);
    }


  //creates an event with outbox pattern implemented
  async createUserWithOutbox(username: string, password: string, Email: string, commandID: string): Promise<any> {

    //Start Transaction
    await this.runQuery("BEGIN TRANSACTION");

    try {
      //save Command ID in database
      const sqlCommand = "INSERT INTO Commands (CommandID) VALUES (?)";
      await this.runQuery(sqlCommand, [commandID]);

      //Insert into users
      const sqlUser = "INSERT INTO users (email, username, pass) VALUES (?, ?, ?)"
      const newUser = await this.runQuery(sqlUser, [Email, username, password]);
      const newUserID = newUser.id;

      if (!newUserID)
        throw new Error("User creation failed");

      //Insert into Outbox (Using the new user ID)
      const outboxPayload = {
        userId: newUserID,
        password: password,
        email: Email,
        status: 'Created'
      };

      const sqlOutbox = "INSERT INTO Outbox (outboxType, AggregateId, Payload, CreatedAt, Processed) VALUES (?, ?, ?, ?, ?)";
      await this.runQuery(sqlOutbox, ['UserCreated', newUserID, JSON.stringify(outboxPayload), new Date().toISOString(), 0]);

      // Commit Transaction
      await this.runQuery("COMMIT");

      return newUserID;

    } catch (err) {
      console.error("Transaction failed, rolling back", err);
      await this.runQuery("ROLLBACK");
      throw err;
    }
  }

  //creates an event with outbox pattern implemented
  async createEventWithOutbox(userId: number, groupId: number, eventTitle: string, description: string, dateTime: string | Date, type: string): Promise<any> {

    const dateObj = new Date(dateTime);
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    const startTime = dateObj.toLocaleTimeString();
    //default event duration is 1 hour - can be modified later
    const endDateObj = new Date(dateObj.getTime() + (60 * 60 * 1000));
    const endTime = endDateObj.toLocaleTimeString();

    //Start Transaction
    await this.runQuery("BEGIN TRANSACTION");

    try {
      //Insert into EventCore
      const sqlECore = "INSERT INTO EventCore (Title, Description) VALUES (?, ?)";
      const coreResult = await this.runQuery(sqlECore, [eventTitle, description]);
      const newEventID = (coreResult && (coreResult as any).id) || coreResult; // Capture the ID generated by SQLite

      //Insert into EventTime
      const sqlETime = "INSERT INTO EventTime (EventID, StartTime, EndTime, Day, Month, EYear) VALUES (?, ?, ?, ?, ?, ?)";
      await this.runQuery(sqlETime, [newEventID, startTime, endTime, day, month, year]);

      const sqlEventType = "INSERT INTO EventType (TypeID, EventID) VALUES (?, ?)";
      await this.runQuery(sqlEventType, [Number(type), newEventID]);

      //find calendar ID from GCal for that group
      const calIds = await this.findCidsFromGCal(groupId);
      //if calendar does not exist for group, abort
      if (calIds.length === 0) {
        throw new Error(`No calendar found for Group ID: ${groupId}. Event creation aborted.`);
      }

      // Proceed if calendar exists
      const sqlEventAdd = "INSERT INTO EventAdd (CalendarID, EventID) VALUES (?, ?)";
      await this.runQuery(sqlEventAdd, [calIds[0], newEventID]);

      //Insert into Outbox (Using the new Event ID)
      const outboxPayload = {
        eventId: newEventID,
        userId: userId,
        groupId: groupId,
        title: eventTitle,
        status: 'Created'
      };

      const sqlOutbox = "INSERT INTO Outbox (outboxType, AggregateId, Payload, CreatedAt, Processed) VALUES (?, ?, ?, ?, ?)";
      await this.runQuery(sqlOutbox, ['EventCreated', newEventID, JSON.stringify(outboxPayload), new Date().toISOString(), 0]);

      // Commit Transaction
      await this.runQuery("COMMIT");

      return newEventID;

    } catch (err) {
      console.error("Transaction failed, rolling back", err);
      await this.runQuery("ROLLBACK");
      throw err;
    }
  }

  //adds a new group with that user as a member - complete
  async addGroup(name: string, userID: number): Promise<void> {
    const sqlGroup = "INSERT INTO Groups (Gname) VALUES (?)";
    const sqlIncludes = "INSERT INTO Included (Userid, Groupid) VALUES (?, ?)";

    try {
      //Insert the new group into Groups table
      const result = await this.runQuery(sqlGroup, [name]);
      //console.log(`Group ${name} added to the database.`);

      // Get the ID of the newly created group
      const GroupID = result.id;
      //console.log(`The Group ID is ${GroupID}`);

      //Insert the mapping of group and user into Included table
      await this.runQuery(sqlIncludes, [userID, GroupID]);
      //console.log(`User ${userID} added to Group ${GroupID}.`);
    } catch (err) {
      console.error("Error adding group:", err);
    }
  }

  //Adds a user to an existing group - complete
  async addUserToGroup(UserID: number, GroupID: number): Promise<void> {
    const sqlIncludes = "INSERT INTO Included (Userid, Groupid) VALUES (?, ?)";

    try {
      //map a new user to a group via included table
      await this.runQuery(sqlIncludes, [UserID, GroupID]);
      //console.log(`User ${userID} added to Group ${GroupID}.`);
    } catch (err) {
      console.error("Error adding group:", err);
    }
  }

  //Adds a new event to a calendar - complete
  async addEvent(ETitle: string, Description: string, Type: string, StartTime: string, EndTime: string, Day: number, Month: number, Year: number, CalID: number): Promise<void> {
    const sqlECore = "INSERT INTO EventCore (Title, Description) VALUES (?, ?)";
    const sqlETime = "INSERT INTO EventTime (EventID, StartTime, EndTime, Day, Month, EYear) VALUES (?, ?, ?, ?, ?, ?)";
    const sqlEventAdd = "INSERT INTO EventAdd (CalendarID, EventID) VALUES (?, ?)";
    const sqlEType = "INSERT INTO Type (Tname) VALUES (?)";
    const sqlEventType = "INSERT INTO EventType (TypeID, EventID) VALUES (?, ?)";
    try {
      const result = await this.runQuery(sqlECore, [ETitle, Description]);
      //console.log(`Event ${ETitle} added to EventCore.`);

      await this.runQuery(sqlETime, [result.id, StartTime, EndTime, Day, Month, Year]);
      //console.log(`Event ${result.id} added to EventTime.`);

      await this.runQuery(sqlEventAdd, [CalID, result.id]);
      //console.log(`Event ${result.id} added to EventAdd.`);

      const typeObject = await this.runQuery(sqlEType, [Type]);

      await this.runQuery(sqlEventType, [typeObject.id, result.id]);

    } catch (err) {
      console.error("Error adding Event:", err);
    }
  }

  //Adds a blank calendar to a group - complete
  async addBlankCalendar(Gid: number, calName: string): Promise<void> {

    const sql = "INSERT INTO Calendar (Cname) VALUES (?)";
    const sqlGCal = "INSERT INTO GCal (GroupID, CalendarID) VALUES (?, ?)";
    try {
      const result = await this.runQuery(sql, [calName]);

      //console.log(`Calender ${calName} added.`);
      //console.log(`The Calendar ID is ${result.id}`);

      await this.runQuery(sqlGCal, [Gid, result.id]);

      //console.log(`mapping of Group and Calendar`);
    }
    catch (err) {
      console.error("Error adding Calendar:", err);
    }
  }

  //Deletes an event from a calendar - Complete
  async deleteEvent(EventID: number): Promise<void> {
    const sqlDeleteEventAdded = "DELETE FROM EventAdd WHERE EventID = ?";
    const sqlDeleteECore = "DELETE FROM EventCore WHERE Eid = ?";
    const sqlDeleteEType = "DELETE FROM EventType WHERE EventID = ?";
    const sqlDeleteETime = "DELETE FROM EventTime WHERE EventID = ?";

    //wrap all sql commands in a "Packet" so that in the instance of a server crash,
    //it can rollback to the previous stable state
    await this.runQuery("BEGIN TRANSACTION");

    try {
      //Delete the EventTime from EventType table
      await this.runQuery(sqlDeleteEType, [EventID]);
      console.log(`Type mapping ${EventID} Deleted from Type.`);

      //Delete the Event from EventCore table
      await this.runQuery(sqlDeleteECore, [EventID]);
      console.log(`Event ${EventID} Deleted from EventCore.`);

      //Delete all mappings of this Event to Calendar from EventAdd table
      await this.runQuery(sqlDeleteEventAdded, [EventID]);
      console.log(`Event mapping ${EventID} Deleted from EventAdd.`);

      //Delete from EventTime table
      await this.runQuery(sqlDeleteETime, [EventID]);
      console.log(`Event mapping ${EventID} Deleted from EventTime.`);

      //end the transaction
      await this.runQuery("COMMIT");
    }
    catch (err) {
      //roll back the delete if error occured
      await this.runQuery("ROLLBACK");
      console.error("Error deleting Event:", err);
    }
  }

  //Finds all Calendar IDs from a group - complete
  async findCidsFromGCal(Gid: number): Promise<number[]> {
    const sqlFindCIDs = `SELECT CalendarID FROM GCal WHERE GroupID = ?`;
    const rows: number[] = await new Promise((resolve, reject) => {
      this.db.all(sqlFindCIDs, [Gid], (err: Error | null, rows: any[]) => {
        if (err) {
          return reject(err);
        }
        const ids = rows.map(row => row.CalendarID);
        console.log(`Calendar Ids of Group ${ids}`);
        resolve(ids);
      });
    });
    return rows;
  }

  //Finds all Event IDs from a calendar - complete
  async findEidsFromCalendar(calID: number): Promise<number[]> {
    const sqlFindEIDs = `SELECT EventID FROM EventAdd WHERE CalendarID = ?`;
    const ids: number[] = await new Promise((resolve, reject) => {
      this.db.all(sqlFindEIDs, [calID], (err: Error | null, rows: any[]) => {
        if (err) {
          return reject(err);
        }
        const r = rows.map(row => row.EventID);
        console.log(`Event Ids of calendar ${r}`);
        resolve(r);
      });
    });
    return ids;
  }

  //Finds Group ID from a User - complete
  async findGroupFromUser(UID: number): Promise<number | null> {
    const sqlFindGIDs = `SELECT GroupID FROM Included WHERE UserID = ?`;
    const row: any = await new Promise((resolve, reject) => {
      this.db.get(sqlFindGIDs, [UID], (err: Error | null, row: any) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
    if (!row) {
      console.log(`No group found for user ${UID}`);
      return null;
    }

    return row.GroupID;
  }
}

// This is way better than instantiating the db class in every endpoint
const dbName = process.env.DB_NAME || './src/database/calendar.db';
const db = new DatabaseAggregateFunctions(dbName);
export { db };
