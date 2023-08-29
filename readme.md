## Prerequisites
- Docker installed.
- Node.js and npm installed.

## Get Started

### 1. Run Kafka with Docker:

Start a Kafka cluster locally using Docker Compose:

```bash
docker-compose up -d
```

This will start up Kafka and ZooKeeper in the background.

### 2. Consume Messages:

Before producing messages, start the consumer so it's ready to process incoming messages.

Navigate to the directory containing your scripts and run:

```bash
node consume.js
```

This script will start a Kafka consumer that listens to the `user` topic and logs the messages it receives.

The output looks like below:
```
{"level":"INFO","timestamp":"2023-08-29T18:58:49.845Z","logger":"kafkajs","message":"[ConsumerGroup] Consumer has joined the group","groupId":"my-group","memberId":"my-consumer-86c63d68-863a-403e-a6dc-75f85c7cd79d","leaderId":"my-consumer-86c63d68-863a-403e-a6dc-75f85c7cd79d","isLeader":true,"memberAssignment":{"users":[0]},"groupProtocol":"RoundRobinAssigner","duration":3048}
encrypted data: tL72YqtpPAHb7Ccn5M2+/EVhVBs6fW4vgy/HwppsK0VLG3jh7gZCB6u27KDG9vaWHroDa1znk8HwRFo6TmpRYw==
decryptedData: �Eric Quan*eric.quan@example.com
decoded data: {"id":123,"name":"Eric Quan","email":"eric.quan@example.com","isActive":true}
encrypted data: W3BPP3cy97rqiQ7xWjFn2LFc8pGl9NcAousSsjt0zDtTCwIF2z+WvT2O+Y1YpKWKKXISChDeOZ4yRPk1dai/bA==
decryptedData: �Eric Quan*eric.quan@example.com
```

### 3. Produce Encrypted Avro Messages:

Once your consumer is running and listening, in another terminal window, navigate to the directory containing your scripts and run:

```bash
node produce.js
```

This script will serialize a JSON message to Avro, encrypt it, and then produce it to the `user` topic in Kafka.

You should see the encrypted messages being logged in the terminal where `consume.js` is running.

The output looks like the below:
```
{"level":"WARN","timestamp":"2023-08-28T19:54:23.402Z","logger":"kafkajs","message":"KafkaJS v2.0.0 switched default partitioner. To retain the same partitioning behavior as in previous versions, create the producer with the option \"createPartitioner: Partitioners.LegacyPartitioner\". See the migration guide at https://kafka.js.org/docs/migration-guide-v2.0.0#producer-new-default-partitioner for details. Silence this warning by setting the environment variable \"KAFKAJS_NO_PARTITIONER_WARNING=1\""}
```

## Wrapping up

You've now set up a local Kafka cluster, consumed messages from a topic, and produced encrypted Avro messages to that topic. Ensure to shut down the Docker containers when you're done:

```bash
docker-compose down
```

Remember, the encrypted messages will look like random bytes. In a real-world scenario, you will decrypt the messages upon consumption to get the original Avro data, and then deserialize it to get the original JSON message.