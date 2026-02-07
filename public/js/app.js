/**
 * Main Application Logic
 */

// Current active module
let currentModule = 'dashboard';

// Menu configuration by role
const MENU_CONFIG = {
    'Admin': [
        {
            section: 'Main', items: [
                { id: 'dashboard', icon: 'speedometer2', label: 'Dashboard' }
            ]
        },
        {
            section: 'Management', items: [
                { id: 'users', icon: 'people', label: 'Users' },
                { id: 'employees', icon: 'person-badge', label: 'Employees' },
                { id: 'attendance', icon: 'calendar-check', label: 'Attendance' },
                { id: 'payroll', icon: 'cash-stack', label: 'Payroll' }
            ]
        },
        {
            section: 'Operations', items: [
                { id: 'products', icon: 'box-seam', label: 'Products' },
                { id: 'customers', icon: 'person-lines-fill', label: 'Customers' },
                { id: 'sales', icon: 'cart3', label: 'Sales Orders' },
                { id: 'suppliers', icon: 'truck', label: 'Suppliers' },
                { id: 'purchases', icon: 'bag-check', label: 'Purchase Orders' }
            ]
        },
        {
            section: 'Finance', items: [
                { id: 'ledger', icon: 'journal-text', label: 'Ledger' }
            ]
        },
        {
            section: 'Projects', items: [
                { id: 'projects', icon: 'kanban', label: 'Projects' }
            ]
        }
    ],
    'Sales Officer': [
        { section: 'Main', items: [{ id: 'dashboard', icon: 'speedometer2', label: 'Dashboard' }] },
        {
            section: 'Sales', items: [
                { id: 'customers', icon: 'person-lines-fill', label: 'Customers' },
                { id: 'sales', icon: 'cart3', label: 'Sales Orders' },
                { id: 'products', icon: 'box-seam', label: 'Products' }
            ]
        }
    ],
    'Inventory Officer': [
        { section: 'Main', items: [{ id: 'dashboard', icon: 'speedometer2', label: 'Dashboard' }] },
        {
            section: 'Inventory', items: [
                { id: 'products', icon: 'box-seam', label: 'Products' },
                { id: 'suppliers', icon: 'truck', label: 'Suppliers' },
                { id: 'purchases', icon: 'bag-check', label: 'Purchase Orders' }
            ]
        }
    ],
    'HR Officer': [
        { section: 'Main', items: [{ id: 'dashboard', icon: 'speedometer2', label: 'Dashboard' }] },
        {
            section: 'HR', items: [
                { id: 'employees', icon: 'person-badge', label: 'Employees' },
                { id: 'attendance', icon: 'calendar-check', label: 'Attendance' },
                { id: 'payroll', icon: 'cash-stack', label: 'Payroll' }
            ]
        }
    ],
    'Finance Officer': [
        { section: 'Main', items: [{ id: 'dashboard', icon: 'speedometer2', label: 'Dashboard' }] },
        {
            section: 'Finance', items: [
                { id: 'ledger', icon: 'journal-text', label: 'Ledger' },
                { id: 'payroll', icon: 'cash-stack', label: 'Payroll' }
            ]
        }
    ],
    'Project Manager': [
        { section: 'Main', items: [{ id: 'dashboard', icon: 'speedometer2', label: 'Dashboard' }] },
        {
            section: 'Projects', items: [
                { id: 'projects', icon: 'kanban', label: 'Projects' },
                { id: 'employees', icon: 'person-badge', label: 'Employees' }
            ]
        }
    ],
    'Employee': [
        { section: 'Main', items: [{ id: 'dashboard', icon: 'speedometer2', label: 'Dashboard' }] },
        {
            section: 'My Info', items: [
                { id: 'projects', icon: 'kanban', label: 'Tasks' },
                { id: 'attendance', icon: 'calendar-check', label: 'Attendance' }
            ]
        }
    ]
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    initApp();
});

function initApp() {
    const user = getCurrentUser();

    // Set user info
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = user.role;

    // Build menu
    buildSidebar(user.role);

    // Setup event listeners
    setupEventListeners();

    // Load initial module
    navigateTo('dashboard');
}

