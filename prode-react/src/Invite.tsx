import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import keycloak from './Keycloak';

interface User {
  id: string;
  username: string;
  email: string;
}

const validationSchema = yup.object({
  selectedUser: yup.object().nullable().required('Please select a user'),
});

const Invite = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
      if (!selectedUser) {
        console.error('No user selected');
        return;
      }

      const response = await fetch('/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prodeId: id,
          receiverEmail: selectedUser.email,
          senderUserId: keycloak.tokenParsed?.sub,
          selectedUser: selectedUser.username,
          selectedUserId: selectedUser.id,
        }),
      });

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
      selectedUser: null,
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
                      value={selectedUser ? selectedUser.id : ''}
                      onChange={(e) => {
                        const selectedId = e.target.value as string;
                        const user = users.find(
                          (user) => user.id === selectedId
                        );
                        setSelectedUser(user ?? null);
                        formik.setFieldValue('selectedUser', user ?? null);
                      }}
                      error={
                        formik.touched.selectedUser &&
                        Boolean(formik.errors.selectedUser)
                      }
                    >
                      {users.map((user) => (
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
