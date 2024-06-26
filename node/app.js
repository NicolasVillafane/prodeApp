import express from 'express';
import Keycloak from 'keycloak-connect';
import cors from 'cors';
import bodyParser from 'body-parser';
import FootballDataApi from './FootballDataApi.cjs';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import redis from 'redis';
import {
  getTournaments,
  createTournament,
  getProdes,
  createProde,
  getProde,
  saveUserToDatabase,
  getUserById,
  getUsers,
  deleteProde,
  joinProde,
  checkIfUserWithEmailExists,
  saveInvitationToken,
  verifyInvitationToken,
  getPublicProdes,
  getPrivateProdesForUser,
  getInvitationInfoByToken,
  checkIfUserAlreadyJoinedProde,
  savePredictionToDatabase,
  getPredictionForMatch,
  updateUserPointsForProde,
  markPointsAsAwarded,
  getPointsForProde,
} from './database.js';
import { uuid } from 'uuidv4';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = redis.createClient({
  legacyMode: true,

  host: 'localhost',
  port: 6379,
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.connect();

const app = express();
const port = 3001;
const footballDataApiKey = process.env.APIKEY;

const keycloak = new Keycloak({ configFile: 'keycloak.json' });

app.use(keycloak.middleware());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const checkCache = (req, res, next) => {
  const { id } = req.params;
  redisClient.get(id, (err, data) => {
    if (err) {
      console.error('Redis Error:', err);
      res.status(500).send('Internal Server Error');
    }
    if (data !== null) {
      res.send(JSON.parse(data));
    } else {
      next();
    }
  });
};

const transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: 'teyema1630@hotmail.com',
    pass: process.env.MAILPASS,
  },
});

