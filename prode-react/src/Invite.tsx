import React, { useState } from 'react';
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
  Snackbar,
} from '@mui/material';
import { Alert } from '@mui/material';
import Appbar from './Appbar';

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
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>(
    'success'
  );

  const handleAlertClose = (event: any, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setAlertOpen(false);
    // Navigate only if the reason for closing is not 'clickaway'
    if (reason !== 'clickaway') {
      navigate(`/p/${id}`);
    }
  };

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
        setAlertSeverity('success');
        setAlertMessage('Invitation sent successfully');
        setAlertOpen(true);
        // Do not navigate until the alert is dismissed
      } else {
        const errorData = await response.json();
        setAlertSeverity('error');
        setAlertMessage(errorData.error);
        setAlertOpen(true);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setAlertSeverity('error');
      setAlertMessage('Error sending invitation');
      setAlertOpen(true);
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
        <Card
          style={{ maxWidth: 450, margin: '20px auto', padding: '20px 5px' }}
        >
          <CardContent>
            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={2}>
                <Grid xs={12} item>
                  <TextField
                    fullWidth
                    id="receiverEmail"
                    name="receiverEmail"
                    label="Write an Email"
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
      </Container>
    </div>
  );
};

export default Invite;
