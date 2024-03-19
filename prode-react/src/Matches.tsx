import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Container, Typography } from '@mui/material';
import Appbar from './Appbar';

function Matches() {
  let { id } = useParams();
  const [data, setData]: any = useState([{}]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/tournaments/${id}/matches`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  function filterByToday(array: any, dateKey: any) {
    const today = new Date(); // Get today's date
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ); // Start of today
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000); // End of today

    return array.filter((obj: any) => {
      const objDate = new Date(obj[dateKey]); // Get date from object
      return objDate >= todayStart && objDate < todayEnd; // Compare dates
    });
  }

  const filteredData = filterByToday(data, 'utcDate');

  const matches = filteredData.map((match: any) => {
    const dateObject = new Date(match.utcDate);

    const hour = dateObject.getUTCHours();
    const minutes = dateObject.getUTCMinutes();
    return (
      <Typography variant="h5">
        {match.homeTeam.name} VS {match.awayTeam.name} |{' '}
        {match.score.fullTime.homeTeam} - {match.score.fullTime.awayTeam} |{' '}
        {hour}:{minutes}
      </Typography>
    );
  });

  return (
    <div>
      <Appbar />
      <Typography variant="h3">Today's matches</Typography>
      {matches[0] && <Container>{matches}</Container>}
      {!matches[0] && <Typography variant="h5">No Matches!</Typography>}
    </div>
  );
}
export default Matches;
