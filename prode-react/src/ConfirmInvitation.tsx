import React, { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Appbar from './Appbar';
import { useKeycloak } from '@react-keycloak/web';

const ConfirmInvitation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { keycloak } = useKeycloak();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      confirmInvitation(token);
    }
  }, [location.search, navigate, searchParams]);

  const confirmInvitation = async (token: any) => {
    try {
      console.log('Sending token:', token); // Log the token sent to the server

      const response = await fetch('/confirm-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keycloak.token}`,
        },
        body: JSON.stringify({
          token: token,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Invitation confirmed successfully:', responseData); // Log the response from the server
        navigate(`/`);
      } else {
        throw new Error('Failed to confirm invitation');
      }
    } catch (error) {
      console.error('Error confirming invitation:', error); // Log any errors that occur
    }
  };

  return (
    <div>
      <Appbar />
      <h1>Confirming Invitation...</h1>
    </div>
  );
};

export default ConfirmInvitation;
