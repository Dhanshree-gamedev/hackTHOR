<p align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js"/>
  <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
  <img src="https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white" alt="Bootstrap"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
</p>

<h1 align="center">🏢 SimpleERP</h1>

<p align="center">
  <strong>A Modern Web-Based Enterprise Resource Planning System</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#installation">Installation</a> •
  <a href="#modules">Modules</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#api">API</a>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Role-Based Access** | 7 user roles with granular permissions |
| 👥 **HR Management** | Employee records, attendance, payroll |
| 📦 **Inventory Control** | Product catalog with stock tracking |
| 💰 **Sales & Invoicing** | Customer orders with auto-invoicing |
| 🛒 **Purchase Management** | Supplier orders with goods receiving |
| 📊 **Financial Ledger** | Income/expense tracking & reports |
| 📋 **Project Management** | Projects with task assignments |
| 🔒 **JWT Authentication** | Secure token-based auth |

---

## 🚀 Demo

### Default Login
```
📧 Email: admin@erp.local
🔑 Password: admin123
```

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Dhanshree-gamedev/hackTHOR.git

# Navigate to project directory
cd hackTHOR

# Install dependencies
npm install

# Start the server
npm start
```

🌐 Open **http://localhost:3000** in your browser

---

## 🎯 Modules

### 👤 User Roles

| Role | Access Level |
|------|--------------|
| Admin | Full system access |
| HR Officer | Employees, Attendance, Payroll |
| Sales Officer | Customers, Sales, Invoices |
| Inventory Officer | Products, Stock, Suppliers, Purchases |
| Finance Officer | Ledger, Financial Reports |
| Project Manager | Projects, Tasks |
| Employee | Self-service portal |

### 📊 Core Modules

```
📁 SimpleERP
├── 🔐 Authentication
├── 👥 User Management
├── 👨‍💼 HR Module
│   ├── Employees
│   ├── Attendance
│   └── Payroll
├── 📦 Inventory
│   └── Products & Stock
├── 💼 Sales
│   ├── Customers
│   ├── Sales Orders
│   └── Invoices
├── 🛒 Purchases
│   ├── Suppliers
│   └── Purchase Orders
├── 💰 Finance
│   └── General Ledger
└── 📋 Projects
    └── Tasks
```

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center"><b>Backend</b></td>
<td align="center"><b>Frontend</b></td>
<td align="center"><b>Database</b></td>
<td align="center"><b>Auth</b></td>
</tr>
<tr>
<td align="center">
Node.js<br/>
Express.js
</td>
<td align="center">
HTML5<br/>
CSS3<br/>
JavaScript<br/>
Bootstrap 5
</td>
<td align="center">
SQLite<br/>
(sql.js)
</td>
<td align="center">
JWT<br/>
bcryptjs
</td>
</tr>
</table>

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Current user info |

### Resources
| Module | Endpoints |
|--------|-----------|
| Users | `/api/users` |
| Employees | `/api/employees` |
| Attendance | `/api/attendance` |
| Payroll | `/api/payroll` |
| Products | `/api/products` |
| Customers | `/api/customers` |
| Sales | `/api/sales/orders`, `/api/sales/invoices` |
| Suppliers | `/api/suppliers` |
| Purchases | `/api/purchases/orders` |
| Ledger | `/api/ledger` |
| Projects | `/api/projects` |

---

## 📁 Project Structure

```
hackTHOR/
├── 📂 server/
│   ├── 📂 config/
│   │   └── database.js       # SQLite configuration
│   ├── 📂 middleware/
│   │   ├── auth.js           # JWT authentication
│   │   ├── rbac.js           # Role-based access
│   │   └── audit.js          # Audit logging
│   ├── 📂 routes/
│   │   ├── auth.js           # Auth endpoints
│   │   ├── users.js          # User management
│   │   ├── employees.js      # Employee CRUD
│   │   ├── attendance.js     # Attendance tracking
│   │   ├── payroll.js        # Payroll management
│   │   ├── products.js       # Product catalog
│   │   ├── customers.js      # Customer management
│   │   ├── sales.js          # Sales orders
│   │   ├── suppliers.js      # Supplier management
│   │   ├── purchases.js      # Purchase orders
│   │   ├── ledger.js         # Financial ledger
│   │   └── projects.js       # Project management
│   ├── 📂 utils/
│   │   ├── hash.js           # Password hashing
│   │   └── token.js          # JWT utilities
│   └── index.js              # Server entry point
├── 📂 public/
│   ├── 📂 css/
│   │   └── styles.css        # Admin theme
│   ├── 📂 js/
│   │   ├── api.js            # API client
│   │   ├── auth.js           # Auth helpers
│   │   ├── app.js            # Main app
│   │   └── 📂 modules/       # Module views
│   ├── index.html            # Login page
│   └── dashboard.html        # Main app shell
├── 📂 data/                  # Database storage
├── package.json
└── README.md
```

---

## 🎨 Screenshots

| Login | Dashboard |
|-------|-----------|
| Professional login page | Role-based admin dashboard |

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ for <b>hackTHOR</b>
</p>