function buildSidebar(role) {
    const nav = document.getElementById('sidebarNav');
    const menuConfig = MENU_CONFIG[role] || MENU_CONFIG['Employee'];

    let html = '';
    menuConfig.forEach(section => {
        html += `<div class="nav-section">`;
        html += `<div class="nav-section-title">${section.section}</div>`;
        section.items.forEach(item => {
            html += `
                <a class="nav-item" data-module="${item.id}">
                    <i class="bi bi-${item.icon}"></i>
                    <span>${item.label}</span>
                </a>
            `;
        });
        html += `</div>`;
    });

    nav.innerHTML = html;

    // Add click handlers
    nav.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            navigateTo(item.dataset.module);
        });
    });
}

function setupEventListeners() {
    // Sidebar toggle (mobile)
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('show');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Refresh
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadModule(currentModule);
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        if (window.innerWidth < 992 && sidebar.classList.contains('show')) {
            if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        }
    });
}

function navigateTo(module) {
    currentModule = module;

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.module === module);
    });

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        users: 'User Management',
        employees: 'Employees',
        attendance: 'Attendance',
        payroll: 'Payroll',
        products: 'Products',
        customers: 'Customers',
        sales: 'Sales Orders',
        suppliers: 'Suppliers',
        purchases: 'Purchase Orders',
        ledger: 'Ledger',
        projects: 'Projects'
    };
    document.getElementById('pageTitle').textContent = titles[module] || module;

    // Close sidebar on mobile
    if (window.innerWidth < 992) {
        document.getElementById('sidebar').classList.remove('show');
    }

    // Load module content
    loadModule(module);
}

function loadModule(module) {
    const content = document.getElementById('contentArea');
    content.innerHTML = '<div class="loading-spinner"><div class="spinner-border text-primary"></div></div>';

    // Call module render function
    const renderFunctions = {
        dashboard: renderDashboard,
        users: renderUsers,
        employees: renderEmployees,
        attendance: renderAttendance,
        payroll: renderPayroll,
        products: renderProducts,
        customers: renderCustomers,
        sales: renderSales,
        suppliers: renderSuppliers,
        purchases: renderPurchases,
        ledger: renderLedger,
        projects: renderProjects
    };

    if (renderFunctions[module]) {
        renderFunctions[module]();
    } else {
        content.innerHTML = `<div class="empty-state"><i class="bi bi-gear"></i><h4>Module not found</h4></div>`;
    }
}

// ===== Utility Functions =====

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const id = 'toast-' + Date.now();

    const toast = document.createElement('div');
    toast.className = `toast show align-items-center text-white bg-${type}`;
    toast.id = id;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showModal(title, body, footer = '') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalFooter').innerHTML = footer;

    const modal = new bootstrap.Modal(document.getElementById('appModal'));
    modal.show();
    return modal;
}

function hideModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('appModal'));
    if (modal) modal.hide();
}

async function showConfirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;

        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        const confirmBtn = document.getElementById('confirmBtn');

        const handler = () => {
            modal.hide();
            confirmBtn.removeEventListener('click', handler);
            resolve(true);
        };

        confirmBtn.addEventListener('click', handler);

        document.getElementById('confirmModal').addEventListener('hidden.bs.modal', () => {
            confirmBtn.removeEventListener('click', handler);
            resolve(false);
        }, { once: true });

        modal.show();
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount || 0);
}

function getStatusBadge(status) {
    const statusClasses = {
        'active': 'badge-active',
        'inactive': 'badge-inactive',
        'pending': 'badge-pending',
        'confirmed': 'badge-confirmed',
        'paid': 'badge-paid',
        'unpaid': 'badge-pending',
        'completed': 'badge-completed',
        'cancelled': 'badge-cancelled',
        'in-progress': 'badge-in-progress',
        'received': 'badge-completed',
        'shipped': 'badge-confirmed',
        'delivered': 'badge-completed',
        'present': 'badge-active',
        'absent': 'badge-inactive',
        'late': 'badge-pending',
        'leave': 'badge-confirmed',
        'terminated': 'badge-inactive',
        'planning': 'badge-pending',
        'on-hold': 'badge-pending',
        'todo': 'badge-pending',
        'review': 'badge-confirmed'
    };

    const className = statusClasses[status?.toLowerCase()] || 'badge-secondary';
    return `<span class="badge-status ${className}">${status || 'N/A'}</span>`;
}
