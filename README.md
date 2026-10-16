# 🛡️ MagneticX License Manager & Client Portal

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

An enterprise-grade, edge-ready **Software Licensing Engine, Auto-Update Server, and Customer Self-Service Portal**. Designed for indie developers, SaaS founders, and software agencies who want to sell, protect, and distribute desktop apps, web scripts, CLI tools, and private plugins with cryptographic "Ironclad" security.

---

## 🌟 Key Features

### 🔐 1. Cryptographic "Ironclad" Security
- **2048-bit RSA Response Signing:** Every response from `/validate`, `/activate`, and `/update` is mathematically signed with a private RSA key. Clients verify the signature with the public key, rendering Man-in-the-Middle (MITM) attacks and cracked response mocks completely useless.
- **Hardware Lock (HWID) & IP Binding:** Automatically locks licenses to a unique machine identifier (Motherboard UUID, CPU ID, MAC) upon activation. Prevents unauthorized software sharing and cloning.
- **Vital App Secret / Database Salt:** Issue unique cryptographic secrets (`appSecret`) per license that client software can use as database salts or decryption keys.
- **Signed Auto-Updater with SHA-256 Streaming:** The `/update` endpoint streams GitHub release ZIPs on-the-fly to compute and sign SHA-256 file hashes (`latestZipHash`), ensuring client apps only install authentic, tamper-free updates.
- **Stealth Secret Admin Routing:** The admin dashboard is hidden behind dual secret path segments (`/${SECRET_KEY1}/${SECRET_KEY2}`) to shield it from scanners, bots, and crawlers.

### 👤 2. Self-Service Customer Portal
- **Passwordless Authentication:** Clients log in securely using their **License Key & Email**.
- **Brute-Force Guard:** 3-strike login lockout system prevents automated credential stuffing.
- **Hardware Management & Self-Unassign:** Customers can unbind their machine directly from the portal via secure **6-Digit Email OTP verification**.
- **Software Downloads & Changelogs:** Integrated with GitHub Releases to stream binary releases directly, with rich Markdown release notes preview.
- **Real-Time API Quotas:** Visual progress bars displaying request limits and usage alerts.
- **One-Click Support Requests:** Customers can request renewals or rate-limit resets directly through the portal with automated email notifications.

### ⚡ 3. Powerful Builder / Admin Dashboard
- **Multi-Product Management:** Manage multiple independent software products from a single panel.
- **Isolated RSA Keypairs:** Generate or import dedicated 2048-bit RSA keypairs per product with one-click `.pem` public key export.
- **Granular License Controls:** Create, edit, renew, freeze (temporary hold), lock, disable, or delete licenses on demand.
- **Smart Calendar-Day Rate Limiting:** Configure request quotas per day (midnight auto-reset) or per hour with self-healing, real-time UI calculation.
- **Real-Time Audit Logging:** Inspect all API traffic with full telemetry (status codes, response latency, hardware IDs, IP addresses, and failure error types).
- **Interactive Live API Simulator:** Test `/validate`, `/activate`, `/update`, and `/download` endpoints in real-time with instant response inspection and generated `curl` snippets.
- **Notification Center:** Live badge counter for incoming customer requests with direct navigation to licenses and a one-click "Clear All" button.

---

## 🏗️ Architecture Overview

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client App (Laravel/Node/Desktop)
    participant API as License Manager API
    participant GH as GitHub Releases
    participant DB as MySQL Database

    Note over Client,API: 1. Machine Activation & Hardware Lock
    Client->>API: POST /api/v1/license/activate (Key + HWID)
    API->>DB: Verify License & Bind HWID
    API-->>Client: Signed Payload { data, signature } (RSA-256)

    Note over Client,API: 2. Periodic License Validation
    Client->>API: POST /api/v1/license/validate (Key + HWID)
    API->>DB: Check Expiry, HWID, Freeze & Rate Limit
    API-->>Client: Signed Validation Payload + App Secret
    Client->>Client: Verify RSA Signature with Public Key

    Note over Client,GH: 3. Tamper-Proof Auto Update
    Client->>API: POST /api/v1/license/update
    API->>GH: Stream Release & Compute SHA-256
    API-->>Client: Signed { latest_version, zip_hash, signature }
    Client->>API: GET /api/v1/license/download
    API-->>Client: Binary ZIP file
    Client->>Client: Verify downloaded ZIP SHA-256 == zip_hash
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 18.x or 20.x
- **MySQL** 8.x or MariaDB
- **SMTP Server** (Gmail, Mailgun, Brevo, AWS SES, or standard cPanel/aaPanel SMTP)

### 1. Installation

