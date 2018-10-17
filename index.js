const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database/dbConfig.js');
const port = 9000;
const jwtSecret = 'nobody tosses a dwarf!';

const server = express();
server.use(express.json());
server.use(cors());

server.get('/', (req, res) => {
  res.send('Its Alive!');
});

// implemented this
server.post('/register', (req, res) => {
  const credentials = req.body;

  const hash = bcrypt.hashSync(credentials.password, 10);
  credentials.password = hash;

  db('users')
    .insert(credentials)
    .then(ids => {
      const id = ids[0];
      res.status(201).json({ newUserId: id });
    })
    .catch(err => {
      res.status(500).json(err);
    });
});

server.post('/login', (req, res) => {
  const creds = req.body;

  db('users')
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        const token = generateToken(user);
        res.status(200).json({ welcome: user.username, token });
      } else {
        res.status(401).json({ message: 'you shall not pass!' });
      }
    })
    .catch(err => {
      res.status(500).json({ err });
    });
});

// protect this route, only authenticated users should see it
server.get('/users', protected, (req, res) => {
  console.log('\n** decoded token information **\n', req.decodedToken);
  db('users')
    .select('id', 'username', 'password')
    .then(users => {
      res.json({ users });
    })
    .catch(err => res.send(err));
});

function generateToken(user) {
  const jwtPayload = {
    ...user,
    hello: 'FSW13',
    role: 'admin'
  };
  const jwtOptions = {
    expiresIn: '1m',
  }
  return jwt.sign(jwtPayload, jwtSecret, jwtOptions)
}

function protected(req, res, next) {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, jwtSecret, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token' })
      }
      else {
        req.decodedToken = decodedToken;
        next();
      }
    })
  }
  else {
    res.status(401).json({ message: 'No token provided!' })
  }
}

server.listen(port, () => console.log(`\nrunning on port ${port}\n`));