app.get('/home', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let allProdes = [];

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const decodedToken = jwt.decode(token);
      const userId = decodedToken?.sub;

      const privateProdes = await getPrivateProdesForUser(userId);
      allProdes.push(...privateProdes);
    }

    const publicProdes = await getPublicProdes();

    allProdes.push(...publicProdes);

    const uniqueProdes = Array.from(
      new Set(allProdes.map((prode) => prode.id))
    ).map((id) => allProdes.find((prode) => prode.id === id));

    res.status(200).json(uniqueProdes);
  } catch (error) {
    console.error('Error fetching prodes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/p/:id', checkCache, async (req, res) => {
  try {
    console.log('hi');
    const { id } = req.params;
    const userId = req.query.userId;
    let prodeData = await getProde(id);
    const isAuthor = prodeData[0].author_id === userId;

    const fd = new FootballDataApi(footballDataApiKey);
    const competitionInfo = await fd.getCompetition(
      parseInt(prodeData[0].tournamentid)
    );

    const endDate = new Date(competitionInfo.currentSeason.endDate);
    const today = new Date();

    let currentMatchday = competitionInfo.currentSeason.currentMatchday;

    let footballData =
      await fd.getCompetitionMatchesMatchdayWithCrestsAndShortNames(
        parseInt(prodeData[0].tournamentid),
        currentMatchday
      );

    let allMatchesFinished = footballData.matches.every(
      (match) => match.status === 'FINISHED'
    );
    console.log('are matches finished: ' + allMatchesFinished);
    if (allMatchesFinished) {
      currentMatchday++;
      footballData =
        await fd.getCompetitionMatchesMatchdayWithCrestsAndShortNames(
          parseInt(prodeData[0].tournamentid),
          currentMatchday
        );
    }

    const matchesWithPredictions = [];
    for (const match of footballData.matches) {
      const matchWinner = match.score.winner;
      let isPredictionCorrect = null;

      const prediction = await getPredictionForMatch(userId, match.id, id);
      const predictionResult = prediction ? prediction.predicted_result : null;

      if (match.status === 'FINISHED') {
        if (prediction && !prediction.points_awarded) {
          matchesWithPredictions.push({
            match,
            prediction: predictionResult,
            isPredictionCorrect: predictionResult === matchWinner,
          });

          if (predictionResult === matchWinner) {
            await updateUserPointsForProde(userId, id, 3);

            await markPointsAsAwarded(prediction.id);
          }
        } else {
          matchesWithPredictions.push({
            match,
            prediction: predictionResult,
            isPredictionCorrect: null,
          });
        }
      } else {
        matchesWithPredictions.push({
          match,
          prediction: predictionResult,
          isPredictionCorrect: null,
        });
      }
    }

    const prodePoints = await getPointsForProde(id);

    let seasonEnded = false;

    if (allMatchesFinished || today > endDate) {
      // Season has ended
      seasonEnded = true;
    }

    const responseData = {
      prode: prodeData,
      football: matchesWithPredictions,
      currentMatchday,
      isAuthor,
      prodePoints: prodePoints,
      seasonEnded: seasonEnded,
    };

    redisClient.setex(id, 600, JSON.stringify(responseData));

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(error);
  }
});

app.get('/p/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;

    const users = await getUsers();
    const prode = { id };

    const responseData = { users, prode };

    console.log(responseData.users);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching users for invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/tournaments', (req, res) => {
  getTournaments()
    .then((response) => {
      console.log('Tournaments:', response);
      res.status(200).json(response);
    })
    .catch((error) => {
      console.error('Error fetching tournaments:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
});

app.get('/tournaments/:id', async (req, res) => {
  const { id } = req.params;
  const fd = new FootballDataApi(footballDataApiKey);
  let data = {};
  await fd
    .getCompetitionTeams(id)
    .then((res) => {
      console.info(JSON.stringify(res.teams, null, 4));

      data = res.teams;
    })
    .catch((err) => {
      console.error(JSON.stringify(err, null, 4));
    });
  res.json(data);
});

app.get('/tournaments/:id/matches', async (req, res) => {
  const { id } = req.params;
  const fd = new FootballDataApi(footballDataApiKey);
  let data = {};
  await fd
    .getCompetitionMatches(id)
    .then((res) => {
      console.info(JSON.stringify(res.matches, null, 4));

      data = res.matches;
    })
    .catch((err) => {
      console.error(JSON.stringify(err, null, 4));
    });
  res.json(data);
});

app.get('/create-prode', (req, res) => {
  getTournaments()
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.post('/p/:id', async (req, res) => {
  try {
    const { match_id, predicted_result, user_id, prode_id } = req.body;

    if (!match_id || !predicted_result || !user_id || !prode_id) {
      return res.status(400).json({
        error: 'Match ID, predicted result, user ID, and prode ID are required',
      });
    }

    const id = uuid();

    await savePredictionToDatabase(
      id,
      user_id,
      prode_id,
      match_id,
      predicted_result
    );

    res.status(200).json({ message: 'Prediction submitted successfully' });
  } catch (error) {
    console.error('Error submitting prediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/keycloak-events', (req, res) => {
  const eventType = req.body['type'];
  const eventData = req.body['data'];

  if (eventType === 'REGISTER' && eventData['type'] === 'USER') {
    const { userId, username, email } = eventData['details'];

    getUserById(userId)
      .then((existingUser) => {
        if (existingUser) {
          console.log('User already exists in the database:', existingUser);
          res.status(200).send('User already exists in the database.');
        } else {
          saveUserToDatabase(userId, username, email);
          res.status(200).send('User created event received and processed.');
        }
      })
      .catch((error) => {
        console.error('Error checking user existence:', error);
        res.status(500).send('Internal server error.');
      });
  } else {
    res.status(400).send('Unsupported event type or data.');
  }
});

app.post('/admin', (req, res) => {
  createTournament(req.body)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.post('/create-prode', async (req, res) => {
  try {
    const {
      name,
      tournamentId,
      tournamentName,
      isPublic,
      authorId,
      authorName,
      authorEmail,
    } = req.body;

    const id = uuid();

    // Create Prode
    const prode = await createProde({
      id,
      name,
      tournamentId,
      tournamentName,
      isPublic,
      authorId,
      authorName,
      authorEmail,
    });

    console.log('Joining author to Prode with ID:', id);
    console.log('Author ID:', authorId);
    console.log('Author Name:', authorName);

    await joinProde(id, authorId, authorName, authorEmail);

    res.status(200).json(prode);
  } catch (error) {
    console.error('Error creating Prode:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/send-invitation', async (req, res) => {
  try {
    const { prodeId, receiverEmail } = req.body;

    const userExists = await checkIfUserWithEmailExists(receiverEmail);
    if (!userExists) {
      return res
        .status(400)
        .json({ error: 'User with this email does not exist' });
    }

    const userAlreadyJoined = await checkIfUserAlreadyJoinedProde(
      prodeId,
      receiverEmail
    );
    if (userAlreadyJoined) {
      return res
        .status(400)
        .json({ error: 'User with this email has already joined the prode' });
    }

    const invitationToken = uuid();

    await saveInvitationToken(prodeId, invitationToken, receiverEmail);

    const invitationLink = `http://localhost:3000/confirm-invitation?token=${invitationToken}`;

    const mailOptions = {
      from: 'teyema1630@hotmail.com',
      to: receiverEmail,
      subject: 'Invitation to join private prode',
      text: `You have been invited to join a private prode. Click the following link to join: ${invitationLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/confirm-invitation', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization token missing' });
    }

    const authToken = authHeader.split(' ')[1];
    const decodedToken = jwt.decode(authToken);
    const userId = decodedToken?.sub;

    const currentUser = await getUserById(userId);

    const { token: invitationToken } = req.body;

    console.log('Received token:', invitationToken);

    const { prodeId, receiver_email } = await getInvitationInfoByToken(
      invitationToken
    );
    console.log('Prode id:', prodeId);
    const isValidToken = await verifyInvitationToken(prodeId, invitationToken);

    if (!isValidToken) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    console.log(
      prodeId,
      currentUser.id,
      currentUser.username,
      currentUser.email
    );
    await joinProde(
      prodeId,
      currentUser.id,
      currentUser.username,
      currentUser.email
    );

    res.status(200).json({ message: 'User joined the prode successfully' });
  } catch (error) {
    console.error('Error confirming invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/p/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username, email } = req.body;

    const prodeData = await getProde(id);
    if (!prodeData || prodeData.length === 0) {
      return res.status(404).json({ error: 'Prode not found' });
    }

    const prode = prodeData[0];

    if (!prode.ispublic) {
      return res.status(403).json({ error: 'Prode is not public' });
    }

    await joinProde(id, userId, username, email);

    res.status(200).json({ message: 'User joined the prode successfully' });
  } catch (error) {
    console.error('Error joining prode:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/p/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteProde(id);
    res.status(200).json({ message: 'Prode deleted successfully' });
  } catch (error) {
    console.error('Error deleting prode:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('*', (req, res) => {
  res.send('Not found!');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}.`);
});
