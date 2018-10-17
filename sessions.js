const express = require('express');
const helmet = require('helmet')
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./database/dbConfig.js');
const port = 9000
const server = express();

server.use(express.json());
server.use(helmet());
server.use(cors());

server.get('/', (req, res) => {
  res.send('Its Alive!');
});

server.post('/register', (req,res) => {
  const credentials = req.body;
  const hash = bcrypt.hashSync(credentials.password, 14);
  credentials.password = hash;
  db('users')
    .insert(credentials)
    .then(ids => {
      const id = ids[0];
      res.status(201).json({ newUserId: id });
    })
    .catch(err => res.status(500).json(err));
})

server.post('/login', (req, res) => {
  const creds = req.body;
  db('users')
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) return res.status(200).json({ Message: `Welcome ${user.username}!` });
      return res.status(401).json({ message: 'You shall not pass!' });
    })
    .catch(err => res.status(500).json({ err }));
})

server.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) return res.send('Error logging out!');
      return res.send('Goodbye!');
    })
  }
})

// protect this route, only authenticated users should see it
server.get('/users', (req, res) => {
  db('users')
    .select('id', 'username', 'password')
    .then(users => res.json(users))
    .catch(err => res.send(err));
});

server.listen(port, () => console.log(`\nrunning on ${port}\n`));
