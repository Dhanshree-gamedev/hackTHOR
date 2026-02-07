const fs = require('fs');
const path = require('path');

// Content storage path
const CONTENT_FILE = path.join(__dirname, '../../data/website-content.json');
const CRAWL_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

// ERP module definitions with content
const ERP_CONTENT = {
    lastUpdated: new Date().toISOString(),
    modules: {
        dashboard: {
            title: "Dashboard",
            description: "Main dashboard showing key metrics and KPIs",
            features: [
                "Total sales overview",
                "Revenue tracking",
                "Active orders count",
                "Low stock alerts",
                "Recent transactions",
                "Quick action buttons"
            ]
        },
        users: {
            title: "User Management",
            description: "Manage system users and their access levels",
            features: [
                "Create new users with email and password",
                "Assign roles: Admin, HR Officer, Sales Officer, Inventory Officer, Finance Officer, Project Manager, Employee",
                "Activate or deactivate user accounts",
                "View all system users",
                "Edit user profiles and permissions"
            ],
            roles: {
                Admin: "Full system access to all modules",
                "HR Officer": "Employees, Attendance, Payroll management",
                "Sales Officer": "Customers, Sales Orders, Invoices",
                "Inventory Officer": "Products, Stock, Suppliers, Purchases",
                "Finance Officer": "Ledger, Financial Reports",
                "Project Manager": "Projects and Task management",
                Employee: "Self-service portal access"
            }
        },
        employees: {
            title: "Employee Management",
            description: "HR module for managing employee records",
            features: [
                "Add new employees with personal details",
                "Track employee departments",
                "Manage salary information",
                "Store contact information (email, phone)",
                "Update employee status (active/inactive)",
                "Link employees to user accounts"
            ]
        },
        attendance: {
            title: "Attendance Tracking",
            description: "Track daily employee attendance",
            features: [
                "Mark daily attendance (Present, Absent, Late, Half-day, Leave)",
                "Bulk attendance entry for multiple employees",
                "View attendance history by date",
                "Generate attendance reports",
                "Track working hours"
            ],
            statuses: ["Present", "Absent", "Late", "Half-day", "Leave"]
        },
        payroll: {
            title: "Payroll Management",
            description: "Generate and process employee payroll",
            features: [
                "Generate monthly payroll based on attendance",
                "Calculate gross and net salary",
                "Apply deductions",
                "Mark payroll as paid",
                "Automatic ledger entries for salary expenses",
                "View payroll history"
            ]
        },
        products: {
            title: "Product & Inventory Management",
            description: "Manage product catalog and stock levels",
            features: [
                "Add products with SKU, name, description",
                "Set unit price and cost price",
                "Track stock quantities",
                "Low stock alerts",
                "Stock adjustments",
                "Product categories"
            ]
        },
        customers: {
            title: "Customer Management",
            description: "Manage customer database",
            features: [
                "Add customer profiles",
                "Store contact details (name, email, phone)",
                "Track customer addresses",
                "View customer order history",
                "Customer status management"
            ]
        },
        sales: {
            title: "Sales Orders & Invoicing",
            description: "Create and manage sales orders with automatic invoicing",
            features: [
                "Create sales orders for customers",
                "Add multiple products to orders",
                "Auto-calculate totals",
                "Confirm orders (deducts stock automatically)",
                "Generate invoices automatically",
                "Track order status (pending, confirmed, shipped, delivered, cancelled)",
                "Automatic ledger entries for sales income"
            ],
            workflow: "Create Order → Add Items → Confirm → Stock Deducted → Invoice Generated → Ledger Updated"
        },
        suppliers: {
            title: "Supplier Management",
            description: "Manage supplier database",
            features: [
                "Add supplier profiles",
                "Store contact person details",
                "Track supplier addresses",
                "View purchase history",
                "Supplier status management"
            ]
        },
        purchases: {
            title: "Purchase Orders",
            description: "Create and manage purchase orders from suppliers",
            features: [
                "Create purchase orders to suppliers",
                "Add multiple products to orders",
                "Receive goods (updates stock automatically)",
                "Track order status (pending, ordered, received, cancelled)",
                "Automatic ledger entries for purchase expenses"
            ],
            workflow: "Create PO → Send to Supplier → Receive Goods → Stock Updated → Ledger Entry Created"
        },
        ledger: {
            title: "Financial Ledger",
            description: "Track all financial transactions",
            features: [
                "Record income and expenses",
                "Automatic entries from sales and purchases",
                "View transaction history",
                "Filter by date range",
                "Calculate totals and balances",
                "Financial reporting"
            ],
            entryTypes: ["Income", "Expense"]
        },
        projects: {
            title: "Project Management",
            description: "Manage projects and tasks",
            features: [
                "Create projects with start/end dates",
                "Set project budgets",
                "Add tasks to projects",
                "Assign tasks to employees",
                "Track task status (pending, in_progress, completed)",
                "Automatic progress calculation",
                "Project status tracking (planning, active, on_hold, completed, cancelled)"
            ]
        }
    },
    faqs: [
        {
            question: "How do I create a new user?",
            answer: "Go to User Management, click 'Add User', fill in the email, password, name, and select a role, then click Save."
        },
        {
            question: "How do I add a new employee?",
            answer: "Go to Employees module, click 'Add Employee', enter their details including name, email, department, position, and salary."
        },
        {
            question: "How do I create a sales order?",
            answer: "Go to Sales > Orders, click 'New Order', select a customer, add products with quantities, then confirm the order."
        },
        {
            question: "How do I track inventory?",
            answer: "Go to Products module to view all products and their current stock levels. Low stock items are highlighted."
        },
        {
            question: "How do I run payroll?",
            answer: "Go to Payroll module, select the month, generate payroll which calculates based on attendance, then mark as paid."
        },
        {
            question: "How do I view financial reports?",
            answer: "Go to Ledger module to see all income and expenses. Use filters to view specific date ranges."
        }
    ],
    systemInfo: {
        name: "SimpleERP",
        version: "1.0.0",
        description: "A complete web-based Enterprise Resource Planning system",
        techStack: ["Node.js", "Express", "SQLite", "Bootstrap 5", "Vanilla JavaScript"],
        defaultLogin: {
            email: "admin@erp.local",
            password: "admin123",
            role: "Admin"
        }
    }
};

