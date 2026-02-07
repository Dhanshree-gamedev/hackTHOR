const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticate);
router.use(requireRole('Admin', 'Project Manager'));

// GET all projects
router.get('/', (req, res) => {
    try {
        const { status } = req.query;
        let sql = `SELECT p.*, u.name as manager_name FROM projects p LEFT JOIN users u ON p.manager_id = u.id WHERE 1=1`;
        if (status) sql += ` AND p.status = '${status}'`;
        sql += ' ORDER BY p.created_at DESC';
        res.json({ projects: query(sql) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// GET project by ID
router.get('/:id', (req, res) => {
    try {
        const project = queryOne(`SELECT p.*, u.name as manager_name FROM projects p LEFT JOIN users u ON p.manager_id = u.id WHERE p.id = ?`, [req.params.id]);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// POST create project
router.post('/', (req, res) => {
    try {
        const { name, description, manager_id, start_date, end_date, budget, status } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });

        run(`INSERT INTO projects (name, description, manager_id, start_date, end_date, budget, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description || null, manager_id || null, start_date || null, end_date || null, budget || 0, status || 'planning']);
        res.status(201).json({ message: 'Project created' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// PUT update project
router.put('/:id', (req, res) => {
    try {
        const { name, description, manager_id, start_date, end_date, budget, status } = req.body;
        const proj = queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        if (!proj) return res.status(404).json({ error: 'Project not found' });

        run(`UPDATE projects SET name = ?, description = ?, manager_id = ?, start_date = ?, end_date = ?, budget = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
            [name || proj.name, description ?? proj.description, manager_id ?? proj.manager_id, start_date ?? proj.start_date, end_date ?? proj.end_date, budget ?? proj.budget, status || proj.status, req.params.id]);
        res.json({ message: 'Project updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// GET project tasks
router.get('/:id/tasks', (req, res) => {
    try {
        const tasks = query(`SELECT t.*, e.name as assignee_name FROM tasks t LEFT JOIN employees e ON t.assigned_to = e.id WHERE t.project_id = ? ORDER BY t.created_at`, [req.params.id]);
        res.json({ tasks });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST create task
router.post('/:id/tasks', (req, res) => {
    try {
        const { title, description, assigned_to, priority, due_date } = req.body;
        if (!title) return res.status(400).json({ error: 'Title required' });

        run(`INSERT INTO tasks (project_id, title, description, assigned_to, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)`,
            [req.params.id, title, description || null, assigned_to || null, priority || 'medium', due_date || null]);

        updateProjectProgress(req.params.id);
        res.status(201).json({ message: 'Task created' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT update task
router.put('/tasks/:taskId', (req, res) => {
    try {
        const task = queryOne('SELECT * FROM tasks WHERE id = ?', [req.params.taskId]);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const { title, description, assigned_to, priority, status, due_date } = req.body;
        let completedAt = task.completed_at;
        if (status === 'completed' && task.status !== 'completed') completedAt = new Date().toISOString();

        run(`UPDATE tasks SET title = ?, description = ?, assigned_to = ?, priority = ?, status = ?, due_date = ?, completed_at = ?, updated_at = datetime('now') WHERE id = ?`,
            [title || task.title, description ?? task.description, assigned_to ?? task.assigned_to, priority || task.priority, status || task.status, due_date ?? task.due_date, completedAt, req.params.taskId]);

        updateProjectProgress(task.project_id);
        res.json({ message: 'Task updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

function updateProjectProgress(projectId) {
    const total = queryOne('SELECT COUNT(*) as cnt FROM tasks WHERE project_id = ?', [projectId]);
    const completed = queryOne('SELECT COUNT(*) as cnt FROM tasks WHERE project_id = ? AND status = ?', [projectId, 'completed']);
    const progress = total?.cnt > 0 ? Math.round((completed?.cnt / total?.cnt) * 100) : 0;
    run('UPDATE projects SET progress = ?, updated_at = datetime(\'now\') WHERE id = ?', [progress, projectId]);
}

module.exports = router;
