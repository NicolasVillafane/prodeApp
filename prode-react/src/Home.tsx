import { useKeycloak } from '@react-keycloak/web';
import Appbar from './Appbar';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Container,
} from '@mui/material';
import { Link } from 'react-router-dom';

interface Prode {
  id: string;
  name: string;
  tournamentname: string;
  ispublic: boolean;
  author_name: string;
}

function Home() {
  const { keycloak } = useKeycloak();
  const [prodes, setProdes] = useState<Prode[]>([]);

  useEffect(() => {
    const fetchProdes = async () => {
      try {
        const response = await fetch('/home', {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          },
        });
        const data = await response.json();
        setProdes(data);
      } catch (error) {
        console.error('Error fetching prodes:', error);
      }
    };

    fetchProdes();
  }, [keycloak.token]);

  return (
    <div>
      <Appbar />
      <Container>
        <Typography variant="h3" gutterBottom>
          Welcome {keycloak.tokenParsed?.preferred_username}
        </Typography>
        <Typography variant="h4" gutterBottom>
          Prodes:
        </Typography>
        <Grid container spacing={3}>
          {prodes.map((prode) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={prode.id}>
              <Link to={`/p/${prode.id}`} style={{ textDecoration: 'none' }}>
                <Card
                  sx={{
                    maxWidth: 345,
                    marginBottom: 3,
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 20px 0 rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  <CardMedia
                    sx={{ height: 140 }}
                    image="https://img.freepik.com/foto-gratis/herramientas-deportivas_53876-138077.jpg"
                    title="Football"
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {prode.name} | {prode.tournamentname}{' '}
                      {prode.ispublic ? '- Public' : '- Private'}{' '}
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="textSecondary"
                      component="div"
                    >
                      by {prode.author_name}
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Container>
    </div>
  );
}

export default Home;
