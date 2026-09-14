# License Manager & Client Portal

![Next JS](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_v4-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)

A high-performance, edge-ready licensing engine and customer portal. Securely issue, validate, and manage software license keys while offering a premium self-service dashboard for clients.

## ✨ Features

* **Admin Dashboard:** Secret URL routing, global telemetry (API health, hardware bindings), license generation, and request handling.
* **Customer Portal:** Passwordless OTP login, hardware (HWID) management, software downloads, and live API usage tracking.
* **Edge API:** Fast endpoints for validation (`/api/v1/license/validate`), activation, and secure proxy downloads.
* **Advanced Security:** AES-256-GCM encryption, OTP burn rates (3 strikes), global lockouts, and Next.js Route Interceptors (`proxy.ts`).

## 🚀 Quick Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/itzsd0811/license-manager.git
   cd license-manager
   npm install
   ```

2. **Environment Variables (`.env`)**
   ```env
   # Database
   DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"

   # Secret Routing (MOD-02)
   # Example: https://yourdomain.com/secret1/secret2
   SECRET_KEY1="secret1"
   SECRET_KEY2="secret2"

   # Firebase Client Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=""
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
   NEXT_PUBLIC_FIREBASE_APP_ID=""

   # Secrets
   LICENSE_KEY_SECRET="32-byte-secret-for-licenses-----"
   ENCRYPTION_KEY="32-byte-encryption-key-for-pats"
   SESSION_SECRET="your-session-secret-here"
  
   # Mail Configuration  
   # SMTP for OTP Emails
   MAIL_HOST="smtp.domain.com"
   MAIL_PORT="465"
   MAIL_USERNAME="admin@domain.com"
   MAIL_PASSWORD="password"
   MAIL_FROM_NAME="License Portal"
   MAIL_FROM_ADDRESS="admin@domain.com"
   MAIL_ENCRYPTION=ssl
   MAIL_AUTH_TYPE=LOGIN
   ```

3. **Initialize & Run**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

## 🌍 aaPanel Deployment
1. Upload code (exclude `node_modules` & `.next`), and create your `.env`.
2. Run `npm install && npx prisma db push && npm run build` via terminal.
3. In aaPanel, go to **Website > Node Project > Add Node Project**.
4. Select `start` command, set port `3000`, attach your domain, and enable SSL.

## 👨‍💻 Author

**ItzSD**
* GitHub: [@itzsd0811](https://github.com/itzsd0811)
* Website: [sethru.is-a.dev](https://sethru.is-a.dev)