// Initialize content on startup
function initializeContent() {
    const dataDir = path.dirname(CONTENT_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    saveContent();
    console.log('Website content initialized for chatbot');
}

// Save content to file
function saveContent() {
    ERP_CONTENT.lastUpdated = new Date().toISOString();
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(ERP_CONTENT, null, 2));
}

// Get all content
function getContent() {
    if (fs.existsSync(CONTENT_FILE)) {
        return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
    }
    return ERP_CONTENT;
}

// Get content as context string for chatbot
function getContextString() {
    const content = getContent();
    let context = `# SimpleERP System Knowledge Base\n\n`;
    context += `System: ${content.systemInfo.name} v${content.systemInfo.version}\n`;
    context += `Description: ${content.systemInfo.description}\n\n`;

    context += `## Available Modules\n\n`;
    for (const [key, module] of Object.entries(content.modules)) {
        context += `### ${module.title}\n`;
        context += `${module.description}\n`;
        context += `Features:\n`;
        module.features.forEach(f => context += `- ${f}\n`);
        if (module.workflow) context += `Workflow: ${module.workflow}\n`;
        context += `\n`;
    }

    context += `## User Roles\n`;
    const roles = content.modules.users.roles;
    for (const [role, desc] of Object.entries(roles)) {
        context += `- ${role}: ${desc}\n`;
    }

    context += `\n## Frequently Asked Questions\n`;
    content.faqs.forEach(faq => {
        context += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
    });

    return context;
}

// Schedule refresh every 6 hours
function scheduleRefresh() {
    setInterval(() => {
        saveContent();
        console.log('Website content refreshed at', new Date().toISOString());
    }, CRAWL_INTERVAL);
}

module.exports = {
    initializeContent,
    getContent,
    getContextString,
    scheduleRefresh,
    ERP_CONTENT
};
