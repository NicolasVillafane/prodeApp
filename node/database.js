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
    const { name, tournamentName, tournamentId } = body;
    prodePool.query(
      'INSERT INTO prodes (id, name, tournamentName, tournamentId) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, name, tournamentName, tournamentId],
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

export default {
  createTournament,
  getTournament,
  getTournaments,
  createProde,
  getProdes,
  getProde,
};
