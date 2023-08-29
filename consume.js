const { Kafka } = require("kafkajs");
const { SchemaRegistry } = require("@kafkajs/confluent-schema-registry");

const crypto = require("crypto");

const registry = new SchemaRegistry({ host: "http://localhost:8081" });

async function run() {
  const kafka = new Kafka({
    clientId: "my-consumer",
    brokers: ["localhost:19092"],
  });

  const consumer = kafka.consumer({ groupId: "my-group" });
  await consumer.connect();
  await consumer.subscribe({ topic: "users", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { sk, data } = JSON.parse(message.value.toString());
      console.log(`encrypted data: ${data}`);
      const decryptedData = decrypt(
        Buffer.from(sk, "base64"),
        Buffer.from(data, "base64")
      );
      console.log(`decryptedData: ${decryptedData}`);
      const userJson = await registry.decode(decryptedData);
      console.log(`decoded data: ${userJson}`);
    },
  });
}

function decrypt(secretKey, data) {
  const algorithm = "aes-256-cbc";
  const iv = data.slice(0, 16);
  const encryptedData = data.slice(16);
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);
  return decrypted;
}

run().catch(console.error);
