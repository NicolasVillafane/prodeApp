import React, { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

interface InvitationData {
  prodeId: string;
  token: string;
  selectedUser: string | null;
  selectedUserId: string | null;
}

const ConfirmInvitation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Destructure searchParams from useSearchParams

  useEffect(() => {
    const prodeId = searchParams.get('prodeId');
    const token = searchParams.get('token');
    const selectedUser = searchParams.get('selectedUser'); // Extract selectedUser from URL
    const selectedUserId = searchParams.get('selectedUserId'); // Extract selectedUser from URL

    if (prodeId && token && selectedUser && selectedUserId) {
      confirmInvitation({ prodeId, token, selectedUser, selectedUserId }); // Pass selectedUser to confirmInvitation
    }
  }, [location.search, navigate, searchParams]); // Include searchParams in the dependencies

  const confirmInvitation = async (data: InvitationData) => {
    try {
      if (data.selectedUser === null) {
        // Handle the case where selectedUser is null
        throw new Error('Selected user is null');
      }
      console.log({ data }, 'dsdsd');
      const response = await fetch('/confirm-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data), // Include selectedUser in the request body
      });

      if (response.ok) {
        // Invitation confirmed successfully
        navigate(`/p/${data.prodeId}`); // Navigate to the prode page
      } else {
        throw new Error('Failed to confirm invitation');
      }
    } catch (error) {
      console.error('Error confirming invitation:', error);
      // Handle error (e.g., display error message)
    }
  };

  return (
    <div>
      <h1>Confirming Invitation...</h1>
      {/* You can add a loading indicator or message here */}
    </div>
  );
};

export default ConfirmInvitation;
