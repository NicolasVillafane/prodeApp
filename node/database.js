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

export const saveInvitationToken = async (
  prodeId,
  token,
  receiverEmail,
  selectedUser
) => {
  try {
    await invitationPool.query(
      'INSERT INTO invitations (prode_id, token, receiver_email, selected_user) VALUES ($1, $2, $3, $4)',
      [prodeId, token, receiverEmail, selectedUser]
    );
  } catch (error) {
    console.error('Error saving invitation token:', error);
    throw error;
  }
};

export const verifyInvitationToken = async (prodeId, token, selectedUser) => {
  try {
    const result = await invitationPool.query(
      'SELECT * FROM invitations WHERE prode_id = $1 AND token = $2 AND selected_user = $3',
      [prodeId, token, selectedUser]
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
    } = body;
    prodePool.query(
      'INSERT INTO prodes (id, name, tournamentName, tournamentId, isPublic, author_id, author_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, name, tournamentName, tournamentId, isPublic, authorId, authorName],
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
  console.log('hello');
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

export const joinProde = async (prodeId, userId, username) => {
  try {
    await prodePool.query(
      'UPDATE prodes SET joined_users_info = joined_users_info || $1 WHERE id = $2',
      [{ id: userId, username: username }, prodeId]
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
};
