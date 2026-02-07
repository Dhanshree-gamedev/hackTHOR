/**
 * Projects Module
 */

async function renderProjects() {
    const content = document.getElementById('contentArea');
    const result = await api.get('/projects');

    if (result.error) {
        content.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        return;
    }

    const projects = result.data.projects || [];

    content.innerHTML = `
        <div class="fade-in">
            <div class="table-container">
                <div class="table-header">
                    <h5 class="table-title">Projects</h5>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="showProjectForm()">
                            <i class="bi bi-plus-lg me-1"></i> New Project
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Manager</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Progress</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${projects.length === 0 ? `
                                <tr><td colspan="7" class="text-center py-4">No projects found</td></tr>
                            ` : projects.map(p => `
                                <tr>
                                    <td><strong>${p.name}</strong></td>
                                    <td>${p.manager_name || '-'}</td>
                                    <td>${formatDate(p.start_date)}</td>
                                    <td>${formatDate(p.end_date)}</td>
                                    <td>
                                        <div class="progress" style="height: 20px; min-width: 100px;">
                                            <div class="progress-bar" style="width: ${p.progress || 0}%">${p.progress || 0}%</div>
                                        </div>
                                    </td>
                                    <td>${getStatusBadge(p.status)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-info me-1" onclick="viewProjectTasks(${p.id}, '${p.name}')">
                                            <i class="bi bi-list-task"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-primary" onclick="showProjectForm(${p.id})">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

async function showProjectForm(projectId = null) {
    let project = null;
    const empResult = await api.get('/employees?status=active');
    const employees = empResult.data?.employees || [];

    if (projectId) {
        const result = await api.get(`/projects/${projectId}`);
        if (result.error) { showToast(result.error, 'danger'); return; }
        project = result.data.project;
    }

    const body = `
        <form id="projectForm">
            <div class="mb-3">
                <label class="form-label">Name *</label>
                <input type="text" class="form-control" name="name" value="${project?.name || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" name="description" rows="2">${project?.description || ''}</textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Manager</label>
                <select class="form-select" name="manager_id">
                    <option value="">Select Manager</option>
                    ${employees.map(e => `<option value="${e.id}" ${project?.manager_id == e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                </select>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-control" name="start_date" value="${project?.start_date || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">End Date</label>
                    <input type="date" class="form-control" name="end_date" value="${project?.end_date || ''}">
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Status</label>
                <select class="form-select" name="status">
                    <option value="planning" ${project?.status === 'planning' ? 'selected' : ''}>Planning</option>
                    <option value="in-progress" ${project?.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                    <option value="on-hold" ${project?.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
                    <option value="completed" ${project?.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
        </form>
    `;

    showModal(projectId ? 'Edit Project' : 'New Project', body, `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveProject(${projectId})">Save</button>
    `);
}

async function saveProject(projectId) {
    const form = document.getElementById('projectForm');
    const formData = new FormData(form);

    const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        manager_id: formData.get('manager_id') || null,
        start_date: formData.get('start_date') || null,
        end_date: formData.get('end_date') || null,
        status: formData.get('status')
    };

    const result = projectId ? await api.put(`/projects/${projectId}`, data) : await api.post('/projects', data);

    if (result.error) { showToast(result.error, 'danger'); return; }

    hideModal();
    showToast(projectId ? 'Project updated' : 'Project created', 'success');
    renderProjects();
}

async function viewProjectTasks(projectId, name) {
    const result = await api.get(`/projects/${projectId}/tasks`);
    const tasks = result.data?.tasks || [];
    const empResult = await api.get('/employees?status=active');
    const employees = empResult.data?.employees || [];

    const body = `
        <div class="mb-3">
            <button class="btn btn-sm btn-primary" onclick="showTaskForm(${projectId})">
                <i class="bi bi-plus-lg me-1"></i>Add Task
            </button>
        </div>
        <div id="tasksList">
            ${tasks.length === 0 ? '<p class="text-muted">No tasks yet</p>' : `
                <table class="table table-sm">
                    <thead><tr><th>Task</th><th>Assigned</th><th>Status</th><th>Due</th><th></th></tr></thead>
                    <tbody>
                        ${tasks.map(t => `
                            <tr>
                                <td>${t.title}</td>
                                <td>${t.assignee_name || '-'}</td>
                                <td>${getStatusBadge(t.status)}</td>
                                <td>${formatDate(t.due_date)}</td>
                                <td>
                                    <select class="form-select form-select-sm" style="width:auto" onchange="updateTaskStatus(${t.id}, this.value, ${projectId})">
                                        <option value="todo" ${t.status === 'todo' ? 'selected' : ''}>To Do</option>
                                        <option value="in-progress" ${t.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                                        <option value="review" ${t.status === 'review' ? 'selected' : ''}>Review</option>
                                        <option value="completed" ${t.status === 'completed' ? 'selected' : ''}>Completed</option>
                                    </select>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        </div>
        <div id="taskFormArea"></div>
    `;

    window._currentProjectEmployees = employees;
    showModal(`Tasks - ${name}`, body, '<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>');
}

function showTaskForm(projectId) {
    const employees = window._currentProjectEmployees || [];
    document.getElementById('taskFormArea').innerHTML = `
        <hr>
        <form id="taskForm">
            <div class="row">
                <div class="col-md-6 mb-2">
                    <input type="text" class="form-control form-control-sm" name="title" placeholder="Task title" required>
                </div>
                <div class="col-md-6 mb-2">
                    <select class="form-select form-select-sm" name="assigned_to">
                        <option value="">Assign to...</option>
                        ${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-2">
                    <input type="date" class="form-control form-control-sm" name="due_date">
                </div>
                <div class="col-md-6 mb-2">
                    <button type="button" class="btn btn-sm btn-success" onclick="saveTask(${projectId})">Save Task</button>
                </div>
            </div>
        </form>
    `;
}

async function saveTask(projectId) {
    const form = document.getElementById('taskForm');
    const formData = new FormData(form);

    const result = await api.post(`/projects/${projectId}/tasks`, {
        title: formData.get('title'),
        assigned_to: formData.get('assigned_to') || null,
        due_date: formData.get('due_date') || null
    });

    if (result.error) { showToast(result.error, 'danger'); return; }
    showToast('Task added', 'success');
    hideModal();
    setTimeout(() => viewProjectTasks(projectId, ''), 300);
}

async function updateTaskStatus(taskId, status, projectId) {
    await api.put(`/projects/tasks/${taskId}`, { status });
    showToast('Status updated', 'success');
}
