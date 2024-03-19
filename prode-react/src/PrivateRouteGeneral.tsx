import { useKeycloak } from '@react-keycloak/web';

const PrivateRouteGeneral = ({ children }: any) => {
  const { keycloak } = useKeycloak();

  const isLoggedIn = keycloak.authenticated;

  if (isLoggedIn) {
    if (keycloak.tokenParsed!.realm_access!.roles.includes('user')) {
      return children;
    } else {
      return null;
    }
  }

  return null;
};

export default PrivateRouteGeneral;
