/**
 * Sales Module
 */

async function renderSales() {
    const content = document.getElementById('contentArea');
    const result = await api.get('/sales/orders');

    if (result.error) {
        content.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        return;
    }

    const orders = result.data.orders || [];

    content.innerHTML = `
        <div class="fade-in">
            <div class="table-container">
                <div class="table-header">
                    <h5 class="table-title">Sales Orders</h5>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="showSalesOrderForm()">
                            <i class="bi bi-plus-lg me-1"></i> New Order
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.length === 0 ? `
                                <tr><td colspan="6" class="text-center py-4">No orders found</td></tr>
                            ` : orders.map(o => `
                                <tr>
                                    <td><code>${o.order_number}</code></td>
                                    <td>${o.customer_name}</td>
                                    <td>${formatDate(o.order_date)}</td>
                                    <td><strong>${formatCurrency(o.total)}</strong></td>
                                    <td>${getStatusBadge(o.status)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-info me-1" onclick="viewSalesOrder(${o.id})">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                        ${o.status === 'pending' ? `
                                            <button class="btn btn-sm btn-success" onclick="confirmSalesOrder(${o.id})">
                                                <i class="bi bi-check-lg me-1"></i>Confirm
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

async function showSalesOrderForm() {
    const [custResult, prodResult] = await Promise.all([
        api.get('/customers?status=active'),
        api.get('/products?status=active')
    ]);

    const customers = custResult.data?.customers || [];
    const products = prodResult.data?.products || [];

    const body = `
        <form id="salesOrderForm">
            <div class="mb-3">
                <label class="form-label">Customer *</label>
                <select class="form-select" name="customer_id" required>
                    <option value="">Select Customer</option>
                    ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Order Items</label>
                <div id="orderItems">
                    <div class="order-item row mb-2">
                        <div class="col-md-5">
                            <select class="form-select form-select-sm product-select" onchange="updateItemPrice(this)">
                                <option value="">Select Product</option>
                                ${products.map(p => `<option value="${p.id}" data-price="${p.price}" data-stock="${p.stock}">${p.name} (Stock: ${p.stock})</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-2">
                            <input type="number" class="form-control form-control-sm qty-input" placeholder="Qty" min="1" value="1">
                        </div>
                        <div class="col-md-3">
                            <input type="number" class="form-control form-control-sm price-input" placeholder="Price" step="0.01" readonly>
                        </div>
                        <div class="col-md-2">
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeOrderItem(this)">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="addOrderItem()">
                    <i class="bi bi-plus-lg me-1"></i>Add Item
                </button>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tax</label>
                    <input type="number" class="form-control" name="tax" value="0" min="0" step="0.01">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Discount</label>
                    <input type="number" class="form-control" name="discount" value="0" min="0" step="0.01">
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Notes</label>
                <textarea class="form-control" name="notes" rows="2"></textarea>
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveSalesOrder()">Create Order</button>
    `;

    showModal('New Sales Order', body, footer);
}

function updateItemPrice(select) {
    const row = select.closest('.order-item');
    const option = select.options[select.selectedIndex];
    const price = option.dataset.price || 0;
    row.querySelector('.price-input').value = price;
}

function addOrderItem() {
    const container = document.getElementById('orderItems');
    const firstItem = container.querySelector('.order-item');
    const newItem = firstItem.cloneNode(true);
    newItem.querySelector('.product-select').value = '';
    newItem.querySelector('.qty-input').value = 1;
    newItem.querySelector('.price-input').value = '';
    container.appendChild(newItem);
}

function removeOrderItem(btn) {
    const container = document.getElementById('orderItems');
    if (container.children.length > 1) {
        btn.closest('.order-item').remove();
    }
}

async function saveSalesOrder() {
    const form = document.getElementById('salesOrderForm');
    const formData = new FormData(form);

    const items = [];
    document.querySelectorAll('.order-item').forEach(row => {
        const productId = row.querySelector('.product-select').value;
        const qty = parseInt(row.querySelector('.qty-input').value);
        const price = parseFloat(row.querySelector('.price-input').value);

        if (productId && qty > 0) {
            items.push({
                product_id: parseInt(productId),
                quantity: qty,
                unit_price: price
            });
        }
    });

    if (items.length === 0) {
        showToast('Please add at least one item', 'warning');
        return;
    }

    const data = {
        customer_id: parseInt(formData.get('customer_id')),
        items,
        tax: parseFloat(formData.get('tax')) || 0,
        discount: parseFloat(formData.get('discount')) || 0,
        notes: formData.get('notes')
    };

    const result = await api.post('/sales/orders', data);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    hideModal();
    showToast('Order created successfully', 'success');
    renderSales();
}

async function viewSalesOrder(orderId) {
    const result = await api.get(`/sales/orders/${orderId}`);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    const { order, items } = result.data;

    const body = `
        <div class="row mb-3">
            <div class="col-md-6">
                <p><strong>Order:</strong> ${order.order_number}</p>
                <p><strong>Customer:</strong> ${order.customer_name}</p>
                <p><strong>Date:</strong> ${formatDate(order.order_date)}</p>
            </div>
            <div class="col-md-6 text-end">
                <p><strong>Status:</strong> ${getStatusBadge(order.status)}</p>
            </div>
        </div>
        <table class="table table-sm">
            <thead>
                <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
                ${items.map(i => `
                    <tr>
                        <td>${i.product_name}</td>
                        <td>${i.quantity}</td>
                        <td>${formatCurrency(i.unit_price)}</td>
                        <td>${formatCurrency(i.total)}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr><td colspan="3" class="text-end">Subtotal:</td><td>${formatCurrency(order.subtotal)}</td></tr>
                <tr><td colspan="3" class="text-end">Tax:</td><td>${formatCurrency(order.tax)}</td></tr>
                <tr><td colspan="3" class="text-end">Discount:</td><td>-${formatCurrency(order.discount)}</td></tr>
                <tr class="table-primary"><td colspan="3" class="text-end"><strong>Total:</strong></td><td><strong>${formatCurrency(order.total)}</strong></td></tr>
            </tfoot>
        </table>
    `;

    showModal(`Order ${order.order_number}`, body, '<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>');
}

async function confirmSalesOrder(orderId) {
    const confirmed = await showConfirm('Confirm this order? This will deduct stock and generate an invoice.');
    if (!confirmed) return;

    const result = await api.put(`/sales/orders/${orderId}/confirm`);

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    showToast('Order confirmed! Invoice generated.', 'success');
    renderSales();
}
