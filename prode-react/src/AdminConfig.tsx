import { useEffect, useState } from 'react';
import Appbar from './Appbar';
import { Button, Typography, Container } from '@mui/material';

function AdminConfig() {
  const [data, setData] = useState([{}]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/tournaments');
        const result = await response.json();
        setData(result);
        console.log(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const tournaments = data.map((tournament: any) => (
    <Button href={`#`} variant="outlined">
      {tournament.name} | {tournament.sport}
    </Button>
  ));

  return (
    <div>
      <Appbar />
      <Container>
        <Button href="/admin/add">Create Tournament</Button>

        <Typography variant="h5"> Tournaments:</Typography>
        {tournaments}
      </Container>
    </div>
  );
}
export default AdminConfig;
