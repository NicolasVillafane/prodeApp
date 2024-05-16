import { uuid } from 'uuidv4';
import pkg from 'pg';
const { Pool } = pkg;

const tournamentPool = new Pool({
  host: 'localhost',
  user: 'postgres',
  port: 5432,
  password: 'postgres',
  database: 'prodeapp',
});

const prodePool = new Pool({
  host: 'localhost',
  user: 'postgres',
  port: 5432,
  password: 'postgres',
  database: 'prodeapp',
});

const userPool = new Pool({
  host: 'localhost',
  user: 'postgres',
  port: 5432,
  password: 'postgres',
  database: 'prodeapp',
});

const invitationPool = new Pool({
  host: 'localhost',
  user: 'postgres',
  port: 5432,
  password: 'postgres',
  database: 'prodeapp',
});

const predictionPool = new Pool({
  host: 'localhost',
  user: 'postgres',
  port: 5432,
  password: 'postgres',
  database: 'prodeapp',
});

export const saveInvitationToken = async (prodeId, token, receiverEmail) => {
  try {
    const userAlreadyJoined = await checkIfUserAlreadyJoinedProde(
      prodeId,
      receiverEmail
    );

    if (userAlreadyJoined) {
      throw new Error('User has already joined the prode');
    }

    await invitationPool.query(
      'INSERT INTO invitations (prode_id, token, receiver_email) VALUES ($1, $2, $3)',
      [prodeId, token, receiverEmail]
    );
  } catch (error) {
    console.error('Error saving invitation token:', error);
    throw error;
  }
};

export const verifyInvitationToken = async (prodeId, token) => {
  try {
    const result = await invitationPool.query(
      'SELECT * FROM invitations WHERE prode_id = $1 AND token = $2',
      [prodeId, token]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error verifying invitation token:', error);
    throw error;
  }
};

export const getTournaments = async () => {
  try {
    return await new Promise(function (resolve, reject) {
      tournamentPool.query('SELECT * FROM tournaments', (error, results) => {
        if (error) {
          reject(error);
        }
        if (results && results.rows) {
          resolve(results.rows);
        } else {
          reject(new Error('No results found'));
        }
      });
    });
  } catch (error_1) {
    console.error(error_1);
    throw new Error('Internal server error');
  }
};

export const getTournament = async (id) => {
  try {
    return await new Promise(function (resolve, reject) {
      tournamentPool.query(
        `SELECT * FROM tournaments WHERE id = '${id}' `,
        (error, results) => {
          if (error) {
            reject(error);
          }
          if (results && results.rows) {
            resolve(results.rows);
          } else {
            reject(new Error('No results found'));
          }
        }
      );
    });
  } catch (error_1) {
    console.error(error_1);
    throw new Error('Internal server error');
  }
};

export const createTournament = (body) => {
  return new Promise(function (resolve, reject) {
    const { id, name, sport } = body;
    tournamentPool.query(
      'INSERT INTO tournaments (id, name, sport) VALUES ($1, $2, $3) RETURNING *',
      [id, name, sport],
      (error, results) => {
        if (error) {
          reject(error);
        }
        if (results && results.rows) {
          resolve(
            `A new tournament has been added: ${JSON.stringify(
              results.rows[0]
            )}`
          );
        } else {
          reject(new Error('No results found'));
        }
      }
    );
  });
};

export const createProde = (body) => {
  return new Promise(function (resolve, reject) {
    const {
      id,
      name,
      tournamentName,
      tournamentId,
      isPublic,
      authorId,
      authorName,
      authorEmail,
    } = body;
    prodePool.query(
      'INSERT INTO prodes (id, name, tournamentName, tournamentId, isPublic, author_id, author_name, author_email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        id,
        name,
        tournamentName,
        tournamentId,
        isPublic,
        authorId,
        authorName,
        authorEmail,
      ],
      (error, results) => {
        if (error) {
          reject(error);
        }
        if (results && results.rows) {
          resolve(
            `A new prode has been added: ${JSON.stringify(results.rows[0])}`
          );
        } else {
          reject(new Error('No results found'));
        }
      }
    );
  });
};

export const getProdes = async () => {
  try {
    return await new Promise(function (resolve, reject) {
      prodePool.query('SELECT * FROM prodes', (error, results) => {
        if (error) {
          reject(error);
        }
        if (results && results.rows) {
          resolve(results.rows);
        } else {
          reject(new Error('No results found'));
        }
      });
    });
  } catch (error_1) {
    console.error(error_1);
    throw new Error('Internal server error');
  }
};

export const getPublicProdes = async () => {
  try {
    const query = 'SELECT * FROM prodes WHERE ispublic = true';
    const { rows } = await prodePool.query(query);
    return rows;
  } catch (error) {
    console.error('Error fetching public prodes:', error);
    throw error;
  }
};

export const getPrivateProdesForUser = async (userId) => {
  try {
    const query =
      'SELECT * FROM prodes WHERE author_id = $1 OR joined_users_info::jsonb @> $2';
    const { rows } = await prodePool.query(query, [
      userId,
      `[{"id": "${userId}"}]`,
    ]);
    return rows;
  } catch (error) {
    console.error('Error fetching private prodes for user:', error);
    throw error;
  }
};

export const getProde = async (id) => {
  try {
    return await new Promise(function (resolve, reject) {
      prodePool.query(
        `SELECT * FROM prodes WHERE id = '${id}' `,
        (error, results) => {
          if (error) {
            reject(error);
          }
          if (results && results.rows) {
            resolve(results.rows);
          } else {
            reject(new Error('No results found'));
          }
        }
      );
    });
  } catch (error_1) {
    console.error(error_1);
    throw new Error('Internal server error');
  }
};

