import { d as db } from '../../chunks/databaseAggregateFunctions_CoeIMPoz.mjs';
import Kafka from 'kafkajs';
export { renderers } from '../../renderers.mjs';

const kafka = new Kafka.Kafka({
  clientId: "calendar-service",
  brokers: ["localhost:9092"]
});
const producer = kafka.producer();
async function publishOutbox() {
  const sqlCommand = "SELECT * FROM Outbox WHERE Processed = 0 ORDER BY CreatedAt ASC";
  let outboxEntries = [];
  try {
    outboxEntries = await db.getAllQuery(sqlCommand);
  } catch (err) {
    console.error("Failed to read outbox table: ", err);
    return;
  }
  if (!outboxEntries || outboxEntries.length === 0) return;
  for (const ob of outboxEntries) {
    try {
      const payloadString = typeof ob.Payload === "string" ? ob.Payload : JSON.stringify(ob.Payload);
      await producer.send({
        topic: ob.outboxType,
        messages: [
          { key: ob.OutboxId.toString(), value: payloadString }
        ]
      });
      const sqlUpdate = "UPDATE Outbox set Processed = 1 WHERE outboxId = ?";
      await db.runQuery(sqlUpdate, [ob.OutboxId]);
      console.log(`Published and processed outbox entry ${ob.OutboxId}`);
    } catch (err) {
      console.error(`Error handling outbox entry ${ob.OutboxId}: `, err);
    }
  }
}
(async () => {
  try {
    await producer.connect();
    console.log("Outbox processor started...");
    setInterval(publishOutbox, 5e3);
  } catch (error) {
    console.error("Failed to start Outbox processor:", error);
  }
})();

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  publishOutbox
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
