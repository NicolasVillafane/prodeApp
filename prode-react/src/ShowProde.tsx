import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Grid,
  Container,
  Checkbox,
  Button,
  List,
  ListItem,
  ListItemText,
  Alert,
  Snackbar,
} from '@mui/material';
import Appbar from './Appbar';
import keycloak from './Keycloak';

interface Match {
  match: {
    id: string;
    utcDate: string;
    status: string;
    homeTeam: {
      name: string;
    };
    homeTeamCrest: string;
    homeTeamShortName: string;
    awayTeam: {
      name: string;
    };
    awayTeamCrest: string;
    awayTeamShortName: string;
    score: {
      fullTime: {
        homeTeam: number;
        awayTeam: number;
      };
    };
  };
  prediction: string;
  isPredictionCorrect: boolean;
}

interface Prode {
  id: string;
  name: string;
  author_name: string;
  author_id: string;
  ispublic: boolean;
  joined_users_info: { id: string; username: string }[];
}

interface ProdePoints {
  id: number;
  user_id: string;
  prode_id: string;
  points: number;
}

interface Data {
  prode: Prode[];
  football?: Match[];
  currentMatchday?: number;
  prodePoints?: ProdePoints[];
}

const ShowProde = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Data>({ prode: [] });
  const [userId, setUserId] = useState<string | null>(null);
  const [joinedUsers, setJoinedUsers] = useState<JSX.Element[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<{
    [key: string]: string | null;
  }>({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>(
    'success'
  );

  useEffect(() => {
    const userId = keycloak.subject || null;
    setUserId(userId);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/p/${id}?userId=${userId}`);
        const result = await response.json();
        setData(result);
        if (result.prode.length > 0) {
          const users = result.prode[0].joined_users_info.map((user: any) => (
            <Typography key={user.id} variant="body1">
              {user.username}
            </Typography>
          ));
          setJoinedUsers(users);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [id, userId]);

  // Load selected predictions from local storage when component mounts
  useEffect(() => {
    const storedPredictions = JSON.parse(
      localStorage.getItem('predictions') || '{}'
    );
    setSelectedWinner(storedPredictions);
  }, []);

  // Save selected predictions to local storage whenever selectedWinner changes
  useEffect(() => {
    localStorage.setItem('predictions', JSON.stringify(selectedWinner));
  }, [selectedWinner]);

  console.log(data.football);
  const handleInvite = async () => {
    try {
      navigate(`/p/${id}/invite`);
    } catch (error) {
      console.error('Error navigating to invite route:', error);
    }
  };

  const handleCheckboxChange = (team: string, matchId: string) => {
    const predictionExists = data.football?.find(
      (match) => match.match.id === matchId && match.prediction !== null
    );

    if (!predictionExists) {
      setSelectedWinner((prevSelected) => ({
        ...prevSelected,
        [matchId]: team,
      }));
    }
  };

  const handleDeleteProde = async () => {
    try {
      await fetch(`/p/${id}`, {
        method: 'DELETE',
      });
      navigate('/');
    } catch (error) {
      console.error('Error deleting prode:', error);
    }
  };

  const handleJoinProde = async () => {
    try {
      const userId = keycloak.tokenParsed?.sub;
      const username = keycloak.tokenParsed?.preferred_username;
      const email = keycloak.tokenParsed?.email;

      if (!userId || !username || !email) {
        console.error('User ID, username, or email not available.');
        return;
      }

      if (data.prode[0]?.joined_users_info.find((user) => user.id === userId)) {
        console.log('User is already joined to this prode.');
        return;
      }

      await fetch(`/p/${id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, username, email }),
      });
    } catch (error) {
      console.error('Error joining prode:', error);
    }
  };

  const handleSubmitPrediction = async (
    matchId: string,
    predictedResult: string
  ) => {
    console.log('Submitting prediction...');
    console.log('User ID:', userId);
    console.log('Prode ID:', id);
    console.log('Match ID:', matchId);
    console.log('Predicted Result:', predictedResult);

    try {
      const response = await fetch(`/p/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          prode_id: id,
          match_id: matchId,
          predicted_result: predictedResult,
        }),
      });
      if (response.ok) {
        setAlertSeverity('success');
        setAlertMessage('Prediction submitted successfully');
        setAlertOpen(true);
      } else {
        const errorData = await response.json();
        setAlertSeverity('error');
        setAlertMessage('User has already made a prediction for this match');
        setAlertOpen(true);
      }
    } catch (error) {
      console.error('Error submitting prediction:', error);
      setAlertSeverity('error');
      setAlertMessage('Error submitting prediction');
      setAlertOpen(true);
    }
  };

  const handleAlertClose = (event: any, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setAlertOpen(false);
    if (reason !== 'clickaway') {
      navigate(`/p/${id}`);
    }
  };

  const userPoints: { [key: string]: number } = {};

  data.prodePoints?.forEach((point) => {
    userPoints[point.user_id] = point.points;
  });

  const joinedUsersWithPoints = data.prode[0]?.joined_users_info.map(
    (user, index) => (
      <ListItem key={index}>
        <ListItemText>
          <Typography variant="h6">
            {`${index + 1}. ${user.username} -`}
            {userPoints[user.id] !== undefined && (
              <span style={{ marginLeft: '8px' }}>{userPoints[user.id]}</span>
            )}
          </Typography>
        </ListItemText>
      </ListItem>
    )
  );

  const matchesByDate: { [date: string]: JSX.Element[] } = {};

  if (data.football) {
    data.football.forEach((match) => {
      const dateObject = new Date(match.match.utcDate);
      const formattedDate = dateObject.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
      });
      const formattedHour = dateObject.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const matchDetails = (
        <div key={match.match.id}>
          <Typography variant="h6" style={{ borderBottom: '1px solid #000' }}>
            {formattedHour} |{' '}
            <img
              src={match.match.homeTeamCrest}
              alt="Home Team Crest"
              style={{ width: '20px', marginRight: '5px' }}
            />{' '}
            {match.match.homeTeamShortName}{' '}
            {match.match.score?.fullTime.homeTeam} -{' '}
            {match.match.score?.fullTime.awayTeam}{' '}
            {match.match.awayTeamShortName}{' '}
            <img
              src={match.match.awayTeamCrest}
              alt="Away Team Crest"
              style={{ width: '20px', marginLeft: '5px' }}
            />{' '}
            | {match.match.status !== 'SCHEDULED' ? match.match.status : ''}
          </Typography>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox
              disabled={
                match.match.status !== 'SCHEDULED' || match.prediction !== null
              }
              checked={
                selectedWinner[match.match.id] === match.match.homeTeam?.name
              }
              onChange={() =>
                handleCheckboxChange(match.match.homeTeam?.name, match.match.id)
              }
              style={{
                filter:
                  match.match.status !== 'SCHEDULED' ||
                  match.prediction !== null
                    ? 'grayscale(100%)'
                    : 'none',
              }}
            />
            <label>{match.match.homeTeam?.name}</label>
            <Checkbox
              disabled={
                match.match.status !== 'SCHEDULED' || match.prediction !== null
              }
              checked={selectedWinner[match.match.id] === 'DRAW'}
              onChange={() => handleCheckboxChange('DRAW', match.match.id)}
              style={{
                filter:
                  match.match.status !== 'SCHEDULED' ||
                  match.prediction !== null
                    ? 'grayscale(100%)'
                    : 'none',
              }}
            />
            <label>Draw</label>
            <Checkbox
              disabled={
                match.match.status !== 'SCHEDULED' || match.prediction !== null
              }
              checked={
                selectedWinner[match.match.id] === match.match.awayTeam?.name
              }
              onChange={() =>
                handleCheckboxChange(match.match.awayTeam?.name, match.match.id)
              }
              style={{
                filter:
                  match.match.status !== 'SCHEDULED' ||
                  match.prediction !== null
                    ? 'grayscale(100%)'
                    : 'none',
              }}
            />
            <label>{match.match.awayTeam?.name}</label>
            <Button
              key={match.match.id}
              disabled={
                !selectedWinner[match.match.id] ||
                match.match.status !== 'SCHEDULED'
              }
              onClick={() => {
                const predictedResult =
                  selectedWinner[match.match.id] === 'DRAW'
                    ? 'DRAW'
                    : selectedWinner[match.match.id] ===
                      match.match.homeTeam?.name
                    ? 'HOME_TEAM'
                    : 'AWAY_TEAM';
                handleSubmitPrediction(match.match.id, predictedResult);
              }}
            >
              Submit Prediction
            </Button>
          </div>
        </div>
      );

      if (matchesByDate[formattedDate]) {
        matchesByDate[formattedDate].push(matchDetails);
      } else {
        matchesByDate[formattedDate] = [matchDetails];
      }
    });
  }

  const matches = Object.entries(matchesByDate).map(([date, matches]) => (
    <div key={date}>
      <Typography variant="h4" style={{ marginTop: '16px' }}>
        {date}
      </Typography>
      {matches}
    </div>
  ));

  return (
    <div>
      <Appbar />
      <Container>
        <Grid
          container
          spacing={0}
          direction="column"
          alignItems="center"
          justifyContent="center"
        >
          <Grid item xs={3}>
            <Grid item xs={3}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h2" color="#9A2A2A">
                  {data.prode[0]?.name}
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="#9A2A2A"
                  style={{ marginLeft: '8px' }}
                >
                  by {data.prode[0]?.author_name}
                </Typography>
              </div>
            </Grid>
          </Grid>
          {data.prode.length > 0 && userId && (
            <Grid
              container
              spacing={2}
              justifyContent="flex-start"
              alignItems="center"
            >
              <Grid item>
                {!data.prode[0]?.joined_users_info.find(
                  (user) => user.id === userId
                ) &&
                  data.prode[0]?.ispublic && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleJoinProde}
                      style={{ marginRight: '8px' }}
                    >
                      Join Prode
                    </Button>
                  )}
                {data.prode[0]?.author_id === userId && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleInvite}
                    style={{ marginRight: '8px' }}
                  >
                    Invite
                  </Button>
                )}
                {data.prode[0]?.author_id === userId && (
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleDeleteProde}
                  >
                    Delete Prode
                  </Button>
                )}
              </Grid>
            </Grid>
          )}
          <Grid container direction="row" justifyContent="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="h3" style={{ textAlign: 'center' }}>
                Matchday {data.currentMatchday} Fixtures
              </Typography>
              <div>
                {matches.length > 0 ? (
                  <Container>{matches}</Container>
                ) : (
                  <Typography variant="h5">No Matches!</Typography>
                )}
              </div>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="h3" style={{ textAlign: 'center' }}>
                Leaderboards
              </Typography>
              <div>
                {joinedUsersWithPoints && joinedUsersWithPoints.length > 0 ? (
                  <List component="ol">{joinedUsersWithPoints}</List>
                ) : (
                  <Typography variant="body1">
                    No users have joined yet!
                  </Typography>
                )}
              </div>
            </Grid>
          </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        style={{ marginBottom: '20px' }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={alertSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ShowProde;
