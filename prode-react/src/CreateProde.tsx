import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import keycloak from './Keycloak'; // Import the Keycloak instance
import Appbar from './Appbar';

import {
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Container,
  FormControlLabel,
  Switch,
} from '@mui/material';

// Define the type for tournament data
interface Tournament {
  id: number;
  name: string;
}

const validationSchema = yup.object({
  name: yup
    .string()
    .matches(
      /^([A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\s]*)$/gi,
      'Name can only contain Latin letters.'
    )
    .required('Name is required'),
  tournament: yup
    .string()
    .matches(
      /^([A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\s]*)$/gi,
      'Tournament can only contain Latin letters.'
    )
    .required('Tournament is required'),
});

const CreateProde = () => {
  const [name, setName] = useState('');
  const [tournament, setTournament] = useState('');
  const [data, setData] = useState<Tournament[]>([]); // Specify the type as Tournament array
  const [isPublic, setIsPublic] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/create-prode');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async () => {
    try {
      const selectedTournament = data.find(
        (tournament) => tournament.name === formik.values.tournament
      );

      if (!selectedTournament) {
        console.error('Selected tournament not found.');
        return;
      }

      const user = keycloak.authenticated ? keycloak.tokenParsed : null; // Get authenticated user info

      const response = await fetch('/create-prode', {
        method: 'post',
        body: JSON.stringify({
          name: formik.values.name,
          tournamentId: selectedTournament?.id,
          tournamentName: formik.values.tournament,
          isPublic: isPublic,
          authorId: user?.sub, // Pass the user ID if authenticated, null otherwise
          authorName: user?.preferred_username, // Pass the username if authenticated, null otherwise
        }),
        headers: { 'content-type': 'application/json' },
      });
      await response.json();
      console.log(response);

      navigate('/'); // Redirect to the "/" route
    } catch (error) {
      console.log(error);
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: name || '',
      tournament: tournament || '',
    },
    validationSchema: validationSchema,
    onSubmit: handleSubmit,
  });

  return (
    <div>
      <Appbar />
      <Container>
        <Typography variant="h3" textAlign="center">
          Add Prode
        </Typography>
        <Card style={{ maxWidth: 450, margin: '0 auto', padding: '20px 5 px' }}>
          <CardContent>
            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={1}>
                <Grid xs={6} item>
                  <TextField
                    fullWidth
                    value={name}
                    variant="outlined"
                    label="Name"
                    onChange={(e) => {
                      setName(e.target.value);
                    }}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Grid>
                <Grid xs={6} item>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">
                      Tournament
                    </InputLabel>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={tournament}
                      label="Tournament"
                      onChange={(e) => {
                        setTournament(e.target.value);
                      }}
                      error={
                        formik.touched.tournament &&
                        Boolean(formik.errors.tournament)
                      }
                    >
                      {data.map((tournament) => (
                        <MenuItem key={tournament.id} value={tournament.name}>
                          {tournament.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Checkbox or Switch to set prode as public or private */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                      />
                    }
                    label="Make Prode Public"
                  />
                </Grid>

                <Grid xs={12} item>
                  <Button fullWidth variant="contained" type="submit">
                    Add Prode
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
};

export default CreateProde;
