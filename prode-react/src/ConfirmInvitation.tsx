import React, { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Appbar from './Appbar';

interface InvitationData {
  prodeId: string;
  token: string;
  selectedUser: string | null;
  selectedUserId: string | null;
}

const ConfirmInvitation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const prodeId = searchParams.get('prodeId');
    const token = searchParams.get('token');
    const selectedUser = searchParams.get('selectedUser');
    const selectedUserId = searchParams.get('selectedUserId');

    if (prodeId && token && selectedUser && selectedUserId) {
      confirmInvitation({ prodeId, token, selectedUser, selectedUserId });
    }
  }, [location.search, navigate, searchParams]);

  const confirmInvitation = async (data: InvitationData) => {
    try {
      if (data.selectedUser === null) {
        throw new Error('Selected user is null');
      }
      console.log({ data }, 'dsdsd');
      const response = await fetch('/confirm-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        navigate(`/p/${data.prodeId}`);
      } else {
        throw new Error('Failed to confirm invitation');
      }
    } catch (error) {
      console.error('Error confirming invitation:', error);
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
