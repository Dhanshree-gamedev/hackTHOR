/**
 * Payroll Module
 */

async function renderPayroll() {
    const content = document.getElementById('contentArea');

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await api.get(`/payroll?month=${month}&year=${year}`);

    content.innerHTML = `
        <div class="fade-in">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-cash-stack me-2"></i>Payroll</span>
                    <button class="btn btn-primary btn-sm" onclick="showGeneratePayrollForm()">
                        <i class="bi bi-calculator me-1"></i> Generate Payroll
                    </button>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-3">
                            <select class="form-select" id="payrollMonth" onchange="loadPayroll()">
                                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => `
                                    <option value="${m}" ${m === month ? 'selected' : ''}>
                                        ${new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="payrollYear" onchange="loadPayroll()">
                                ${[year - 1, year, year + 1].map(y => `
                                    <option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div id="payrollTable">
                        ${renderPayrollTable(result.data?.payroll || [])}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPayrollTable(records) {
    if (records.length === 0) {
        return '<p class="text-muted text-center py-4">No payroll records for this period</p>';
    }

    return `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Basic Salary</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(r => `
                        <tr>
                            <td>${r.employee_name}</td>
                            <td>${r.department}</td>
                            <td>${formatCurrency(r.basic_salary)}</td>
                            <td class="text-danger">${formatCurrency(r.deductions)}</td>
                            <td><strong>${formatCurrency(r.net_salary)}</strong></td>
                            <td>${getStatusBadge(r.status)}</td>
                            <td>
                                ${r.status === 'pending' ? `
                                    <button class="btn btn-sm btn-success" onclick="markPayrollPaid(${r.id})">
                                        <i class="bi bi-check-lg me-1"></i>Pay
                                    </button>
                                ` : `
                                    <span class="text-success"><i class="bi bi-check-circle"></i> Paid</span>
                                `}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr class="table-light">
                        <td colspan="4"><strong>Total</strong></td>
                        <td><strong>${formatCurrency(records.reduce((sum, r) => sum + r.net_salary, 0))}</strong></td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
}

async function loadPayroll() {
    const month = document.getElementById('payrollMonth').value;
    const year = document.getElementById('payrollYear').value;

    const result = await api.get(`/payroll?month=${month}&year=${year}`);
    document.getElementById('payrollTable').innerHTML = renderPayrollTable(result.data?.payroll || []);
}

async function showGeneratePayrollForm() {
    const now = new Date();

    const body = `
        <form id="generatePayrollForm">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Month *</label>
                    <select class="form-select" name="month" required>
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => `
                            <option value="${m}" ${m === now.getMonth() + 1 ? 'selected' : ''}>
                                ${new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Year *</label>
                    <input type="number" class="form-control" name="year" value="${now.getFullYear()}" required>
                </div>
            </div>
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                This will calculate salaries based on attendance for all active employees.
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="generatePayroll()">Generate</button>
    `;

    showModal('Generate Payroll', body, footer);
}

async function generatePayroll() {
    const form = document.getElementById('generatePayrollForm');
    const formData = new FormData(form);

    const result = await api.post('/payroll/generate', {
        month: parseInt(formData.get('month')),
        year: parseInt(formData.get('year'))
    });

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    hideModal();
    showToast(result.data.message, 'success');
    renderPayroll();
}

async function markPayrollPaid(payrollId) {
    const confirmed = await showConfirm('Mark this payroll as paid? This will record an expense in the ledger.');
    if (!confirmed) return;

    const result = await api.put(`/payroll/${payrollId}/pay`);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    showToast('Payroll marked as paid', 'success');
    loadPayroll();
}
