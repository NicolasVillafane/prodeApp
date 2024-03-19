import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Appbar from './Appbar';
import { Container, Typography, Button } from '@mui/material';
function ShowTournament() {
  let { id } = useParams();
  const [data, setData]: any = useState([{}]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/tournaments/${id}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const teams = data.map((team: any) => (
    <Typography variant="h5">
      {team.name} <img src={team.crestUrl} width="3%" />
    </Typography>
  ));

  return (
    <div>
      <Appbar />
      <Button
        href={`/tournaments/${id}/matches`}
        variant="outlined"
        color="inherit"
        sx={{ mt: 1.5 }}
      >
        Matches
      </Button>
      <Container>{teams}</Container>
    </div>
  );
}
export default ShowTournament;
