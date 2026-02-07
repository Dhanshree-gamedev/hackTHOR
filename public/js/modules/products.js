/**
 * Products Module
 */

async function renderProducts() {
    const content = document.getElementById('contentArea');
    const result = await api.get('/products');

    if (result.error) {
        content.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        return;
    }

    const products = result.data.products || [];

    content.innerHTML = `
        <div class="fade-in">
            <div class="table-container">
                <div class="table-header">
                    <h5 class="table-title">Products Inventory</h5>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="showProductForm()">
                            <i class="bi bi-plus-lg me-1"></i> Add Product
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Cost</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.length === 0 ? `
                                <tr><td colspan="8" class="text-center py-4">No products found</td></tr>
                            ` : products.map(p => `
                                <tr>
                                    <td><code>${p.sku}</code></td>
                                    <td><strong>${p.name}</strong></td>
                                    <td>${p.category || '-'}</td>
                                    <td>${formatCurrency(p.price)}</td>
                                    <td>${formatCurrency(p.cost)}</td>
                                    <td>
                                        <span class="${p.stock <= p.min_stock ? 'text-danger fw-bold' : ''}">
                                            ${p.stock} ${p.unit}
                                        </span>
                                        ${p.stock <= p.min_stock ? '<i class="bi bi-exclamation-triangle text-danger ms-1"></i>' : ''}
                                    </td>
                                    <td>${getStatusBadge(p.status)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-info me-1" onclick="showStockAdjust(${p.id}, '${p.name}', ${p.stock})">
                                            <i class="bi bi-box-arrow-in-down"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="showProductForm(${p.id})">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${p.id})">
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

async function showProductForm(productId = null) {
    let product = null;

    if (productId) {
        const result = await api.get(`/products/${productId}`);
        if (result.error) {
            showToast(result.error, 'danger');
            return;
        }
        product = result.data.product;
    }

    const body = `
        <form id="productForm">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">SKU *</label>
                    <input type="text" class="form-control" name="sku" value="${product?.sku || ''}" ${productId ? 'readonly' : 'required'}>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Name *</label>
                    <input type="text" class="form-control" name="name" value="${product?.name || ''}" required>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" name="description" rows="2">${product?.description || ''}</textarea>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Category</label>
                    <input type="text" class="form-control" name="category" value="${product?.category || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Unit</label>
                    <select class="form-select" name="unit">
                        <option value="pcs" ${product?.unit === 'pcs' ? 'selected' : ''}>Pieces</option>
                        <option value="kg" ${product?.unit === 'kg' ? 'selected' : ''}>Kilograms</option>
                        <option value="ltr" ${product?.unit === 'ltr' ? 'selected' : ''}>Liters</option>
                        <option value="box" ${product?.unit === 'box' ? 'selected' : ''}>Boxes</option>
                    </select>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Selling Price *</label>
                    <input type="number" class="form-control" name="price" value="${product?.price || 0}" required min="0" step="0.01">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Cost Price</label>
                    <input type="number" class="form-control" name="cost" value="${product?.cost || 0}" min="0" step="0.01">
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Initial Stock</label>
                    <input type="number" class="form-control" name="stock" value="${product?.stock || 0}" min="0" ${productId ? 'readonly' : ''}>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Minimum Stock Level</label>
                    <input type="number" class="form-control" name="min_stock" value="${product?.min_stock || 0}" min="0">
                </div>
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveProduct(${productId})">Save</button>
    `;

    showModal(productId ? 'Edit Product' : 'Add Product', body, footer);
}

async function saveProduct(productId) {
    const form = document.getElementById('productForm');
    const formData = new FormData(form);

    const data = {
        sku: formData.get('sku'),
        name: formData.get('name'),
        description: formData.get('description'),
        category: formData.get('category'),
        unit: formData.get('unit'),
        price: parseFloat(formData.get('price')),
        cost: parseFloat(formData.get('cost')),
        min_stock: parseInt(formData.get('min_stock'))
    };

    if (!productId) {
        data.stock = parseInt(formData.get('stock'));
    }

    const result = productId
        ? await api.put(`/products/${productId}`, data)
        : await api.post('/products', data);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    hideModal();
    showToast(productId ? 'Product updated' : 'Product created', 'success');
    renderProducts();
}

function showStockAdjust(productId, name, currentStock) {
    const body = `
        <form id="stockForm">
            <p>Current stock for <strong>${name}</strong>: ${currentStock}</p>
            <div class="mb-3">
                <label class="form-label">Adjustment (+ or -)</label>
                <input type="number" class="form-control" name="adjustment" value="0" required>
                <small class="text-muted">Positive to add, negative to subtract</small>
            </div>
            <div class="mb-3">
                <label class="form-label">Reason</label>
                <input type="text" class="form-control" name="reason" placeholder="e.g., Manual adjustment, Damage">
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="adjustStock(${productId})">Adjust</button>
    `;

    showModal('Adjust Stock', body, footer);
}

async function adjustStock(productId) {
    const form = document.getElementById('stockForm');
    const formData = new FormData(form);

    const result = await api.put(`/products/${productId}/stock`, {
        adjustment: parseInt(formData.get('adjustment')),
        reason: formData.get('reason')
    });

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    hideModal();
    showToast('Stock adjusted', 'success');
    renderProducts();
}

async function deleteProduct(productId) {
    const confirmed = await showConfirm('Are you sure you want to deactivate this product?');
    if (!confirmed) return;

    const result = await api.delete(`/products/${productId}`);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    showToast('Product deactivated', 'success');
    renderProducts();
}
