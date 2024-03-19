import { useKeycloak } from '@react-keycloak/web';
import Appbar from './Appbar';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Button,
  Typography,
  Grid,
  Container, // Import Grid component from MUI
} from '@mui/material';

function Home() {
  const { keycloak } = useKeycloak();
  const [data, setData] = useState([{}]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/home');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  console.log(data);

  const prodes = data.map((prode: any) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={prode.id}>
      {' '}
      {/* Define the grid layout */}
      <Card sx={{ maxWidth: 345, mb: 1.5 }}>
        <CardMedia
          sx={{ height: 140 }}
          image="https://img.freepik.com/foto-gratis/herramientas-deportivas_53876-138077.jpg"
          title="football"
        />
        <CardContent>
          <Typography gutterBottom variant="h6" component="div">
            {prode.name} | {prode.tournamentname}
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small" href={`/p/${prode.id}`}>
            Info
          </Button>
        </CardActions>
      </Card>
    </Grid>
  ));

  return (
    <div>
      <Appbar />
      <Container>
        <h1>Welcome {keycloak.tokenParsed?.preferred_username}</h1>

        <h2>Prodes:</h2>
        <Grid container spacing={2}>
          {' '}
          {/* Grid container */}
          {prodes}
        </Grid>
      </Container>
    </div>
  );
}

export default Home;
