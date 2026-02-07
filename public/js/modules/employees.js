/**
 * Employees Module
 */

async function renderEmployees() {
    const content = document.getElementById('contentArea');

    const result = await api.get('/employees');

    if (result.error) {
        content.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        return;
    }

    const employees = result.data.employees || [];

    content.innerHTML = `
        <div class="fade-in">
            <div class="table-container">
                <div class="table-header">
                    <h5 class="table-title">All Employees</h5>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="showEmployeeForm()">
                            <i class="bi bi-plus-lg me-1"></i> Add Employee
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Salary</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${employees.length === 0 ? `
                                <tr><td colspan="7" class="text-center py-4">No employees found</td></tr>
                            ` : employees.map(e => `
                                <tr>
                                    <td><code>${e.employee_code}</code></td>
                                    <td><strong>${e.name}</strong></td>
                                    <td>${e.email}</td>
                                    <td>${e.department}</td>
                                    <td>${formatCurrency(e.salary)}</td>
                                    <td>${getStatusBadge(e.status)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="showEmployeeForm(${e.id})">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${e.id})">
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

async function showEmployeeForm(employeeId = null) {
    let employee = null;

    if (employeeId) {
        const result = await api.get(`/employees/${employeeId}`);
        if (result.error) {
            showToast(result.error, 'danger');
            return;
        }
        employee = result.data.employee;
    }

    const body = `
        <form id="employeeForm">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Employee Code *</label>
                    <input type="text" class="form-control" name="employee_code" value="${employee?.employee_code || ''}" ${employeeId ? 'readonly' : 'required'}>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Name *</label>
                    <input type="text" class="form-control" name="name" value="${employee?.name || ''}" required>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Email *</label>
                    <input type="email" class="form-control" name="email" value="${employee?.email || ''}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Phone</label>
                    <input type="text" class="form-control" name="phone" value="${employee?.phone || ''}">
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Department *</label>
                    <select class="form-select" name="department" required>
                        <option value="">Select Department</option>
                        <option value="Administration" ${employee?.department === 'Administration' ? 'selected' : ''}>Administration</option>
                        <option value="Sales" ${employee?.department === 'Sales' ? 'selected' : ''}>Sales</option>
                        <option value="Finance" ${employee?.department === 'Finance' ? 'selected' : ''}>Finance</option>
                        <option value="HR" ${employee?.department === 'HR' ? 'selected' : ''}>HR</option>
                        <option value="IT" ${employee?.department === 'IT' ? 'selected' : ''}>IT</option>
                        <option value="Operations" ${employee?.department === 'Operations' ? 'selected' : ''}>Operations</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Designation</label>
                    <input type="text" class="form-control" name="designation" value="${employee?.designation || ''}">
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Salary *</label>
                    <input type="number" class="form-control" name="salary" value="${employee?.salary || 0}" required min="0" step="0.01">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Hire Date</label>
                    <input type="date" class="form-control" name="hire_date" value="${employee?.hire_date || ''}">
                </div>
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveEmployee(${employeeId})">Save</button>
    `;

    showModal(employeeId ? 'Edit Employee' : 'Add Employee', body, footer);
}

async function saveEmployee(employeeId) {
    const form = document.getElementById('employeeForm');
    const formData = new FormData(form);

    const data = {
        employee_code: formData.get('employee_code'),
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        department: formData.get('department'),
        designation: formData.get('designation'),
        salary: parseFloat(formData.get('salary')),
        hire_date: formData.get('hire_date') || null
    };

    const result = employeeId
        ? await api.put(`/employees/${employeeId}`, data)
        : await api.post('/employees', data);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    hideModal();
    showToast(employeeId ? 'Employee updated' : 'Employee created', 'success');
    renderEmployees();
}

async function deleteEmployee(employeeId) {
    const confirmed = await showConfirm('Are you sure you want to terminate this employee?');
    if (!confirmed) return;

    const result = await api.delete(`/employees/${employeeId}`);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    showToast('Employee terminated', 'success');
    renderEmployees();
}
