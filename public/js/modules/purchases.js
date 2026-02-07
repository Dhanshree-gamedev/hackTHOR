/**
 * Purchases Module
 */

async function renderPurchases() {
    const content = document.getElementById('contentArea');
    const result = await api.get('/purchases/orders');

    if (result.error) {
        content.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        return;
    }

    const orders = result.data.orders || [];

    content.innerHTML = `
        <div class="fade-in">
            <div class="table-container">
                <div class="table-header">
                    <h5 class="table-title">Purchase Orders</h5>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="showPurchaseOrderForm()">
                            <i class="bi bi-plus-lg me-1"></i> New PO
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>PO #</th>
                                <th>Supplier</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.length === 0 ? `
                                <tr><td colspan="6" class="text-center py-4">No purchase orders found</td></tr>
                            ` : orders.map(o => `
                                <tr>
                                    <td><code>${o.order_number}</code></td>
                                    <td>${o.supplier_name}</td>
                                    <td>${formatDate(o.order_date)}</td>
                                    <td><strong>${formatCurrency(o.total)}</strong></td>
                                    <td>${getStatusBadge(o.status)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-info me-1" onclick="viewPurchaseOrder(${o.id})">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                        ${o.status === 'pending' || o.status === 'confirmed' ? `
                                            <button class="btn btn-sm btn-success" onclick="receivePurchaseOrder(${o.id})">
                                                <i class="bi bi-box-arrow-in-down me-1"></i>Receive
                                            </button>
                                        ` : ''}
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

async function showPurchaseOrderForm() {
    const [suppResult, prodResult] = await Promise.all([
        api.get('/suppliers?status=active'),
        api.get('/products?status=active')
    ]);

    const suppliers = suppResult.data?.suppliers || [];
    const products = prodResult.data?.products || [];

    const body = `
        <form id="purchaseOrderForm">
            <div class="mb-3">
                <label class="form-label">Supplier *</label>
                <select class="form-select" name="supplier_id" required>
                    <option value="">Select Supplier</option>
                    ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                </select>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Order Items</label>
                <div id="poItems">
                    <div class="po-item row mb-2">
                        <div class="col-md-5">
                            <select class="form-select form-select-sm po-product-select" onchange="updatePOItemCost(this)">
                                <option value="">Select Product</option>
                                ${products.map(p => `<option value="${p.id}" data-cost="${p.cost}">${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-2">
                            <input type="number" class="form-control form-control-sm po-qty-input" placeholder="Qty" min="1" value="1">
                        </div>
                        <div class="col-md-3">
                            <input type="number" class="form-control form-control-sm po-cost-input" placeholder="Cost" step="0.01">
                        </div>
                        <div class="col-md-2">
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removePOItem(this)">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="addPOItem()">
                    <i class="bi bi-plus-lg me-1"></i>Add Item
                </button>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Tax</label>
                <input type="number" class="form-control" name="tax" value="0" min="0" step="0.01">
            </div>
            
            <div class="mb-3">
                <label class="form-label">Notes</label>
                <textarea class="form-control" name="notes" rows="2"></textarea>
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="savePurchaseOrder()">Create PO</button>
    `;

    showModal('New Purchase Order', body, footer);
}

function updatePOItemCost(select) {
    const row = select.closest('.po-item');
    const option = select.options[select.selectedIndex];
    const cost = option.dataset.cost || 0;
    row.querySelector('.po-cost-input').value = cost;
}

function addPOItem() {
    const container = document.getElementById('poItems');
    const firstItem = container.querySelector('.po-item');
    const newItem = firstItem.cloneNode(true);
    newItem.querySelector('.po-product-select').value = '';
    newItem.querySelector('.po-qty-input').value = 1;
    newItem.querySelector('.po-cost-input').value = '';
    container.appendChild(newItem);
}

function removePOItem(btn) {
    const container = document.getElementById('poItems');
    if (container.children.length > 1) {
        btn.closest('.po-item').remove();
    }
}

async function savePurchaseOrder() {
    const form = document.getElementById('purchaseOrderForm');
    const formData = new FormData(form);

    const items = [];
    document.querySelectorAll('.po-item').forEach(row => {
        const productId = row.querySelector('.po-product-select').value;
        const qty = parseInt(row.querySelector('.po-qty-input').value);
        const cost = parseFloat(row.querySelector('.po-cost-input').value);

        if (productId && qty > 0) {
            items.push({
                product_id: parseInt(productId),
                quantity: qty,
                unit_cost: cost
            });
        }
    });

    if (items.length === 0) {
        showToast('Please add at least one item', 'warning');
        return;
    }

    const data = {
        supplier_id: parseInt(formData.get('supplier_id')),
        items,
        tax: parseFloat(formData.get('tax')) || 0,
        notes: formData.get('notes')
    };

    const result = await api.post('/purchases/orders', data);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    hideModal();
    showToast('Purchase order created', 'success');
    renderPurchases();
}

async function viewPurchaseOrder(orderId) {
    const result = await api.get(`/purchases/orders/${orderId}`);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    const { order, items } = result.data;

    const body = `
        <div class="row mb-3">
            <div class="col-md-6">
                <p><strong>PO:</strong> ${order.order_number}</p>
                <p><strong>Supplier:</strong> ${order.supplier_name}</p>
                <p><strong>Date:</strong> ${formatDate(order.order_date)}</p>
            </div>
            <div class="col-md-6 text-end">
                <p><strong>Status:</strong> ${getStatusBadge(order.status)}</p>
            </div>
        </div>
        <table class="table table-sm">
            <thead>
                <tr><th>Product</th><th>Qty</th><th>Cost</th><th>Total</th></tr>
            </thead>
            <tbody>
                ${items.map(i => `
                    <tr>
                        <td>${i.product_name}</td>
                        <td>${i.quantity}</td>
                        <td>${formatCurrency(i.unit_cost)}</td>
                        <td>${formatCurrency(i.total)}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr><td colspan="3" class="text-end">Subtotal:</td><td>${formatCurrency(order.subtotal)}</td></tr>
                <tr><td colspan="3" class="text-end">Tax:</td><td>${formatCurrency(order.tax)}</td></tr>
                <tr class="table-primary"><td colspan="3" class="text-end"><strong>Total:</strong></td><td><strong>${formatCurrency(order.total)}</strong></td></tr>
            </tfoot>
        </table>
    `;

    showModal(`PO ${order.order_number}`, body, '<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>');
}

async function receivePurchaseOrder(orderId) {
    const confirmed = await showConfirm('Mark as received? This will add stock and record an expense.');
    if (!confirmed) return;

    const result = await api.put(`/purchases/orders/${orderId}/receive`);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    showToast('Goods received! Stock updated.', 'success');
    renderPurchases();
}