export const deleteProde = (id) => {
  return new Promise(function (resolve, reject) {
    prodePool.query(
      'DELETE FROM prodes WHERE id = $1',
      [id],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve();
      }
    );
  });
};

export const saveUserToDatabase = (userId, username, email) => {
  userPool.query(
    'INSERT INTO users (id, username, email) VALUES ($1, $2, $3)',
    [userId, username, email],
    (error, results) => {
      if (error) {
        console.error('Error saving user to database:', error);
      } else {
        console.log('User saved to database:', results.rows[0]);
      }
    }
  );
};

export const getUsers = async () => {
  try {
    return await new Promise(function (resolve, reject) {
      userPool.query('SELECT * FROM users', (error, results) => {
        if (error) {
          reject(error);
        }
        if (results && results.rows) {
          resolve(results.rows);
        } else {
          reject(new Error('No results found'));
        }
      });
    });
  } catch (error_1) {
    console.error(error_1);
    throw new Error('Internal server error');
  }
};

export const getUserById = (userId) => {
  return new Promise((resolve, reject) => {
    userPool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId],
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (result.rows.length > 0) {
            resolve(result.rows[0]);
          } else {
            resolve(null);
          }
        }
      }
    );
  });
};

export const joinProde = async (prodeId, userId, username, userEmail) => {
  try {
    await prodePool.query(
      'UPDATE prodes SET joined_users_info = joined_users_info || $1 WHERE id = $2',
      [{ id: userId, username: username, email: userEmail }, prodeId]
    );

    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const checkIfUserWithEmailExists = async (email) => {
  try {
    const result = await userPool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking user with email:', error);
    throw error;
  }
};

export const getInvitationInfoByToken = (token) => {
  return new Promise((resolve, reject) => {
    invitationPool.query(
      'SELECT prode_id, receiver_email FROM invitations WHERE token = $1',
      [token],
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (result.rows.length > 0) {
            const { prode_id, receiver_email } = result.rows[0];
            console.log(prode_id, receiver_email);
            resolve({ prodeId: prode_id, receiverEmail: receiver_email });
          } else {
            resolve(null);
          }
        }
      }
    );
  });
};

export const checkIfUserAlreadyJoinedProde = async (prodeId, userEmail) => {
  try {
    const result = await prodePool.query(
      'SELECT joined_users_info FROM prodes WHERE id = $1',
      [prodeId]
    );

    const joinedUsersInfo = result.rows[0]?.joined_users_info || [];

    return joinedUsersInfo.some((user) => user.email === userEmail);
  } catch (error) {
    console.error('Error checking if user already joined prode:', error);
    throw error;
  }
};

export const savePredictionToDatabase = async (
  id,
  user_id,
  prode_id,
  match_id,
  predicted_result
) => {
  try {
    const existingPrediction = await getPredictionByUserAndMatch(
      user_id,
      match_id
    );
    if (existingPrediction) {
      throw new Error('User has already made a prediction for this match');
    }

    const predictedResultString = JSON.stringify(predicted_result);

    const query =
      'INSERT INTO predictions (id, user_id, prode_id, match_id, predicted_result) VALUES ($1, $2, $3, $4, $5)';
    const values = [id, user_id, prode_id, match_id, predictedResultString];
    await predictionPool.query(query, values);
  } catch (error) {
    console.error('Error saving prediction to database:', error);
    throw error;
  }
};

const getPredictionByUserAndMatch = async (user_id, match_id) => {
  try {
    const query =
      'SELECT * FROM predictions WHERE user_id = $1 AND match_id = $2';
    const { rows } = await predictionPool.query(query, [user_id, match_id]);
    return rows[0];
  } catch (error) {
    console.error('Error fetching prediction:', error);
    throw error;
  }
};

export const getPredictionForMatch = async (userId, matchId, prodeId) => {
  try {
    const result = await predictionPool.query(
      'SELECT * FROM predictions WHERE user_id = $1 AND match_id = $2 AND prode_id = $3',
      [userId, matchId, prodeId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching prediction:', error);
    throw error;
  }
};

export const updateUserPointsForProde = async (
  userId,
  prodeId,
  pointsToAdd
) => {
  try {
    await predictionPool.query(
      'INSERT INTO prode_points (user_id, prode_id, points) VALUES ($1, $2, $3) ON CONFLICT (user_id, prode_id) DO UPDATE SET points = prode_points.points + $3',
      [userId, prodeId, pointsToAdd]
    );
  } catch (error) {
    console.error('Error updating user points for prode:', error);
    throw error;
  }
};

export const markPointsAsAwarded = async (predictionId) => {
  try {
    await predictionPool.query(
      'UPDATE predictions SET points_awarded = TRUE WHERE id = $1',
      [predictionId]
    );
  } catch (error) {
    console.error('Error marking points as awarded:', error);
    throw error;
  }
};

export const getPointsForProde = async (prodeId) => {
  try {
    const result = await predictionPool.query(
      'SELECT * FROM prode_points WHERE prode_id = $1',
      [prodeId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching points for prode:', error);
    throw error;
  }
};

export default {
  createTournament,
  getTournament,
  getTournaments,
  createProde,
  getProdes,
  getProde,
  saveUserToDatabase,
  getUserById,
  deleteProde,
  joinProde,
  checkIfUserWithEmailExists,
  saveInvitationToken,
  verifyInvitationToken,
  getPublicProdes,
  getPrivateProdesForUser,
  getInvitationInfoByToken,
  checkIfUserAlreadyJoinedProde,
  savePredictionToDatabase,
  getPredictionForMatch,
  updateUserPointsForProde,
  markPointsAsAwarded,
  getPointsForProde,
};
