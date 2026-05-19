const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

console.log(process.env.MONGO_URI);

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
// 
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://mini-project-management-app.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Mini Project Management API running' }));
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`Server running on ${PORT}`)))
  .catch(err => console.error('MongoDB connection error:', err.message));
