import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Grid, Container, Checkbox } from '@mui/material';
import Appbar from './Appbar';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/p/${id}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [id]);

  const handleCheckboxChange = (team: string) => {
    setSelectedWinner(team);
  };

  const handleDeleteProde = async () => {
    try {
      await fetch(`/p/${id}`, {
        method: 'DELETE',
      });
      navigate('/'); // Redirect to dashboard after deletion
    } catch (error) {
      console.error('Error deleting prode:', error);
    }
  };

  const isAuthor = true; // Replace with your logic to determine if the user is the author

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
          currentDateTime >= matchStartDate - 30 * 60 * 1000; // 30 minutes before match start

        const formattedHour = dateObject.getUTCHours();
        const formattedMinutes = dateObject.getUTCMinutes();

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
                  |{' '}
                </>
              )}
              {match.homeTeam.name} VS {match.awayTeam.name} |{' '}
              {match.score.fullTime.homeTeam} - {match.score.fullTime.awayTeam}{' '}
              | {match.status !== 'SCHEDULED' ? match.status : ''}
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
        </Grid>
        {data.prode.length > 0 && (
          <Grid container spacing={2}>
            <Grid item>
              {isAuthor && (
                <button onClick={handleDeleteProde}>Delete Prode</button>
              )}
            </Grid>
          </Grid>
        )}
      </Container>
    </div>
  );
};

export default ShowProde;
