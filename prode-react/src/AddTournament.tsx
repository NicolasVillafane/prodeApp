import { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  Typography,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import Appbar from './Appbar';

const validationSchema = yup.object({
  id: yup.number().positive('Id must be positive').required('Id is required'),
  name: yup
    .string()
    .matches(
      /^([A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\s]*)$/gi,
      'Name can only contain Latin letters.'
    )
    .required('Name is required'),
  sport: yup
    .string()
    .matches(
      /^([A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\s]*)$/gi,
      'Sport can only contain Latin letters.'
    )
    .required('Sport is required'),
});

function AddTournament() {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [sport, setSport] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      let response = await fetch('/admin', {
        method: 'post',
        body: JSON.stringify({
          id: id,
          name: name,
          sport: sport,
        }),
        headers: { 'content-type': 'application/json' },
      });
      await response.json();
      if (response) {
        navigate(`/`);
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: id || '',
      name: name || '',
      sport: sport || '',
    },
    validationSchema: validationSchema,
    onSubmit: handleSubmit,
  });

  return (
    <div>
      <Appbar />
      <Container>
        <Typography variant="h3" textAlign="center">
          Add Tournament
        </Typography>
        <Card style={{ maxWidth: 450, margin: '0 auto', padding: '20px 5 px' }}>
          <CardContent>
            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={1}>
                <Grid xs={6} item>
                  <TextField
                    fullWidth
                    value={id}
                    variant="outlined"
                    label="id"
                    onChange={(e) => {
                      setId(e.target.value);
                    }}
                    error={formik.touched.id && Boolean(formik.errors.id)}
                    helperText={formik.touched.id && formik.errors.id}
                  />
                </Grid>
                <Grid xs={6} item>
                  <TextField
                    fullWidth
                    value={name}
                    variant="outlined"
                    label="name"
                    onChange={(e) => {
                      setName(e.target.value);
                    }}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Grid>
                <Grid xs={6} item>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Sport</InputLabel>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={sport}
                      label="Sport"
                      onChange={(e) => {
                        setSport(e.target.value);
                      }}
                      error={
                        formik.touched.sport && Boolean(formik.errors.sport)
                      }
                    >
                      <MenuItem value={'Football'}>Football</MenuItem>
                      <MenuItem value={'Basketball'}>Basketball</MenuItem>
                      <MenuItem value={'Rugby'}>Rugby</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid xs={12} item>
                  <Button fullWidth variant="contained" type="submit">
                    Add Tournament
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}

export default AddTournament;
