<div align="center">

# MX GESTÃO PREDITIVA

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
[![React 19](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green?style=flat-square&logo=supabase)](https://supabase.com/)

[View App in AI Studio](https://ai.studio/apps/626d9552-45cc-4d3b-9c51-9ef21386510c)

AutoFlux is a premium, multi-tenant operating system designed for car dealerships and automotive consultancies. It focuses on maximizing sales performance through LeadOps, automated SLAs, and AI-driven diagnostics.


</div>

---

## 🚀 Key Features

-   **Multi-Tenancy & RBAC**: Secure data isolation between agencies and roles (Owner, Manager, Seller, Consultant).
-   **LeadOps & SLA Management**: Intelligent lead attribution and real-time monitoring of response times (SLA).
-   **Sales Funnel (Kanban)**: Highly interactive drag-and-drop pipeline for visual lead management.
-   **AI Diagnostics**: Weekly performance insights and actionable recommendations generated via Gemini AI.
-   **Inventory Management**: Full control over vehicle stock and availability.
-   **Financial Cockpit**: Real-time KPIs, run-rate projections, and commission tracking.

## 🛠️ Tech Stack

-   **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Vanilla CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) with modern design principles (Glassmorphism, Micro-animations).
-   **State Management**: React Context + Hooks.
-   **Backend/BaaS**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, RLS).
-   **AI Engine**: [Google Gemini AI](https://ai.google.dev/) via `@google/genai`.
-   **Animations**: [Motion](https://motion.dev/).
-   **Build Tool**: [Vite 6.x](https://vitejs.dev/).

## 🏗️ Architecture & Security

AutoFlux is built with scalability and security as first-class citizens:
-   **Tenant Isolation**: Row-Level Security (RLS) policies in PostgreSQL ensure each agency only accesses its own data.
-   **Permissions (RBAC)**:
    -   **Admin Master**: Full cross-tenant visibility.
    -   **Manager**: Local store management and reporting.
    -   **Seller**: Interaction focused on assigned leads.
-   **Asynchronous Jobs**: SLA monitors and daily projections run via scheduled functions (Supabase Edge Functions / Crons).

## ⚡ Getting Started

### Prerequisites
-   Node.js (v18+)
-   Supabase Account
-   Gemini API Key

### Local Installation
1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd AutoFlux
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**: Create a `.env` file (refer to `.env.example`):
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    GEMINI_API_KEY=your_gemini_api_key
    ```
4.  **Run development server**:
    ```bash
    npm run dev
    ```

## 📜 Development Scripts

-   `npm run dev`: Starts the development server on `localhost:3000`.
-   `npm run build`: Compiles the application for production.
-   `npm run lint`: Perfors TypeScript type checking.
-   `npm run clean`: Removes the `dist` build directory.

## 🚀 Deployment

AutoFlux is optimized for hosting on **Vercel**.
-   Push to `main` branch to trigger automatic deployment.
-   Ensure all environment variables are configured in the Vercel Dashboard.

---

<p align="center">
  Built with ❤️ by the AutoFlux Team
</p>
