/**
 * Dashboard Module
 */

async function renderDashboard() {
    const content = document.getElementById('contentArea');
    const user = getCurrentUser();

    // Fetch stats based on role
    let stats = {};

    try {
        // Fetch different stats based on permissions
        if (hasRole('Admin', 'HR Officer')) {
            const empRes = await api.get('/employees');
            stats.employees = empRes.data?.employees?.length || 0;
        }

        if (hasRole('Admin', 'Sales Officer')) {
            const custRes = await api.get('/customers');
            stats.customers = custRes.data?.customers?.length || 0;

            const salesRes = await api.get('/sales/orders?status=pending');
            stats.pendingOrders = salesRes.data?.orders?.length || 0;
        }

        if (hasRole('Admin', 'Inventory Officer')) {
            const prodRes = await api.get('/products');
            stats.products = prodRes.data?.products?.length || 0;

            const lowStock = await api.get('/products?low_stock=true');
            stats.lowStock = lowStock.data?.products?.length || 0;
        }

        if (hasRole('Admin', 'Finance Officer')) {
            const ledgerRes = await api.get('/ledger/summary');
            stats.income = ledgerRes.data?.summary?.income || 0;
            stats.expense = ledgerRes.data?.summary?.expense || 0;
        }

        if (hasRole('Admin', 'Project Manager')) {
            const projRes = await api.get('/projects?status=in-progress');
            stats.activeProjects = projRes.data?.projects?.length || 0;
        }
    } catch (e) {
        console.error('Dashboard stats error:', e);
    }

    content.innerHTML = `
        <div class="fade-in">
            <div class="mb-4">
                <h4>Welcome back, ${user.name}!</h4>
                <p class="text-muted">Here's an overview of your ERP system</p>
            </div>
            
            <div class="stats-grid">
                ${hasRole('Admin', 'HR Officer') ? `
                    <div class="stat-card">
                        <div class="stat-icon primary"><i class="bi bi-people"></i></div>
                        <div class="stat-content">
                            <h3>${stats.employees || 0}</h3>
                            <p>Employees</p>
                        </div>
                    </div>
                ` : ''}
                
                ${hasRole('Admin', 'Sales Officer') ? `
                    <div class="stat-card">
                        <div class="stat-icon success"><i class="bi bi-person-lines-fill"></i></div>
                        <div class="stat-content">
                            <h3>${stats.customers || 0}</h3>
                            <p>Customers</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon warning"><i class="bi bi-cart3"></i></div>
                        <div class="stat-content">
                            <h3>${stats.pendingOrders || 0}</h3>
                            <p>Pending Orders</p>
                        </div>
                    </div>
                ` : ''}
                
                ${hasRole('Admin', 'Inventory Officer') ? `
                    <div class="stat-card">
                        <div class="stat-icon info"><i class="bi bi-box-seam"></i></div>
                        <div class="stat-content">
                            <h3>${stats.products || 0}</h3>
                            <p>Products</p>
                        </div>
                    </div>
                    ${stats.lowStock > 0 ? `
                        <div class="stat-card">
                            <div class="stat-icon danger"><i class="bi bi-exclamation-triangle"></i></div>
                            <div class="stat-content">
                                <h3>${stats.lowStock}</h3>
                                <p>Low Stock Items</p>
                            </div>
                        </div>
                    ` : ''}
                ` : ''}
                
                ${hasRole('Admin', 'Finance Officer') ? `
                    <div class="stat-card">
                        <div class="stat-icon success"><i class="bi bi-graph-up-arrow"></i></div>
                        <div class="stat-content">
                            <h3>${formatCurrency(stats.income)}</h3>
                            <p>Total Income</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon danger"><i class="bi bi-graph-down-arrow"></i></div>
                        <div class="stat-content">
                            <h3>${formatCurrency(stats.expense)}</h3>
                            <p>Total Expenses</p>
                        </div>
                    </div>
                ` : ''}
                
                ${hasRole('Admin', 'Project Manager') ? `
                    <div class="stat-card">
                        <div class="stat-icon primary"><i class="bi bi-kanban"></i></div>
                        <div class="stat-content">
                            <h3>${stats.activeProjects || 0}</h3>
                            <p>Active Projects</p>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="row">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <i class="bi bi-activity me-2"></i>Quick Actions
                        </div>
                        <div class="card-body">
                            <div class="row g-3">
                                ${hasRole('Admin', 'Sales Officer') ? `
                                    <div class="col-md-4">
                                        <button class="btn btn-outline-primary w-100" onclick="navigateTo('sales')">
                                            <i class="bi bi-plus-circle me-2"></i>New Sale
                                        </button>
                                    </div>
                                ` : ''}
                                ${hasRole('Admin', 'Inventory Officer') ? `
                                    <div class="col-md-4">
                                        <button class="btn btn-outline-success w-100" onclick="navigateTo('products')">
                                            <i class="bi bi-box-seam me-2"></i>Manage Stock
                                        </button>
                                    </div>
                                ` : ''}
                                ${hasRole('Admin', 'HR Officer') ? `
                                    <div class="col-md-4">
                                        <button class="btn btn-outline-info w-100" onclick="navigateTo('attendance')">
                                            <i class="bi bi-calendar-check me-2"></i>Attendance
                                        </button>
                                    </div>
                                ` : ''}
                                ${hasRole('Admin', 'Finance Officer') ? `
                                    <div class="col-md-4">
                                        <button class="btn btn-outline-warning w-100" onclick="navigateTo('ledger')">
                                            <i class="bi bi-journal-text me-2"></i>View Ledger
                                        </button>
                                    </div>
                                ` : ''}
                                ${hasRole('Admin', 'Project Manager') ? `
                                    <div class="col-md-4">
                                        <button class="btn btn-outline-secondary w-100" onclick="navigateTo('projects')">
                                            <i class="bi bi-kanban me-2"></i>Projects
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="bi bi-person me-2"></i>Your Profile
                        </div>
                        <div class="card-body">
                            <p><strong>Name:</strong> ${user.name}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Role:</strong> ${user.role}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
