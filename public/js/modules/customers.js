/**
 * Customers Module
 */

async function renderCustomers() {
    const content = document.getElementById('contentArea');
    const result = await api.get('/customers');

    if (result.error) {
        content.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        return;
    }

    const customers = result.data.customers || [];

    content.innerHTML = `
        <div class="fade-in">
            <div class="table-container">
                <div class="table-header">
                    <h5 class="table-title">Customers</h5>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="showCustomerForm()">
                            <i class="bi bi-plus-lg me-1"></i> Add Customer
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>City</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customers.length === 0 ? `
                                <tr><td colspan="6" class="text-center py-4">No customers found</td></tr>
                            ` : customers.map(c => `
                                <tr>
                                    <td><strong>${c.name}</strong></td>
                                    <td>${c.email || '-'}</td>
                                    <td>${c.phone || '-'}</td>
                                    <td>${c.city || '-'}</td>
                                    <td>${getStatusBadge(c.status)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="showCustomerForm(${c.id})">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer(${c.id})">
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

async function showCustomerForm(customerId = null) {
    let customer = null;

    if (customerId) {
        const result = await api.get(`/customers/${customerId}`);
        if (result.error) {
            showToast(result.error, 'danger');
            return;
        }
        customer = result.data.customer;
    }

    const body = `
        <form id="customerForm">
            <div class="mb-3">
                <label class="form-label">Name *</label>
                <input type="text" class="form-control" name="name" value="${customer?.name || ''}" required>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" name="email" value="${customer?.email || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Phone</label>
                    <input type="text" class="form-control" name="phone" value="${customer?.phone || ''}">
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Address</label>
                <textarea class="form-control" name="address" rows="2">${customer?.address || ''}</textarea>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">City</label>
                    <input type="text" class="form-control" name="city" value="${customer?.city || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Country</label>
                    <input type="text" class="form-control" name="country" value="${customer?.country || ''}">
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Tax ID</label>
                <input type="text" class="form-control" name="tax_id" value="${customer?.tax_id || ''}">
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveCustomer(${customerId})">Save</button>
    `;

    showModal(customerId ? 'Edit Customer' : 'Add Customer', body, footer);
}

async function saveCustomer(customerId) {
    const form = document.getElementById('customerForm');
    const formData = new FormData(form);

    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        country: formData.get('country'),
        tax_id: formData.get('tax_id')
    };

    const result = customerId
        ? await api.put(`/customers/${customerId}`, data)
        : await api.post('/customers', data);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    hideModal();
    showToast(customerId ? 'Customer updated' : 'Customer created', 'success');
    renderCustomers();
}

async function deleteCustomer(customerId) {
    const confirmed = await showConfirm('Are you sure you want to deactivate this customer?');
    if (!confirmed) return;

    const result = await api.delete(`/customers/${customerId}`);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    showToast('Customer deactivated', 'success');
    renderCustomers();
}
