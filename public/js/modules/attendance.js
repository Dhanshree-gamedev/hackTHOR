/**
 * Attendance Module
 */

async function renderAttendance() {
    const content = document.getElementById('contentArea');
    const today = new Date().toISOString().split('T')[0];

    const result = await api.get(`/attendance?start_date=${today}&end_date=${today}`);

    content.innerHTML = `
        <div class="fade-in">
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-calendar-check me-2"></i>Today's Attendance</span>
                    <button class="btn btn-primary btn-sm" onclick="showBulkAttendanceForm()">
                        <i class="bi bi-plus-lg me-1"></i> Mark Attendance
                    </button>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <input type="date" class="form-control" id="attendanceDate" value="${today}" onchange="loadAttendanceByDate()">
                        </div>
                    </div>
                    <div id="attendanceTable">
                        ${renderAttendanceTable(result.data?.attendance || [])}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderAttendanceTable(records) {
    if (records.length === 0) {
        return '<p class="text-muted text-center">No attendance records for this date</p>';
    }

    return `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(r => `
                        <tr>
                            <td>${r.employee_name}</td>
                            <td>${r.department}</td>
                            <td>${r.check_in || '-'}</td>
                            <td>${r.check_out || '-'}</td>
                            <td>${getStatusBadge(r.status)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function loadAttendanceByDate() {
    const date = document.getElementById('attendanceDate').value;
    const result = await api.get(`/attendance?start_date=${date}&end_date=${date}`);
    document.getElementById('attendanceTable').innerHTML = renderAttendanceTable(result.data?.attendance || []);
}

async function showBulkAttendanceForm() {
    const empResult = await api.get('/employees');
    const employees = empResult.data?.employees?.filter(e => e.status === 'active') || [];

    const today = new Date().toISOString().split('T')[0];

    const body = `
        <form id="bulkAttendanceForm">
            <div class="mb-3">
                <label class="form-label">Date *</label>
                <input type="date" class="form-control" name="date" value="${today}" required>
            </div>
            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                <table class="table table-sm">
                    <thead class="sticky-top bg-white">
                        <tr>
                            <th>Employee</th>
                            <th>Status</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employees.map(e => `
                            <tr>
                                <td>${e.name}<br><small class="text-muted">${e.department}</small></td>
                                <td>
                                    <select class="form-select form-select-sm" name="status_${e.id}">
                                        <option value="present">Present</option>
                                        <option value="absent">Absent</option>
                                        <option value="late">Late</option>
                                        <option value="half-day">Half Day</option>
                                        <option value="leave">Leave</option>
                                    </select>
                                </td>
                                <td><input type="time" class="form-control form-control-sm" name="check_in_${e.id}" value="09:00"></td>
                                <td><input type="time" class="form-control form-control-sm" name="check_out_${e.id}" value="18:00"></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveBulkAttendance([${employees.map(e => e.id).join(',')}])">Save All</button>
    `;

    showModal('Mark Attendance', body, footer);
}

async function saveBulkAttendance(employeeIds) {
    const form = document.getElementById('bulkAttendanceForm');
    const formData = new FormData(form);
    const date = formData.get('date');

    const records = employeeIds.map(id => ({
        employee_id: id,
        status: formData.get(`status_${id}`),
        check_in: formData.get(`check_in_${id}`),
        check_out: formData.get(`check_out_${id}`)
    }));

    const result = await api.post('/attendance/bulk', { date, records });

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    hideModal();
    showToast('Attendance saved successfully', 'success');
    renderAttendance();
}
