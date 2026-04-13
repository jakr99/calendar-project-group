import sqlite3 from 'sqlite3';
import path from 'node:path';

class DatabaseAggregateFunctions {
  db;
  constructor(name) {
    const dbPath = path.resolve(process.cwd(), `${name}`);
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err)
        console.error(err.message);
      else
        console.log(`Connected to the SQLite database: ./${name}.`);
    });
  }
  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
  //gets all rows in database from sql statement
  getAllQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, function(err, rows) {
        if (err) {
          console.error("Error running sql: " + sql);
          console.error(err.message);
          reject(err);
        } else
          resolve(rows || []);
      });
    });
  }
  //runs provided sql query with parameters
  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error(err.message);
          console.log("Error running sql: " + sql);
          console.log(err);
          reject(err);
        } else
          resolve({ id: this && this.lastID });
      });
    });
  }
  //gets a single row from the database
  getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        console.log("Row found!:", row);
        resolve(row);
      });
    });
  }
  async findEvent(EventId) {
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
        date: new Date(Time.EYear, Time.Month - 1, Time.Day, Time.StartTime.split(":")[0], Time.StartTime.split(":")[1]),
        type: Type.Tname,
        id: EventId
      };
      console.log("outbox payload");
      console.log(outboxPayload);
      return outboxPayload;
    } catch (err) {
      console.error("Transaction failed", err);
      throw err;
    }
  }
  async addOutbox(type, aggregateId, payload, createdAt) {
    const sql = "INSERT INTO Outbox (outboxType, AggregateId, Payload, CreatedAt, Processed) VALUES (?, ?, ?, ?, ?)";
    await this.runQuery(sql, [type, aggregateId, JSON.stringify(payload), createdAt, 0]);
  }
  //creates an event with outbox pattern implemented
  async createUserWithOutbox(username, password, Email, commandID) {
    await this.runQuery("BEGIN TRANSACTION");
    try {
      const sqlCommand = "INSERT INTO Commands (CommandID) VALUES (?)";
      await this.runQuery(sqlCommand, [commandID]);
      const sqlUser = "INSERT INTO users (email, username, pass) VALUES (?, ?, ?)";
      const newUser = await this.runQuery(sqlUser, [Email, username, password]);
      const newUserID = newUser.id;
      if (!newUserID)
        throw new Error("User creation failed");
      const outboxPayload = {
        userId: newUserID,
        password,
        email: Email,
        status: "Created"
      };
      const sqlOutbox = "INSERT INTO Outbox (outboxType, AggregateId, Payload, CreatedAt, Processed) VALUES (?, ?, ?, ?, ?)";
      await this.runQuery(sqlOutbox, ["UserCreated", newUserID, JSON.stringify(outboxPayload), (/* @__PURE__ */ new Date()).toISOString(), 0]);
      await this.runQuery("COMMIT");
      return newUserID;
    } catch (err) {
      console.error("Transaction failed, rolling back", err);
      await this.runQuery("ROLLBACK");
      throw err;
    }
  }
  //creates an event with outbox pattern implemented
  async createEventWithOutbox(userId, groupId, eventTitle, description, dateTime, type) {
    const dateObj = new Date(dateTime);
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    const startTime = dateObj.toLocaleTimeString();
    const endDateObj = new Date(dateObj.getTime() + 60 * 60 * 1e3);
    const endTime = endDateObj.toLocaleTimeString();
    await this.runQuery("BEGIN TRANSACTION");
    try {
      const sqlECore = "INSERT INTO EventCore (Title, Description) VALUES (?, ?)";
      const coreResult = await this.runQuery(sqlECore, [eventTitle, description]);
      const newEventID = coreResult && coreResult.id || coreResult;
      const sqlETime = "INSERT INTO EventTime (EventID, StartTime, EndTime, Day, Month, EYear) VALUES (?, ?, ?, ?, ?, ?)";
      await this.runQuery(sqlETime, [newEventID, startTime, endTime, day, month, year]);
      const sqlEventType = "INSERT INTO EventType (TypeID, EventID) VALUES (?, ?)";
      await this.runQuery(sqlEventType, [Number(type), newEventID]);
      const calIds = await this.findCidsFromGCal(groupId);
      if (calIds.length === 0) {
        throw new Error(`No calendar found for Group ID: ${groupId}. Event creation aborted.`);
      }
      const sqlEventAdd = "INSERT INTO EventAdd (CalendarID, EventID) VALUES (?, ?)";
      await this.runQuery(sqlEventAdd, [calIds[0], newEventID]);
      const outboxPayload = {
        eventId: newEventID,
        userId,
        groupId,
        title: eventTitle,
        status: "Created"
      };
      const sqlOutbox = "INSERT INTO Outbox (outboxType, AggregateId, Payload, CreatedAt, Processed) VALUES (?, ?, ?, ?, ?)";
      await this.runQuery(sqlOutbox, ["EventCreated", newEventID, JSON.stringify(outboxPayload), (/* @__PURE__ */ new Date()).toISOString(), 0]);
      await this.runQuery("COMMIT");
      return newEventID;
    } catch (err) {
      console.error("Transaction failed, rolling back", err);
      await this.runQuery("ROLLBACK");
      throw err;
    }
  }
  //Adds a new user to the database
  async addUser(name, pass) {
    const sql = "INSERT INTO Users (username, pass) VALUES (?, ?)";
    try {
      const result = await this.runQuery(sql, [name, pass]);
      return result && result.id || void 0;
    } catch (err) {
      console.error("Error adding User:", err);
    }
  }
  //adds a new group with that user as a member - complete
  async addGroup(name, userID) {
    const sqlGroup = "INSERT INTO Groups (Gname) VALUES (?)";
    const sqlIncludes = "INSERT INTO Included (Userid, Groupid) VALUES (?, ?)";
    try {
      const result = await this.runQuery(sqlGroup, [name]);
      const GroupID = result.id;
      await this.runQuery(sqlIncludes, [userID, GroupID]);
    } catch (err) {
      console.error("Error adding group:", err);
    }
  }
  //Adds a user to an existing group - complete
  async addUserToGroup(UserID, GroupID) {
    const sqlIncludes = "INSERT INTO Included (Userid, Groupid) VALUES (?, ?)";
    try {
      await this.runQuery(sqlIncludes, [UserID, GroupID]);
    } catch (err) {
      console.error("Error adding group:", err);
    }
  }
  //Adds a new availability to the user - complete
  async addAvailability(userID, startTime, endTime, Day, Month, Year) {
    const sqlAvail = "INSERT INTO Availability (Day, Month, AYear, StartTime, EndTime) VALUES (?, ?, ?, ?, ?)";
    const sqlHas = "INSERT INTO Has (UserID, AvailID) VALUES (?, ?)";
    try {
      const result = await this.runQuery(sqlAvail, [Day, Month, Year, startTime, endTime]);
      await this.runQuery(sqlHas, [userID, result.id]);
    } catch (err) {
      console.error("Error Adding Availability:", err);
    }
  }
  //Adds a new event to a calendar - complete
  async addEvent(ETitle, Description, Type, StartTime, EndTime, Day, Month, Year, CalID) {
    const sqlECore = "INSERT INTO EventCore (Title, Description) VALUES (?, ?)";
    const sqlETime = "INSERT INTO EventTime (EventID, StartTime, EndTime, Day, Month, EYear) VALUES (?, ?, ?, ?, ?, ?)";
    const sqlEventAdd = "INSERT INTO EventAdd (CalendarID, EventID) VALUES (?, ?)";
    const sqlEType = "INSERT INTO Type (Tname) VALUES (?)";
    const sqlEventType = "INSERT INTO EventType (TypeID, EventID) VALUES (?, ?)";
    try {
      const result = await this.runQuery(sqlECore, [ETitle, Description]);
      await this.runQuery(sqlETime, [result.id, StartTime, EndTime, Day, Month, Year]);
      await this.runQuery(sqlEventAdd, [CalID, result.id]);
      const typeObject = await this.runQuery(sqlEType, [Type]);
      await this.runQuery(sqlEventType, [typeObject.id, result.id]);
    } catch (err) {
      console.error("Error adding Event:", err);
    }
  }
  //Adds a blank calendar to a group - complete
  async addBlankCalendar(Gid, calName) {
    const sql = "INSERT INTO Calendar (Cname) VALUES (?)";
    const sqlGCal = "INSERT INTO GCal (GroupID, CalendarID) VALUES (?, ?)";
    try {
      const result = await this.runQuery(sql, [calName]);
      await this.runQuery(sqlGCal, [Gid, result.id]);
    } catch (err) {
      console.error("Error adding Calendar:", err);
    }
  }
  //Adds a new type of Event to the database - complete
  async addEventType(typeName, Eid) {
    const sqlType = "INSERT INTO Type (Tname) VALUES (?)";
    const sqlEventType = "INSERT INTO EventType (TypeID, EventID) VALUES (?, ?)";
    try {
      const result = await this.runQuery(sqlType, [typeName]);
      await this.runQuery(sqlEventType, [result.id, Eid]);
    } catch (err) {
      console.error("Error adding Type:", err);
    }
  }
  //deletes an availability from the database - complete
  async deleteAvailability(Aid) {
    const sqlDeleteAvail = "DELETE FROM Availability WHERE Aid = ?";
    const sqlDeleteHas = "DELETE FROM Has WHERE AvailID = ?";
    await this.runQuery("BEGIN TRANSACTION");
    try {
      await this.runQuery(sqlDeleteHas, [Aid]);
      console.log(`Avail ${Aid} Deleted from Has.`);
      await this.runQuery(sqlDeleteAvail, [Aid]);
      console.log(`Avail ${Aid} Deleted from Avail.`);
      await this.runQuery("COMMIT");
    } catch (err) {
      await this.runQuery("ROLLBACK");
      console.error("Error deleting Type:", err);
    }
  }
  //deletes a Type from the database - complete
  async deleteType(Tid) {
    const sqlDeleteType = "DELETE FROM Type WHERE Tid = ?";
    const sqlDeleteEType = "DELETE FROM EventType WHERE TypeID = ?";
    await this.runQuery("BEGIN TRANSACTION");
    try {
      await this.runQuery(sqlDeleteEType, [Tid]);
      console.log(`Type ${Tid} Deleted from EventType.`);
      await this.runQuery(sqlDeleteType, [Tid]);
      console.log(`Type ${Tid} Deleted from Type.`);
      await this.runQuery("COMMIT");
    } catch (err) {
      await this.runQuery("ROLLBACK");
      console.error("Error deleting Type:", err);
    }
  }
  //Deletes a Group from the database - complete
  //Also needs to delete all child nodes including, Calandars, Events,
  //EventCore, EventTime, EventType and their mapping tables in buisiness logic
  async deleteGroup(GroupID) {
    const sqlDeleteGCal = "DELETE FROM GCal WHERE GroupID = ?";
    const sqlDeleteGroup = "DELETE FROM Groups WHERE Gid = ?";
    const sqlDeleteIncluded = "DELETE FROM Included WHERE GroupID = ?";
    await this.runQuery("BEGIN TRANSACTION");
    try {
      await this.runQuery(sqlDeleteGCal, [GroupID]);
      console.log(`Group ${GroupID} Deleted from GCal.`);
      await this.runQuery(sqlDeleteIncluded, [GroupID]);
      console.log(`Group ${GroupID} Deleted from Included.`);
      await this.runQuery(sqlDeleteGroup, [GroupID]);
      console.log(`Group ${GroupID} Deleted from Groups.`);
      await this.runQuery("COMMIT");
    } catch (err) {
      await this.runQuery("ROLLBACK");
      console.error("Error deleting User:", err);
    }
  }
  //Deletes a user from the database - complete
  //Also needs to delete all child nodes including Availability during its call stack, 
  //and possibly groups if they are the only one that is in that group
  async deleteUser(UserID) {
    const sqlDeleteIncluded = "DELETE FROM Included WHERE UserID = ?";
    const sqlDeleteUser = "DELETE FROM Users WHERE Uid = ?";
    const sqlDeleteUHas = "DELETE FROM Has WHERE UserID = ?";
    await this.runQuery("BEGIN TRANSACTION");
    try {
      await this.runQuery(sqlDeleteIncluded, [UserID]);
      console.log(`User ${UserID} Deleted from Included.`);
      await this.runQuery(sqlDeleteUser, [UserID]);
      console.log(`User ${UserID} Deleted from Users.`);
      await this.runQuery(sqlDeleteUHas, [UserID]);
      console.log(`User ${UserID} Deleted from Has.`);
      await this.runQuery("COMMIT");
    } catch (err) {
      await this.runQuery("ROLLBACK");
      console.error("Error deleting User:", err);
    }
  }
  //removes a user's access to a group - Complete
  async removeUserFromGroup(UserID, GroupID) {
    const sqlDeleteIncluded = "DELETE FROM Included WHERE UserID = ? AND GroupID = ?";
    await this.runQuery("BEGIN TRANSACTION");
    try {
      await this.runQuery(sqlDeleteIncluded, [UserID, GroupID]);
      console.log(`User ${UserID} Deleted from Included.`);
      await this.runQuery("COMMIT");
    } catch (err) {
      await this.runQuery("ROLLBACK");
      console.error("Error deleting include:", err);
    }
  }
  //Deletes a calendar from a group - complete
  async deleteCalendar(groupID, calID) {
    const sqlDeleteGCal = "DELETE FROM GCal WHERE (GroupID, CalendarID) = (?, ?)";
    const sqlDeleteCal = "DELETE FROM Calendar WHERE Cid = ?";
    const sqlDeleteEventAdded = "DELETE FROM EventAdd WHERE CalendarID = ?";
    await this.runQuery("BEGIN TRANSACTION");
    try {
      await this.runQuery(sqlDeleteGCal, [groupID, calID]);
      console.log(`Calendar mapping ${calID} Deleted from GCal.`);
      await this.runQuery(sqlDeleteCal, [calID]);
      console.log(`Calendar ${calID} Deleted from Calendar.`);
      await this.runQuery(sqlDeleteEventAdded, [calID]);
      console.log(`Calendar mapping ${calID} Deleted from EventAdded.`);
      await this.runQuery("COMMIT");
    } catch (err) {
      await this.runQuery("ROLLBACK");
      console.error("Error deleting Calendar:", err);
    }
  }
  //Deletes an event from a calendar - Complete
  async deleteEvent(EventID) {
    const sqlDeleteEventAdded = "DELETE FROM EventAdd WHERE EventID = ?";
    const sqlDeleteECore = "DELETE FROM EventCore WHERE Eid = ?";
    const sqlDeleteEType = "DELETE FROM EventType WHERE EventID = ?";
    const sqlDeleteETime = "DELETE FROM EventTime WHERE EventID = ?";
    await this.runQuery("BEGIN TRANSACTION");
    try {
      await this.runQuery(sqlDeleteEType, [EventID]);
      console.log(`Type mapping ${EventID} Deleted from Type.`);
      await this.runQuery(sqlDeleteECore, [EventID]);
      console.log(`Event ${EventID} Deleted from EventCore.`);
      await this.runQuery(sqlDeleteEventAdded, [EventID]);
      console.log(`Event mapping ${EventID} Deleted from EventAdd.`);
      await this.runQuery(sqlDeleteETime, [EventID]);
      console.log(`Event mapping ${EventID} Deleted from EventTime.`);
      await this.runQuery("COMMIT");
    } catch (err) {
      await this.runQuery("ROLLBACK");
      console.error("Error deleting Event:", err);
    }
  }
  //Finds all Calendar IDs from a group - complete
  async findCidsFromGCal(Gid) {
    const sqlFindCIDs = `SELECT CalendarID FROM GCal WHERE GroupID = ?`;
    const rows = await new Promise((resolve, reject) => {
      this.db.all(sqlFindCIDs, [Gid], (err, rows2) => {
        if (err) {
          return reject(err);
        }
        const ids = rows2.map((row) => row.CalendarID);
        console.log(`Calendar Ids of Group ${ids}`);
        resolve(ids);
      });
    });
    return rows;
  }
  //Finds all Event IDs from a calendar - complete
  async findEidsFromCalendar(calID) {
    const sqlFindEIDs = `SELECT EventID FROM EventAdd WHERE CalendarID = ?`;
    const ids = await new Promise((resolve, reject) => {
      this.db.all(sqlFindEIDs, [calID], (err, rows) => {
        if (err) {
          return reject(err);
        }
        const r = rows.map((row) => row.EventID);
        console.log(`Event Ids of calendar ${r}`);
        resolve(r);
      });
    });
    return ids;
  }
  //Finds Group ID from a User - complete
  async findGroupFromUser(UID) {
    const sqlFindGIDs = `SELECT GroupID FROM Included WHERE UserID = ?`;
    const row = await new Promise((resolve, reject) => {
      this.db.get(sqlFindGIDs, [UID], (err, row2) => {
        if (err) return reject(err);
        resolve(row2);
      });
    });
    if (!row) {
      console.log(`No group found for user ${UID}`);
      return null;
    }
    return row.GroupID;
  }
}
function createDatabase(name) {
  return new DatabaseAggregateFunctions(name);
}
const dbName = process.env.DB_NAME || "./src/database/calendar.db";
const db = createDatabase(dbName);

export { db as d };
