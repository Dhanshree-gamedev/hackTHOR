/**
 * Users Module
 */

async function renderUsers() {
    const content = document.getElementById('contentArea');

    const result = await api.get('/users');

    if (result.error) {
        content.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        return;
    }

    const users = result.data.users || [];

    content.innerHTML = `
        <div class="fade-in">
            <div class="table-container">
                <div class="table-header">
                    <h5 class="table-title">All Users</h5>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="showUserForm()">
                            <i class="bi bi-plus-lg me-1"></i> Add User
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.length === 0 ? `
                                <tr><td colspan="6" class="text-center py-4">No users found</td></tr>
                            ` : users.map(u => `
                                <tr>
                                    <td><strong>${u.name}</strong></td>
                                    <td>${u.email}</td>
                                    <td>${u.role}</td>
                                    <td>${getStatusBadge(u.status)}</td>
                                    <td>${formatDate(u.created_at)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="showUserForm(${u.id})">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${u.id})">
                                            <i class="bi bi-trash"></i>
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

async function showUserForm(userId = null) {
    let user = null;

    if (userId) {
        const result = await api.get(`/users/${userId}`);
        if (result.error) {
            showToast(result.error, 'danger');
            return;
        }
        user = result.data.user;
    }

    const roles = ['Admin', 'Sales Officer', 'Inventory Officer', 'HR Officer', 'Finance Officer', 'Project Manager', 'Employee'];

    const body = `
        <form id="userForm">
            <div class="mb-3">
                <label class="form-label">Name *</label>
                <input type="text" class="form-control" name="name" value="${user?.name || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Email *</label>
                <input type="email" class="form-control" name="email" value="${user?.email || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Password ${userId ? '(leave blank to keep current)' : '*'}</label>
                <input type="password" class="form-control" name="password" ${userId ? '' : 'required'}>
            </div>
            <div class="mb-3">
                <label class="form-label">Role *</label>
                <select class="form-select" name="role" required>
                    ${roles.map(r => `<option value="${r}" ${user?.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Status</label>
                <select class="form-select" name="status">
                    <option value="active" ${user?.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${user?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveUser(${userId})">Save</button>
    `;

    showModal(userId ? 'Edit User' : 'Add User', body, footer);
}

async function saveUser(userId) {
    const form = document.getElementById('userForm');
    const formData = new FormData(form);

    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
        status: formData.get('status')
    };

    if (formData.get('password')) {
        data.password = formData.get('password');
    }

    const result = userId
        ? await api.put(`/users/${userId}`, data)
        : await api.post('/users', data);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    hideModal();
    showToast(userId ? 'User updated successfully' : 'User created successfully', 'success');
    renderUsers();
}

async function deleteUser(userId) {
    const confirmed = await showConfirm('Are you sure you want to deactivate this user?');
    if (!confirmed) return;

    const result = await api.delete(`/users/${userId}`);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    showToast('User deactivated successfully', 'success');
    renderUsers();
}
