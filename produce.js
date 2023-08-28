const { Kafka, Partitioners } = require("kafkajs");

const crypto = require("crypto");
const avro = require("avro-js");

const userJson = require("./user.json");

async function run() {
  const kafka = new Kafka({
    clientId: "my-client",
    brokers: ["localhost:9092"],
    producer: {
      createPartitioner: Partitioners.LegacyPartitioner,
    },
  });
  const producer = kafka.producer();
  await producer.connect();

  // json to avro convert, output is binary
  const avroBuffer = jsonToAvro(avro.parse("./schema.avsc"), userJson); // <Buffer f6 01 12 45 72 69 63 20 51 75 61 6e 2a 65 72 69 63 2e 71 75 61 6e 40 65 78 61 6d 70 6c 65 2e 63 6f 6d 01>
  // encrypt the avro, output is binary
  const encryptedData = encrypt(avroBuffer); //<Buffer f6 01 12 45 72 69 63 20 51 75 61 6e 2a 65 72 69 63 2e 71 75 61 6e 40 65 78 61 6d 70 6c 65 2e 63 6f 6d 01>

  // send message to kafka
  await producer.send({
    topic: "users",
    messages: [{ value: encryptedData }],
  });

  await producer.disconnect;
}

function generateSecretKey() {
  return crypto.randomBytes(32);
}

function encrypt(data) {
  const algorithm = "aes-256-cbc";
  const iv = crypto.randomBytes(16);

  const secretKey = generateSecretKey();
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

  return Buffer.concat([iv, encrypted]);
}

// Serialize to Avro
function jsonToAvro(schema, jsonData) {
  return schema.toBuffer(jsonData);
}

run().catch(console.error);
