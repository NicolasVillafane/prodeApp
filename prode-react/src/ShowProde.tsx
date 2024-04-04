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
} from '@mui/material';
import Appbar from './Appbar';
import keycloak from './Keycloak';

interface Match {
  id: string;
  utcDate: string;
  status: string;
  homeTeam: {
    name: string;
  };
  awayTeam: {
    name: string;
  };
  score: {
    fullTime: {
      homeTeam: number;
      awayTeam: number;
    };
  };
}

interface Prode {
  id: string;
  name: string;
  author_name: string;
  author_id: string;
  ispublic: boolean;
  joined_users_info: { id: string; username: string }[];
}

interface Data {
  prode: Prode[];
  football?: Match[];
  currentMatchday?: number;
}

const ShowProde = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Data>({ prode: [] });
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [joinedUsers, setJoinedUsers] = useState<JSX.Element[]>([]);

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

  const handleInvite = async () => {
    try {
      navigate(`/p/${id}/invite`);
    } catch (error) {
      console.error('Error navigating to invite route:', error);
    }
  };

  const handleCheckboxChange = (team: string) => {
    setSelectedWinner(team);
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
        // Handle successful prediction submission (if needed)
      } else {
        console.error('Failed to submit prediction');
      }
    } catch (error) {
      console.error('Error submitting prediction:', error);
    }
  };

  const matches = data.football
    ? data.football.map((match) => {
        const dateObject = new Date(match.utcDate);
        const day = dateObject.getDate();
        const formattedDay = day < 10 ? `0${day}` : day;
        const month = dateObject.getMonth() + 1;
        const formattedMonth = month < 10 ? `0${month}` : month;
        const formattedDate = `${formattedDay}/${formattedMonth}`;
        const matchStartDate = dateObject.getTime();
        const currentDateTime = new Date().getTime();
        const isMatchLocked =
          match.status !== 'POSTPONED' &&
          currentDateTime >= matchStartDate - 30 * 60 * 1000;
        const formattedHour = dateObject.getUTCHours();
        const formattedMinutes = dateObject.getUTCMinutes();
        const isMatchFinished = match.status === 'FINISHED';

        return (
          <div key={match.id}>
            <Typography variant="h6" style={{ borderBottom: '1px solid #000' }}>
              {formattedDate} |{' '}
              {match.status === 'POSTPONED' ? (
                ''
              ) : (
                <>
                  {formattedHour < 10 ? `0${formattedHour}` : formattedHour}:
                  {formattedMinutes < 10
                    ? `0${formattedMinutes}`
                    : formattedMinutes}{' '}
                  | {match.homeTeam.name} VS {match.awayTeam.name} |{' '}
                  {match.score.fullTime.homeTeam} -{' '}
                  {match.score.fullTime.awayTeam} |{' '}
                  {match.status !== 'SCHEDULED' ? match.status : ''}
                  {(isMatchFinished || isMatchLocked) && (
                    <span style={{ color: 'red', marginLeft: '8px' }}>
                      Closed
                    </span>
                  )}
                </>
              )}
            </Typography>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox
                disabled={isMatchLocked}
                checked={selectedWinner === match.homeTeam.name}
                onChange={() => handleCheckboxChange(match.homeTeam.name)}
                style={{ filter: isMatchLocked ? 'grayscale(100%)' : 'none' }}
              />
              <label>{match.homeTeam.name}</label>
              <Checkbox
                disabled={isMatchLocked}
                checked={selectedWinner === match.awayTeam.name}
                onChange={() => handleCheckboxChange(match.awayTeam.name)}
                style={{ filter: isMatchLocked ? 'grayscale(100%)' : 'none' }}
              />
              <label>{match.awayTeam.name}</label>
              <Button
                disabled={!selectedWinner || isMatchLocked || isMatchFinished}
                onClick={() =>
                  handleSubmitPrediction(
                    match.id,
                    selectedWinner === match.homeTeam.name
                      ? 'homeTeam'
                      : 'awayTeam'
                  )
                }
              >
                Submit Prediction
              </Button>
            </div>
          </div>
        );
      })
    : [];

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
        </Grid>
        <Grid
          container
          rowSpacing={1}
          columnSpacing={{ xs: 1, sm: 2, md: 3 }}
          textAlign="center"
        >
          <Grid item xs={6}>
            <Typography variant="h3" style={{ borderRight: '1px solid #000' }}>
              Matchday {data.currentMatchday} Fixtures
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h3">Leaderboards</Typography>
          </Grid>
          {data.prode[0]?.joined_users_info.find(
            (user) => user.id === userId
          ) && (
            <>
              <Grid
                item
                xs={6}
                textAlign="left"
                style={{ borderRight: '1px solid #000' }}
              >
                {matches.length > 0 ? (
                  <Container>{matches}</Container>
                ) : (
                  <Typography variant="h5">No Matches!</Typography>
                )}
              </Grid>
              <Grid item xs={6} textAlign="left">
                {joinedUsers.length > 0 ? (
                  <List component="ol">
                    {joinedUsers.map((user, index) => (
                      <ListItem key={index}>
                        <ListItemText>
                          <Typography variant="h6">
                            {`${index + 1}. ${user.props.children}`}
                          </Typography>
                        </ListItemText>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1">
                    No users have joined yet!
                  </Typography>
                )}
              </Grid>
            </>
          )}
        </Grid>
      </Container>
    </div>
  );
};

export default ShowProde;
