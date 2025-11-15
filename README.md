# 📌 EasyMed — DBMS Based Healthcare Portal

## 📌 Project Description — EasyMed

**EasyMed** is a full-stack healthcare management system built using  
**Node.js, Express.js, MySQL, and Handlebars (HBS)**.

It allows:

### 👨‍⚕️ Doctors
- Register a doctor account  
- Log in using system-generated `userId`  
- View assigned patients  
- Update profile (address, phone)  
- Delete account  

### 🧑‍⚕️ Patients
- Register a patient account  
- Automatically get assigned to a doctor with the **least number of patients**  
- Log in using `userId`  
- Update medical details:
  - Address  
  - Illness  
  - Allergy  
  - Phone number  
- View assigned doctor  
- Delete account  

---

## 🧱 What This Project Demonstrates

- Authentication (session-based)
- CRUD operations
- MySQL relational database design
- Auto doctor–patient assignment logic
- Backend ↔ Frontend integration  
- Express routing and form handling
- Flash messages & session handling

---

## 🏗️ Tech Stack

| Part | Technology |
|------|------------|
| Backend | Node.js, Express.js |
| Database | MySQL |
| Frontend | HTML, CSS, Handlebars (HBS) |


---

## 🗄️ Database Setup (Required Before Running)

Open **MySQL Workbench** and run:

```sql
CREATE DATABASE IF NOT EXISTS healthcare;
USE healthcare;

-- patients table (pdata)
CREATE TABLE IF NOT EXISTS pdata (
  userId INT AUTO_INCREMENT PRIMARY KEY,
  first VARCHAR(100) NOT NULL,
  last VARCHAR(100),
  sex VARCHAR(10),
  blood VARCHAR(10),
  aadhar BIGINT UNIQUE,
  password VARCHAR(255),
  address VARCHAR(255) DEFAULT NULL,
  ill TEXT DEFAULT NULL,
  allergy TEXT DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL
);

-- doctors table (ddata)
CREATE TABLE IF NOT EXISTS ddata (
  userId INT AUTO_INCREMENT PRIMARY KEY,
  first VARCHAR(100),
  last VARCHAR(100),
  blood VARCHAR(10),
  aadhar BIGINT UNIQUE,
  password VARCHAR(255),
  dept VARCHAR(100),
  post VARCHAR(100),
  postgrad VARCHAR(200),
  patients INT DEFAULT 0,
  address VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL
);

-- logs table (doctor–patient relationship)
CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  docId INT NOT NULL,
  patId INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (docId) REFERENCES ddata(userId) ON DELETE CASCADE,
  FOREIGN KEY (patId) REFERENCES pdata(userId) ON DELETE CASCADE
);