```bash
git clone https://github.com/itzsd0811/license-manager.git
cd license-manager
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Application URL (Used for email links and portal redirects)
APP_URL="https://license.yourdomain.com"

# Database Connection (MySQL)
DATABASE_URL="mysql://DB_USER:DB_PASSWORD@127.0.0.1:3306/license_manager"

# Secret Admin URL Routing
# Admin dashboard will be available at: https://license.yourdomain.com/portal/secure-admin
SECRET_KEY1="portal"
SECRET_KEY2="secure-admin"

# Firebase Client Configuration (For Builder Authentication)
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# Cryptographic Keys (Must be 32 characters minimum)
LICENSE_KEY_SECRET="32-byte-secret-for-generating-license-keys"
ENCRYPTION_KEY="32-byte-key-for-encrypting-rsa-keys-and-pats"
SESSION_SECRET="your-super-secret-session-key-change-this"

# SMTP Mail Server (Used for OTPs & Client Notifications)
MAIL_HOST="smtp.yourdomain.com"
MAIL_PORT="465"
MAIL_USERNAME="noreply@yourdomain.com"
MAIL_PASSWORD="your-smtp-password"
MAIL_FROM_NAME="License System"
MAIL_FROM_ADDRESS="noreply@yourdomain.com"
MAIL_ENCRYPTION="ssl"
MAIL_AUTH_TYPE="LOGIN"
```

### 3. Database Initialization

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit:
- **Client Portal:** `http://localhost:3000`
- **Builder Dashboard:** `http://localhost:3000/portal/secure-admin` (using your `SECRET_KEY1` and `SECRET_KEY2`)

---

## 📖 How to Use

### Step 1: Create a Software Product
1. Log in to the Builder Dashboard.
2. Go to **Softwares** > **New Product**.
3. Enter your Product Name.
4. *(Optional)* Link your **GitHub Repository** (`owner/repo`) and Personal Access Token (PAT) for private repo downloads.
5. In the **RSA Security Layer** section, click **Generate Keypair (2048-bit)**.
6. Click **Download Public Key (.pem)** and save this key inside your client software.

### Step 2: Issue a License
1. Go to **Licenses** > **Create License**.
2. Select the Product, enter Customer Name and Email.
3. Configure expiration (Years / Months / Days) or choose **Start on Activation**.
4. Set daily/hourly API Rate Limits (e.g. `50 req / days`).
5. *(Optional)* Provide or auto-generate a custom `App Secret`.
6. Submit! An automated email containing the license key and portal link will be dispatched to the customer.

### Step 3: Integrate with Your Application

#### A. Node.js Verification Example
```javascript
const crypto = require('crypto');
const fs = require('fs');

const publicKey = fs.readFileSync('public.pem', 'utf8');

async function validateLicense(key, hwid) {
  const res = await fetch('https://license.yourdomain.com/api/v1/license/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, installationId: hwid })
  });

  const { data, signature } = await res.json();

  // Verify RSA-SHA256 signature
  const verifier = crypto.createVerify('SHA256');
  verifier.update(JSON.stringify(data));
  const isValid = verifier.verify(publicKey, signature, 'base64');

  if (!isValid) {
    throw new Error('Tampered or forged license response!');
  }

  return data;
}
```

#### B. PHP / Laravel Verification Example
```php
$response = Http::post('https://license.yourdomain.com/api/v1/license/validate', [
    'key' => $licenseKey,
    'installationId' => $hardwareId
])->json();

$data = json_encode($response['data']);
$signature = base64_decode($response['signature']);
$publicKey = file_get_contents(storage_path('keys/public.pem'));

$verified = openssl_verify($data, $signature, $publicKey, OPENSSL_ALGO_SHA256);

if ($verified !== 1) {
    abort(403, 'Cryptographic signature verification failed.');
}
```

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/license/activate` | `POST` | Activates license and permanently binds machine HWID & IP. Returns signed payload. |
| `/api/v1/license/validate` | `POST` | Validates active license, verifies HWID binding, checks calendar rate limits. Returns signed payload. |
| `/api/v1/license/update` | `POST` | Checks for GitHub updates. Calculates and returns signed SHA-256 ZIP hash. |
| `/api/v1/license/download` | `POST` | Securely proxies and streams authenticated binary release ZIP from GitHub. |

---

## 🌐 Production Deployment (aaPanel / VPS / Docker)

1. Upload the project files to your server (exclude `node_modules` and `.next`).
2. Install dependencies and build:
   ```bash
   npm install
   npx prisma db push
   npm run build
   ```
3. In **aaPanel**:
   - Go to **Website** > **Node Project** > **Add Node Project**.
   - Working Directory: `/www/wwwroot/your-license-domain`.
   - Run Command: `npm start` (or port `3000`/`3045`).
   - Bind your domain and configure **SSL certificate (Let's Encrypt)**.

---

## 📄 License & Attribution

Distributed under the **MIT License**. Created by [ItzSD](https://github.com/itzsd0811).
