const { Kafka } = require("kafkajs");
const {
  SchemaRegistry,
  SchemaType,
} = require("@kafkajs/confluent-schema-registry");
const fs = require("fs");
const crypto = require("crypto");

const userJsons = require("./users.json");

const registry = new SchemaRegistry({ host: "http://localhost:8081" });

async function run() {
  const kafka = new Kafka({
    clientId: "transactional-client",
    brokers: ["localhost:19092"],
  });

  const producer = kafka.producer({
    transactionalId: "my-transactional-producer",
    maxInFlightRequests: 1,
    idempotent: true,
  });
  await producer.connect();

  // Register your schema and get the id, this usually happens in another codebase
  const schema = fs.readFileSync("./schema.avsc", "utf-8");
  const { id } = await registry.register({ type: SchemaType.AVRO, schema });

  const transaction = await producer.transaction();
  try {
    for (const userJson of userJsons) {
      // Encode the JSON payload to Avro using the schema id
      const avroBuffer = await registry.encode(id, userJson);
      // Encrypt the Avro data
      const sk = generateSecretKey();
      const encryptedData = encrypt(sk, avroBuffer);

      // Send the encrypted data and the secret key to Kafka
      await transaction.send({
        topic: "users",
        messages: [
          {
            value: JSON.stringify({
              sk: sk.toString("base64"),
              data: encryptedData.toString("base64"),
            }),
          },
        ],
      });
    }
    await transaction.commit();
    console.log("message sent");
  } catch (error) {
    console.log(error);
    await transaction.abort();
    throw error;
  } finally {
    await producer.disconnect();
  }
}

function generateSecretKey() {
  return crypto.randomBytes(32);
}

function encrypt(secretKey, data) {
  const algorithm = "aes-256-cbc";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

run().catch(console.error);
