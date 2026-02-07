/**
 * Ledger Module
 */

async function renderLedger() {
    const content = document.getElementById('contentArea');

    const [entriesResult, summaryResult] = await Promise.all([
        api.get('/ledger?limit=50'),
        api.get('/ledger/summary')
    ]);

    const entries = entriesResult.data?.entries || [];
    const summary = summaryResult.data?.summary || { income: 0, expense: 0, balance: 0 };

    content.innerHTML = `
        <div class="fade-in">
            <div class="stats-grid mb-4">
                <div class="stat-card">
                    <div class="stat-icon success"><i class="bi bi-graph-up-arrow"></i></div>
                    <div class="stat-content">
                        <h3>${formatCurrency(summary.income)}</h3>
                        <p>Total Income</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon danger"><i class="bi bi-graph-down-arrow"></i></div>
                    <div class="stat-content">
                        <h3>${formatCurrency(summary.expense)}</h3>
                        <p>Total Expenses</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon ${summary.balance >= 0 ? 'primary' : 'warning'}"><i class="bi bi-wallet2"></i></div>
                    <div class="stat-content">
                        <h3>${formatCurrency(summary.balance)}</h3>
                        <p>Net Balance</p>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <div class="table-header">
                    <h5 class="table-title">Ledger Entries</h5>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="showLedgerEntryForm()">
                            <i class="bi bi-plus-lg me-1"></i> New Entry
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${entries.length === 0 ? `
                                <tr><td colspan="5" class="text-center py-4">No entries found</td></tr>
                            ` : entries.map(e => `
                                <tr>
                                    <td>${formatDate(e.transaction_date)}</td>
                                    <td><span class="badge ${e.type === 'INCOME' ? 'bg-success' : 'bg-danger'}">${e.type}</span></td>
                                    <td>${e.category}</td>
                                    <td>${e.description || '-'}</td>
                                    <td class="${e.type === 'INCOME' ? 'text-success' : 'text-danger'}">
                                        <strong>${e.type === 'INCOME' ? '+' : '-'}${formatCurrency(e.amount)}</strong>
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

async function showLedgerEntryForm() {
    const body = `
        <form id="ledgerForm">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Type *</label>
                    <select class="form-select" name="type" required>
                        <option value="INCOME">Income</option>
                        <option value="EXPENSE">Expense</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Category *</label>
                    <input type="text" class="form-control" name="category" required>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Amount *</label>
                    <input type="number" class="form-control" name="amount" required min="0.01" step="0.01">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-control" name="transaction_date" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" name="description" rows="2"></textarea>
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveLedgerEntry()">Save</button>
    `;

    showModal('New Ledger Entry', body, footer);
}

async function saveLedgerEntry() {
    const form = document.getElementById('ledgerForm');
    const formData = new FormData(form);

    const result = await api.post('/ledger', {
        type: formData.get('type'),
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount')),
        description: formData.get('description'),
        transaction_date: formData.get('transaction_date')
    });

    if (result.error) {
        showToast(result.error, 'danger');
        return;
    }

    hideModal();
    showToast('Entry created', 'success');
    renderLedger();
}
