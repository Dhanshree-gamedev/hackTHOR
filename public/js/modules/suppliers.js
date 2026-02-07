/**
 * Suppliers Module
 */

async function renderSuppliers() {
    const content = document.getElementById('contentArea');
    const result = await api.get('/suppliers');

    if (result.error) {
        content.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        return;
    }

    const suppliers = result.data.suppliers || [];

    content.innerHTML = `
        <div class="fade-in">
            <div class="table-container">
                <div class="table-header">
                    <h5 class="table-title">Suppliers</h5>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="showSupplierForm()">
                            <i class="bi bi-plus-lg me-1"></i> Add Supplier
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
                            ${suppliers.length === 0 ? `
                                <tr><td colspan="6" class="text-center py-4">No suppliers found</td></tr>
                            ` : suppliers.map(s => `
                                <tr>
                                    <td><strong>${s.name}</strong></td>
                                    <td>${s.email || '-'}</td>
                                    <td>${s.phone || '-'}</td>
                                    <td>${s.city || '-'}</td>
                                    <td>${getStatusBadge(s.status)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="showSupplierForm(${s.id})">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteSupplier(${s.id})">
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

async function showSupplierForm(supplierId = null) {
    let supplier = null;

    if (supplierId) {
        const result = await api.get(`/suppliers/${supplierId}`);
        if (result.error) {
            showToast(result.error, 'danger');
            return;
        }
        supplier = result.data.supplier;
    }

    const body = `
        <form id="supplierForm">
            <div class="mb-3">
                <label class="form-label">Name *</label>
                <input type="text" class="form-control" name="name" value="${supplier?.name || ''}" required>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" name="email" value="${supplier?.email || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Phone</label>
                    <input type="text" class="form-control" name="phone" value="${supplier?.phone || ''}">
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Address</label>
                <textarea class="form-control" name="address" rows="2">${supplier?.address || ''}</textarea>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">City</label>
                    <input type="text" class="form-control" name="city" value="${supplier?.city || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Country</label>
                    <input type="text" class="form-control" name="country" value="${supplier?.country || ''}">
                </div>
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveSupplier(${supplierId})">Save</button>
    `;

    showModal(supplierId ? 'Edit Supplier' : 'Add Supplier', body, footer);
}

async function saveSupplier(supplierId) {
    const form = document.getElementById('supplierForm');
    const formData = new FormData(form);

    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        country: formData.get('country')
    };

    const result = supplierId
        ? await api.put(`/suppliers/${supplierId}`, data)
        : await api.post('/suppliers', data);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    hideModal();
    showToast(supplierId ? 'Supplier updated' : 'Supplier created', 'success');
    renderSuppliers();
}

async function deleteSupplier(supplierId) {
    const confirmed = await showConfirm('Are you sure you want to deactivate this supplier?');
    if (!confirmed) return;

    const result = await api.delete(`/suppliers/${supplierId}`);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    showToast('Supplier deactivated', 'success');
    renderSuppliers();
}
