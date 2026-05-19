const router = require('express').Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');

router.use(auth);

router.get('/', async (req, res) => {
  const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
  const result = await Promise.all(projects.map(async p => ({
    ...p,
    id: p._id,
    taskCount: await Task.countDocuments({ projectId: p._id, user: req.user.id })
  })));
  res.json(result);
});

router.post('/', async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) return res.status(400).json({ message: 'Name and description are required' });
  const project = await Project.create({ name, description, user: req.user.id });
  res.status(201).json(project);
});

router.get('/:id', async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const tasks = await Task.find({ projectId: project._id, user: req.user.id }).sort({ createdAt: -1 });
  res.json({ project, tasks });
});

router.put('/:id', async (req, res) => {
  const project = await Project.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true, runValidators: true });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

router.delete('/:id', async (req, res) => {
  const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  await Task.deleteMany({ projectId: req.params.id, user: req.user.id });
  res.json({ message: 'Project and tasks deleted' });
});

router.post('/:id/tasks', async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const { title, description, status, assignedTo } = req.body;
  if (!title) return res.status(400).json({ message: 'Task title is required' });
  const task = await Task.create({ projectId: req.params.id, title, description, status, assignedTo, user: req.user.id });
  res.status(201).json(task);
});
module.exports = router;
