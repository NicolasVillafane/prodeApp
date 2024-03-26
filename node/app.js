import express from 'express';
import Keycloak from 'keycloak-connect';
import cors from 'cors';
import bodyParser from 'body-parser';
import FootballDataApi from './FootballDataApi.cjs';
import nodemailer from 'nodemailer';
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
} from './database.js';
import { uuid } from 'uuidv4';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3001;
const footballDataApiKey = process.env.APIKEY;

// Middleware configuration loaded from keycloak.json file.
const keycloak = new Keycloak({});

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

app.get('/home', (req, res) => {
  getProdes()
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.get('/p/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId;
    let prodeData = await getProde(id);
    const isAuthor = prodeData[0].author_id === userId;
    console.log('params: ', req.query);

    let footballData = {};

    const fd = new FootballDataApi(footballDataApiKey);

    const competitionInfo = await fd.getCompetition(
      parseInt(prodeData[0].tournamentid)
    );
    let currentMatchday = competitionInfo.currentSeason.currentMatchday;

    footballData = await fd.getCompetitionMatchesMatchday(
      parseInt(prodeData[0].tournamentid),
      currentMatchday
    );

    let allMatchesFinished = footballData.matches.every(
      (match) => match.status === 'FINISHED'
    );

    if (allMatchesFinished) {
      currentMatchday++;
      footballData = await fd.getCompetitionMatchesMatchday(
        parseInt(prodeData[0].tournamentid),
        currentMatchday
      );
    }

    const responseData = {
      prode: prodeData,
      football: footballData.matches,
      currentMatchday: currentMatchday,
      isAuthor: isAuthor, // Adding isAuthor to the response data
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

    const users = await getUsers(); // Implement this function to fetch users
    const prode = { id }; // Construct the prode object with the provided id

    const responseData = { users, prode }; // Combine users and prode into responseData

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
      console.log('Tournaments:', response); // Log the response object
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

app.post('/keycloak-events', (req, res) => {
  const eventType = req.body['type']; // Type of event
  const eventData = req.body['data']; // Event data, including user information

  // Check if the event is a user creation event
  if (eventType === 'CREATE' && eventData['type'] === 'USER') {
    // Extract user information from eventData
    const { userId, username, email } = eventData['details'];

    // Check if the user already exists in the database
    // Assuming you have a function `getUserById` to check if the user exists
    getUserById(userId)
      .then((existingUser) => {
        if (existingUser) {
          console.log('User already exists in the database:', existingUser);
          // You can choose to ignore the event or update existing user information here
          res.status(200).send('User already exists in the database.');
        } else {
          // Save user information to PostgreSQL database
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

app.post('/create-prode', (req, res) => {
  createProde(req.body)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// Endpoint for sending invitations via email
app.post('/send-invitation', async (req, res) => {
  try {
    const { prodeId, receiverEmail, selectedUser, selectedUserId } = req.body;

    // Generate a unique invitation token
    const invitationToken = uuid();

    // Save the invitation token in the database
    await saveInvitationToken(
      prodeId,
      invitationToken,
      receiverEmail,
      selectedUser,
      selectedUserId
    );

    // Construct the invitation link with the token and selectedUser information
    const invitationLink = `http://localhost:3000/confirm-invitation?prodeId=${prodeId}&token=${invitationToken}&selectedUser=${selectedUser}&selectedUserId=${selectedUserId}`;

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
    const { prodeId, token, selectedUser, selectedUserId } = req.body;

    console.log(req.body);

    // Verify the invitation token against the database
    const isValidToken = await verifyInvitationToken(
      prodeId,
      token,
      selectedUser,
      selectedUserId
    );

    if (!isValidToken) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Join the user to the prode
    await joinProde(prodeId, selectedUserId, selectedUser);

    res.status(200).json({ message: 'User joined the prode successfully' });
  } catch (error) {
    console.error('Error confirming invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/p/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username } = req.body;

    // Check if the prode exists
    const prodeData = await getProde(id);
    if (!prodeData || prodeData.length === 0) {
      return res.status(404).json({ error: 'Prode not found' });
    }

    const prode = prodeData[0];

    // Check if the prode is public
    if (!prode.ispublic) {
      return res.status(403).json({ error: 'Prode is not public' });
    }

    // Join the prode using database function
    await joinProde(id, userId, username);

    res.status(200).json({ message: 'User joined the prode successfully' });
  } catch (error) {
    console.error('Error joining prode:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/p/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Call the function to delete the prode from the database
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
