import { useKeycloak } from '@react-keycloak/web';

const PrivateRoute = ({ children }: any) => {
  const { keycloak } = useKeycloak();

  const isLoggedIn = keycloak.authenticated;

  if (isLoggedIn) {
    if (keycloak.tokenParsed!.realm_access!.roles.includes('admin')) {
      return children;
    } else {
      return null;
    }
  }

  return null;
};

export default PrivateRoute;
