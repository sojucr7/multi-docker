const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// =====================
// Postgres Client Setup
// =====================
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
  ssl: {
    rejectUnauthorized: false,
  },
});

pgClient.on('connect', (client) => {
  client
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch((err) => console.error(err));
});

// =================
// Redis Client Setup (REDIS v4)
// =================
const { createClient } = require('redis');

const redisClient = createClient({
  url: `redis://${keys.redisHost}:${keys.redisPort}`,
});

const redisPublisher = redisClient.duplicate();

redisClient.on('error', (err) =>
  console.error('Redis Client Error', err)
);

// 🔥 REQUIRED for redis v4
(async () => {
  await redisClient.connect();
  await redisPublisher.connect();
})();

// =====================
// Express route handlers
// =====================

app.get('/', (req, res) => {
  res.send('Hi');
});

app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * FROM values');
  res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
  try {
    const values = await redisClient.hGetAll('values');
    res.send(values);
  } catch (err) {
    console.error('Redis error:', err);
    res.status(500).send('Redis error');
  }
});

app.post('/values', async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  await redisClient.hSet('values', index, 'Nothing yet!');
  await redisPublisher.publish('insert', index);

  await pgClient.query(
    'INSERT INTO values(number) VALUES($1)',
    [index]
  );

  res.send({ working: true });
});

// =====================
// IMPORTANT FOR ELASTIC BEANSTALK
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
