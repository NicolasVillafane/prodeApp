import express from 'express';
import Keycloak from 'keycloak-connect';
import cors from 'cors';
import bodyParser from 'body-parser';
import FootballDataApi from './FootballDataApi.cjs';
import {
  getTournaments,
  createTournament,
  getProdes,
  createProde,
  getProde,
  saveUserToDatabase,
  getUserById,
} from './database.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3001;
const footballDataApiKey = process.env.APIKEY;

// Middleware configuration loaded from keycloak.json file.
const keycloak = new Keycloak({});

app.use(keycloak.middleware());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
    let prodeData = {};
    let footballData = {};

    // Get Prode data
    await getProde(id)
      .then((response) => {
        prodeData = response;
      })
      .catch((error) => {
        console.error('Prode Error:', JSON.stringify(error, null, 4));
      });

    // Get Football Data API
    const fd = new FootballDataApi(footballDataApiKey);

    // Get the competition information to retrieve the current matchday
    const competitionInfo = await fd.getCompetition(
      parseInt(prodeData[0].tournamentid)
    );
    let currentMatchday = competitionInfo.currentSeason.currentMatchday;

    // Retrieve matches for the current matchday
    await fd
      .getCompetitionMatchesMatchday(
        parseInt(prodeData[0].tournamentid),
        currentMatchday
      )
      .then((response) => {
        footballData = response.matches;
      })
      .catch((error) => {
        console.error('Football Data Error:', JSON.stringify(error, null, 4));
      });

    // Check if all matches are finished
    let allMatchesFinished = true;
    for (const match of footballData) {
      if (match.status !== 'FINISHED') {
        allMatchesFinished = false;
        break;
      }
    }

    // If all matches are finished, increment currentMatchday and fetch matches for the next matchday
    if (allMatchesFinished) {
      currentMatchday++;

      await fd
        .getCompetitionMatchesMatchday(
          parseInt(prodeData[0].tournamentid),
          currentMatchday
        )
        .then((response) => {
          footballData = response.matches;
        })
        .catch((error) => {
          console.error('Football Data Error:', JSON.stringify(error, null, 4));
        });
    }

    // Combine data and send response
    const responseData = {
      prode: prodeData,
      football: footballData,
      currentMatchday: currentMatchday,
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).send(error);
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

app.use('*', (req, res) => {
  res.send('Not found!');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}.`);
});
