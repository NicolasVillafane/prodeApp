import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Container,
} from '@mui/material';
import Appbar from './Appbar';
import keycloak from './Keycloak';

const validationSchema = yup.object({
  receiverEmail: yup
    .string()
    .email('Invalid email')
    .required('Email is required'),
});

const Invite = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const response = await fetch('/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prodeId: id,
          receiverEmail: values.receiverEmail,
        }),
      });

      setLoading(false);

      if (response.ok) {
        alert('Invitation sent successfully');
        navigate(`/p/${id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Error sending invitation');
    }
  };

  const formik = useFormik({
    initialValues: {
      receiverEmail: '',
    },
    validationSchema: validationSchema,
    onSubmit: handleSubmit,
  });

  return (
    <div>
      <Appbar />
      <Container>
        <Typography variant="h3" textAlign="center">
          Invite Users
        </Typography>
        <Card style={{ maxWidth: 450, margin: '0 auto', padding: '20px 5px' }}>
          <CardContent>
            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={2}>
                <Grid xs={12} item>
                  <TextField
                    fullWidth
                    id="receiverEmail"
                    name="receiverEmail"
                    label="Recipient Email"
                    variant="outlined"
                    value={formik.values.receiverEmail}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.receiverEmail &&
                      Boolean(formik.errors.receiverEmail)
                    }
                    helperText={
                      formik.touched.receiverEmail &&
                      formik.errors.receiverEmail
                    }
                  />
                </Grid>
                <Grid xs={12} item>
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Invitation'}
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

export default Invite;
