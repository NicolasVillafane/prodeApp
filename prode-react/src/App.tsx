import { ReactNode } from 'react';
import { ReactKeycloakProvider, useKeycloak } from '@react-keycloak/web';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import keycloak from './Keycloak';
import AdminConfig from './AdminConfig';
import AddTournament from './AddTournament';
import ShowTournament from './ShowTournament';
import Home from './Home';
import Tournaments from './Tournaments';
import { Box } from '@mui/material';
import Matches from './Matches';
import CreateProde from './CreateProde';
import ShowProde from './ShowProde';
import Invite from './Invite';
import ConfirmInvitation from './ConfirmInvitation';

interface SecureRouteProps {
  element: ReactNode;
}

interface SecureAdminRouteProps {
  element: ReactNode;
}

function App() {
  return (
    <Box>
      <ReactKeycloakProvider authClient={keycloak}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/p/:id"
              element={<SecureRoute element={<ShowProde />} />}
            />
            <Route
              path="/p/:id/invite"
              element={<SecureRoute element={<Invite />} />}
            />
            <Route
              path="/confirm-invitation"
              element={<SecureRoute element={<ConfirmInvitation />} />}
            />
            <Route
              path="/create-prode"
              element={<SecureRoute element={<CreateProde />} />}
            />
            <Route
              path="/admin"
              element={<SecureAdminRoute element={<AdminConfig />} />}
            />
            <Route
              path="/admin/add"
              element={<SecureAdminRoute element={<AddTournament />} />}
            />
            <Route
              path="/tournaments"
              element={<SecureRoute element={<Tournaments />} />}
            />
            <Route
              path="/tournaments/:id"
              element={<SecureRoute element={<ShowTournament />} />}
            />
            <Route
              path="/tournaments/:id/matches"
              element={<SecureRoute element={<Matches />} />}
            />
          </Routes>
        </BrowserRouter>
      </ReactKeycloakProvider>
    </Box>
  );
}

// Custom secure route component for general user access
function SecureRoute({ element, ...rest }: SecureRouteProps) {
  const { initialized, keycloak } = useKeycloak();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return keycloak.authenticated ? (
    (element as JSX.Element)
  ) : (
    <Navigate to="/" />
  );
}

// Custom secure route component for admin access
function SecureAdminRoute({ element, ...rest }: SecureAdminRouteProps) {
  const { initialized, keycloak } = useKeycloak();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return keycloak.authenticated && keycloak.hasRealmRole('admin') ? (
    (element as JSX.Element)
  ) : (
    <Navigate to="/" />
  );
}

export default App;
