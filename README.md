# LinkedIn Contact Manager — Node.js + React

## Folder Structure
```
linkedin-contact-manager/
├── setup.sql           ← Run once to create MySQL tables
├── import_csv.py       ← Run once to import CSV data into MySQL
├── backend/            ← Node.js + Express API (port 5000)
└── frontend/           ← React + Vite UI (port 3000)
```

---

## Step 1 — Database Setup

### 1a. Create tables in local MySQL
```bash
mysql -u root -p"Devsharma_765@<>" < setup.sql
```

### 1b. Import CSV data
Place `garima.csv` and `LMS.csv` next to `import_csv.py`, then:
```bash
pip install pymysql
python import_csv.py
```

---

## Step 2 — Backend Setup
```bash
cd backend
npm install
npm run dev       # development (nodemon)
# OR
npm start         # production
```
Backend runs on http://localhost:5000

---

## Step 3 — Frontend Setup
```bash
cd frontend
npm install
npm run dev       # development (port 3000)
# OR
npm run build     # build for production → dist/
```
Frontend runs on http://localhost:3000

---

## Production Deployment (Accunite Server)

### 1. Build frontend
```bash
cd frontend && npm run build
```

### 2. Start backend with PM2
```bash
cd backend
NODE_ENV=production pm2 start server.js --name linkedin-contact-manager
```

### 3. Apache config — add to your SSL conf
```apache
ProxyPass /linkedin-contact-manager/api http://localhost:5000/api
ProxyPassReverse /linkedin-contact-manager/api http://localhost:5000/api

Alias /linkedin-contact-manager /opt/node/linkedin-contact-manager/frontend/dist
<Directory /opt/node/linkedin-contact-manager/frontend/dist>
    Options -Indexes
    AllowOverride All
    Require all granted
    FallbackResource /linkedin-contact-manager/index.html
</Directory>
```

---

## Environment Variables (backend/.env)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Devsharma_765@<>
DB_NAME=bmi

RDS_HOST=wmpbmi.cwyvyaxhb6rz.ap-south-1.rds.amazonaws.com
RDS_USER=wmpbmi
RDS_PASSWORD=QHCJu1GGBtUbjKpGvwSN
RDS_NAME=bmi

PORT=5000
FRONTEND_URL=http://localhost:3000
```
