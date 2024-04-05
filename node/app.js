import express from 'express';
import Keycloak from 'keycloak-connect';
import cors from 'cors';
import bodyParser from 'body-parser';
import FootballDataApi from './FootballDataApi.cjs';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
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
} from './database.js';
import { uuid } from 'uuidv4';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3001;
const footballDataApiKey = process.env.APIKEY;

const keycloak = new Keycloak({ configFile: 'keycloak.json' });

app.use(keycloak.middleware());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
      const token = authHeader.split(' ')[1]; // Extracting the token from the header
      const decodedToken = jwt.decode(token);
      const userId = decodedToken?.sub;

      // Fetch private prodes for the user
      const privateProdes = await getPrivateProdesForUser(userId);
      allProdes.push(...privateProdes);
    }

    // Fetch public prodes
    const publicProdes = await getPublicProdes();

    // Combine public and private prodes
    allProdes.push(...publicProdes);

    // Remove duplicates
    const uniqueProdes = Array.from(
      new Set(allProdes.map((prode) => prode.id))
    ).map((id) => allProdes.find((prode) => prode.id === id));

    // Send the list of prodes as the response
    res.status(200).json(uniqueProdes);
  } catch (error) {
    console.error('Error fetching prodes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/p/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId;
    let prodeData = await getProde(id);
    const isAuthor = prodeData[0].author_id === userId;

    // Fetch football match data
    const fd = new FootballDataApi(footballDataApiKey);
    const competitionInfo = await fd.getCompetition(
      parseInt(prodeData[0].tournamentid)
    );
    let currentMatchday = competitionInfo.currentSeason.currentMatchday;

    let footballData = await fd.getCompetitionMatchesMatchday(
      parseInt(prodeData[0].tournamentid),
      currentMatchday
    );

    // Initialize flag to check prediction correctness only once per matchday
    let checkedPredictionCorrectness = false;

    let allMatchesFinished = footballData.matches.every(
      (match) => match.status === 'FINISHED'
    );

    // If all matches for the current matchday are finished, move to the next matchday
    if (allMatchesFinished) {
      currentMatchday++;
      footballData = await fd.getCompetitionMatchesMatchday(
        parseInt(prodeData[0].tournamentid),
        currentMatchday
      );

      // Reset the flag for the new matchday
      checkedPredictionCorrectness = false;
    }

    // Iterate through matches and compare predictions
    const matchesWithPredictions = [];
    for (const match of footballData.matches) {
      const matchWinner = match.score.winner;
      let isPredictionCorrect = null;

      // Only check prediction correctness if match status is "FINISHED" and not checked before for this matchday
      if (!checkedPredictionCorrectness && match.status === 'FINISHED') {
        const prediction = await getPredictionForMatch(userId, match.id, id);
        const predictionResult = prediction
          ? prediction.predicted_result
          : null;
        // Push the user's prediction directly
        matchesWithPredictions.push({
          match,
          prediction: predictionResult,
          isPredictionCorrect: predictionResult === matchWinner,
        });
        // Set the flag to true once prediction correctness is checked for this matchday
        checkedPredictionCorrectness = true;
      } else {
        // If prediction is not checked or match is not finished, push null
        matchesWithPredictions.push({
          match,
          prediction: null,
          isPredictionCorrect: null, // Since prediction is not checked, correctness is null
        });
      }
    }

    const responseData = {
      prode: prodeData,
      football: matchesWithPredictions,
      currentMatchday,
      isAuthor,
    };

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

    // Validate if the required fields are present
    if (!match_id || !predicted_result || !user_id || !prode_id) {
      return res.status(400).json({
        error: 'Match ID, predicted result, user ID, and prode ID are required',
      });
    }

    const id = uuid();

    // Save the prediction to the database
    await savePredictionToDatabase(
      id,
      user_id,
      prode_id,
      match_id,
      predicted_result
    );

    // Send a success response
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

    // Join the author to the Prode
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

    // Check if the email exists in the users table
    const userExists = await checkIfUserWithEmailExists(receiverEmail);
    if (!userExists) {
      return res
        .status(400)
        .json({ error: 'User with this email does not exist' });
    }

    // Check if the user has already joined the prode
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

    const authToken = authHeader.split(' ')[1]; // Extracting the token from the header
    const decodedToken = jwt.decode(authToken);
    const userId = decodedToken?.sub;

    // Fetch user data using the userId
    const currentUser = await getUserById(userId); // Implement this function

    const { token: invitationToken } = req.body; // Renamed token variable to invitationToken

    console.log('Received token:', invitationToken); // Log the token received from the client
    // Log the token received from the client

    // Get prode_id and receiver_email using the token from the database
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
    // Assuming you have a function to join the prode using prode_id and current user info
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
    const { userId, username, email } = req.body; // Add email to the request body

    const prodeData = await getProde(id);
    if (!prodeData || prodeData.length === 0) {
      return res.status(404).json({ error: 'Prode not found' });
    }

    const prode = prodeData[0];

    if (!prode.ispublic) {
      return res.status(403).json({ error: 'Prode is not public' });
    }

    await joinProde(id, userId, username, email); // Pass email to the joinProde function

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
