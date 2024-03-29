import { useState, useEffect } from 'react';
import keycloak from './Keycloak';
import {
  AppBar,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const sendEventToBackend = async () => {
  const userId = keycloak.tokenParsed?.sub;
  const username = keycloak.tokenParsed?.preferred_username;
  const email = keycloak.tokenParsed?.email;

  // console.log('User ID:', userId);
  // console.log('Username:', username);
  // console.log('Email:', email);

  try {
    const response = await fetch('/keycloak-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'REGISTER',
        data: {
          type: 'USER',
          details: {
            userId: userId,
            username: username,
            email: email,
          },
        },
      }),
    });
    if (response.ok) {
      console.log('Keycloak event sent successfully');
    } else {
      console.error('Failed to send Keycloak event');
    }
  } catch (error) {
    console.error('Error sending Keycloak event:', error);
  }
};

function Appbar() {
  const [openDrawer, setOpenDrawer] = useState(false);

  const toggleDrawer = () => {
    setOpenDrawer(!openDrawer);
  };

  const handleLogout = () => {
    keycloak.logout();
  };

  const handleRegister = () => {
    keycloak.register();
  };

  useEffect(() => {
    if (keycloak.authenticated) {
      sendEventToBackend();
    }
  }, [keycloak.authenticated]);

  return (
    <AppBar
      position="sticky"
      style={{ top: 0, left: 0, right: 0, zIndex: 1000 }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={toggleDrawer}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, textAlign: 'center' }}
        >
          ProdeApp{' '}
          <span
            style={{ fontSize: '0.75rem', marginLeft: '5px', opacity: 0.7 }}
          >
            by NicoProductions™
          </span>
        </Typography>
        <Drawer anchor="left" open={openDrawer} onClose={toggleDrawer}>
          <List>
            <ListItem button component="a" href="/">
              <ListItemText primary="Home" />
            </ListItem>
            {keycloak.tokenParsed?.realm_access?.roles.includes('user') && (
              <>
                <ListItem button component="a" href="/create-prode">
                  <ListItemText primary="+ Prode" />
                </ListItem>
                <ListItem button component="a" href="/tournaments">
                  <ListItemText primary="Tournaments" />
                </ListItem>
              </>
            )}
            {keycloak.tokenParsed?.realm_access?.roles.includes('admin') && (
              <ListItem button component="a" href="/admin">
                <ListItemText primary="Admin" />
              </ListItem>
            )}
          </List>
        </Drawer>
        <Button
          onClick={
            keycloak.authenticated ? handleLogout : () => keycloak.login()
          }
          color="inherit"
        >
          {keycloak.authenticated
            ? `Logout (${keycloak.tokenParsed?.preferred_username})`
            : 'Log In'}
        </Button>
        {!keycloak.authenticated && (
          <Button onClick={handleRegister} color="inherit">
            Register
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Appbar;
