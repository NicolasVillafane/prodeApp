import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Container,
} from '@mui/material';
import Appbar from './Appbar';

const validationSchema = yup.object({
  selectedUser: yup.string().required('Please select a user'),
});

const Invite = () => {
  const { id } = useParams();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    const fetchInviteData = async () => {
      try {
        const response = await fetch(`/p/${id}/invite`);
        const responseData = await response.json();
        setUsers(responseData.users);
      } catch (error) {
        console.error('Error fetching invitation data:', error);
      }
    };

    fetchInviteData();
  }, [id]);

  const handleSubmit = async () => {
    try {
      // Add functionality for submitting invitation
      console.log('Invitation submitted!');
    } catch (error) {
      console.error('Error submitting invitation:', error);
    }
  };

  const formik = useFormik({
    initialValues: {
      selectedUser: '',
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
              <Grid container spacing={1}>
                <Grid xs={12} item>
                  <FormControl fullWidth>
                    <InputLabel id="user-select-label">Select User</InputLabel>
                    <Select
                      labelId="user-select-label"
                      id="user-select"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      error={
                        formik.touched.selectedUser &&
                        Boolean(formik.errors.selectedUser)
                      }
                    >
                      {users.map((user: any) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.username}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {formik.touched.selectedUser &&
                    formik.errors.selectedUser && (
                      <Typography variant="body2" color="error">
                        {formik.errors.selectedUser}
                      </Typography>
                    )}
                </Grid>
                <Grid xs={12} item>
                  <Button fullWidth variant="contained" type="submit">
                    Invite
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
