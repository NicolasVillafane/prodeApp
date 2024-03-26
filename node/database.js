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
    const id = uuid();
    const {
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
    // Execute the query to fetch the user by ID
    userPool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId],
      (error, result) => {
        if (error) {
          // If there's an error, reject the promise with the error object
          reject(error);
        } else {
          // Check if the query returned any rows
          if (result.rows.length > 0) {
            // Resolve the promise with the first row (assuming user ID is unique)
            resolve(result.rows[0]);
          } else {
            // If no rows were returned, the user doesn't exist, so resolve with null
            resolve(null);
          }
        }
      }
    );
  });
};

export const joinProde = async (prodeId, userId, username) => {
  try {
    // Update the prode table to include the joined user
    await prodePool.query(
      'UPDATE prodes SET joined_users_info = joined_users_info || $1 WHERE id = $2',
      [{ id: userId, username: username }, prodeId]
    );

    // Return success message
    return { success: true };
  } catch (error) {
    // Return error if any
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
};
