import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import api from './api/api';
import './style.css';

const statusLabels = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
const isAuth = () => !!localStorage.getItem('token');
function Protected({ children }) { return isAuth() ? children : <Navigate to="/login" />; }

function Auth({ mode }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault(); setError('');
    try {
      const url = mode === 'signup' ? '/auth/register' : '/auth/login';
      const payload = mode === 'signup' ? form : { email: form.email, password: form.password };
      const { data } = await api.post(url, payload);
      localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user));
      nav('/');
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong'); }
  }
  return <div className="auth-page"><form className="card auth" onSubmit={submit}>
    <h1>{mode === 'signup' ? 'Create account' : 'Login'}</h1>
    {error && <p className="error">{error}</p>}
    {mode === 'signup' && <input placeholder="Name" onChange={e => setForm({ ...form, name: e.target.value })} />}
    <input placeholder="Email" type="email" onChange={e => setForm({ ...form, email: e.target.value })} />
    <input placeholder="Password" type="password" onChange={e => setForm({ ...form, password: e.target.value })} />
    <button>{mode === 'signup' ? 'Signup' : 'Login'}</button>
    <p>{mode === 'signup' ? 'Already registered?' : 'New user?'} <Link to={mode === 'signup' ? '/login' : '/signup'}>{mode === 'signup' ? 'Login' : 'Signup'}</Link></p>
  </form></div>;
}

function Layout({ children }) {
  const nav = useNavigate(); const user = JSON.parse(localStorage.getItem('user') || '{}');
  return <><header><Link to="/" className="logo">Mini Project Management App</Link><span>{user.name}</span><button onClick={() => { localStorage.clear(); nav('/login'); }}>Logout</button></header><main>{children}</main></>;
}

function Dashboard() {
  const [projects, setProjects] = useState([]), [loading, setLoading] = useState(true), [form, setForm] = useState({ name: '', description: '' });
  async function load() { setLoading(true); const { data } = await api.get('/projects'); setProjects(data); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function add(e) { e.preventDefault(); if (!form.name || !form.description) return; await api.post('/projects', form); setForm({ name: '', description: '' }); load(); }
  async function del(id) { if (confirm('Delete this project?')) { await api.delete(`/projects/${id}`); load(); } }
  return <Layout><div className="top"><h1>Projects</h1></div>
    <form className="card form" onSubmit={add}><input placeholder="Project name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><button>Add Project</button></form>
    {loading ? <p>Loading...</p> : projects.length === 0 ? <p className="empty">No projects yet.</p> : <div className="grid">{projects.map(p => <div className="card project" key={p._id}><h2>{p.name}</h2><p>{p.description}</p><small>{p.taskCount} tasks • {new Date(p.createdAt).toLocaleDateString()}</small><div><Link className="btn" to={`/projects/${p._id}`}>Open</Link><button className="danger" onClick={()=>del(p._id)}>Delete</button></div></div>)}</div>}
  </Layout>;
}

function ProjectDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null), [search, setSearch] = useState(''), [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', status: 'todo' });
  async function load() { const res = await api.get(`/projects/${id}`); setData(res.data); }
  useEffect(() => { load(); }, [id]);
  async function add(e) { e.preventDefault(); if (!form.title) return; await api.post(`/projects/${id}/tasks`, form); setForm({ title:'', description:'', assignedTo:'', status:'todo' }); load(); }
  async function update(task, patch) { await api.put(`/tasks/${task._id}`, { ...task, ...patch }); load(); }
  async function del(tid) { await api.delete(`/tasks/${tid}`); load(); }
  if (!data) return <Layout><p>Loading...</p></Layout>;
  const tasks = data.tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase())).filter(t => filter === 'all' || t.status === filter);
  return <Layout><Link to="/">← Back</Link><h1>{data.project.name}</h1><p>{data.project.description}</p>
    <form className="card form" onSubmit={add}><input placeholder="Task title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><input placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><input placeholder="Assigned to" value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})}/><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option></select><button>Add Task</button></form>
    <div className="filters"><input placeholder="Search tasks..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All</option><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option></select></div>
    {tasks.length === 0 ? <p className="empty">No matching tasks.</p> : tasks.map(t => <TaskCard key={t._id} task={t} update={update} del={del}/>)}</Layout>;
}
function TaskCard({ task, update, del }) {
  const [edit, setEdit] = useState(false); const [f, setF] = useState(task);
  return <div className="card task">{edit ? <><input value={f.title} onChange={e=>setF({...f,title:e.target.value})}/><textarea value={f.description} onChange={e=>setF({...f,description:e.target.value})}/><input value={f.assignedTo || ''} onChange={e=>setF({...f,assignedTo:e.target.value})}/><button onClick={()=>{update(task,f);setEdit(false)}}>Save</button></> : <><h3>{task.title}</h3><p>{task.description}</p><small>Assigned: {task.assignedTo || 'N/A'} • {new Date(task.createdAt).toLocaleDateString()}</small></>}
    <select value={task.status} onChange={e=>update(task,{status:e.target.value})}><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option></select>
    <span className={'badge '+task.status}>{statusLabels[task.status]}</span><button onClick={()=>setEdit(!edit)}>Edit</button><button className="danger" onClick={()=>del(task._id)}>Delete</button></div>;
}
function App(){return <BrowserRouter><Routes><Route path="/login" element={<Auth mode="login"/>}/><Route path="/signup" element={<Auth mode="signup"/>}/><Route path="/" element={<Protected><Dashboard/></Protected>}/><Route path="/projects/:id" element={<Protected><ProjectDetail/></Protected>}/></Routes></BrowserRouter>}
createRoot(document.getElementById('root')).render(<App/>);
