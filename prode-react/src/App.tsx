import { ReactKeycloakProvider } from '@react-keycloak/web';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import keycloak from './Keycloak';
import PrivateRoute from './PrivateRoute';
import PrivateRouteGeneral from './PrivateRouteGeneral';
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

function App() {
  return (
    <Box>
      <ReactKeycloakProvider authClient={keycloak}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/p/:id"
              element={
                <PrivateRouteGeneral>
                  <ShowProde />
                </PrivateRouteGeneral>
              }
            />
            <Route
              path="/p/:id/invite"
              element={
                <PrivateRouteGeneral>
                  <Invite />
                </PrivateRouteGeneral>
              }
            />
            <Route
              path="/confirm-invitation"
              element={
                <PrivateRouteGeneral>
                  <ConfirmInvitation />
                </PrivateRouteGeneral>
              }
            />
            <Route
              path="/create-prode"
              element={
                <PrivateRouteGeneral>
                  <CreateProde />
                </PrivateRouteGeneral>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminConfig />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/add"
              element={
                <PrivateRoute>
                  <AddTournament />
                </PrivateRoute>
              }
            />
            <Route
              path="tournaments"
              element={
                <PrivateRouteGeneral>
                  <Tournaments />
                </PrivateRouteGeneral>
              }
            />
            <Route
              path="tournaments/:id"
              element={
                <PrivateRouteGeneral>
                  <ShowTournament />
                </PrivateRouteGeneral>
              }
            />
            <Route
              path="tournaments/:id/matches"
              element={
                <PrivateRouteGeneral>
                  <Matches />
                </PrivateRouteGeneral>
              }
            />
          </Routes>
        </BrowserRouter>
      </ReactKeycloakProvider>
    </Box>
  );
}
export default App;
