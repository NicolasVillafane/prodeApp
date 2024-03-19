import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080/',
  realm: 'prode',
  clientId: 'prode-client',
});

export default keycloak;
