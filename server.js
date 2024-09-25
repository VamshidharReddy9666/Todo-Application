const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jwt-simple');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db'); // Adjust based on your db.js path
const authMiddleware = require('./authMiddleware'); // Adjust based on your authMiddleware path

const app = express();
const PORT = 5000;
const secret = 'my_secret_key';

app.use(cors());
app.use(bodyParser.json());

// Utility function to generate JWT token
const createToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
  };
  return jwt.encode(payload, secret);
};

// =======================================
//            Authentication Routes
// =======================================

// Signup route
app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = uuidv4();

  db.run(
    `INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)`,
    [id, name, email, hashedPassword],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(201).json({ message: 'User created successfully' });
    }
  );
});

// Login route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);

    if (isMatch) {
      const token = createToken(user);
      res.json({ token });
    } else {
      res.status(400).json({ error: 'Invalid email or password' });
    }
  });
});

// =======================================
//              Todo Routes
// =======================================

// Protected route to get user-specific todos
app.get('/api/todos', authMiddleware, (req, res) => {
  db.all(`SELECT * FROM todos WHERE userId = ?`, [req.userId], (err, todos) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch todos' });
    }
    res.json(todos);
  });
});

// Create new todo
app.post('/api/todos', authMiddleware, (req, res) => {
  const { title, status } = req.body;
  const id = uuidv4();
  
  db.run(
    `INSERT INTO todos (id, userId, title, status) VALUES (?, ?, ?, ?)`,
    [id, req.userId, title, status],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add todo' });
      }
      res.status(201).json({ message: 'Todo added successfully' });
    }
  );
});

// Update a todo
app.put('/api/todos/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, status } = req.body;

  db.run(
    `UPDATE todos SET title = ?, status = ? WHERE id = ? AND userId = ?`,
    [title, status, id, req.userId],
    function (err) {
      if (err || this.changes === 0) {
        return res.status(400).json({ error: 'Failed to update todo or not authorized' });
      }
      res.json({ message: 'Todo updated successfully' });
    }
  );
});

// Delete a todo
app.delete('/api/todos/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.run(
    `DELETE FROM todos WHERE id = ? AND userId = ?`,
    [id, req.userId],
    function (err) {
      if (err || this.changes === 0) {
        return res.status(400).json({ error: 'Failed to delete todo or not authorized' });
      }
      res.json({ message: 'Todo deleted successfully' });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});