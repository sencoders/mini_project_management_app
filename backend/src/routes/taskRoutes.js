const router = require('express').Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
router.use(auth);

router.put('/:id', async (req, res) => {
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true, runValidators: true });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
});

router.delete('/:id', async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ message: 'Task deleted' });
});
module.exports = router;
