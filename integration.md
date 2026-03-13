# TSEDQ Platform Integrations

This document outlines the core third-party services, APIs, and libraries that power the TSEDQ platform. It is divided into services that are already integrated and those planned for future implementation.

---

## 1. Already Integrated Features

These services and libraries are currently implemented and active in the project.

### **Backend & Database**

- **Service**: **Supabase**
- **Usage**:
  - **Database**: PostgreSQL database for storing all application data (users, roles, donations, campaigns, etc.).
  - **Authentication**: Manages user sign-up, sign-in, and session management.
  - **Storage**: Used for hosting user-uploaded files and public assets.
- **Location**: `src/integrations/supabase/`, `supabase/migrations/`

### **Frontend Framework**

- **Service**: **Next.js & React**
- **Usage**: The core framework for building the user interface, server-side rendering, and API routes.
- **Location**: `src/app/`, `next.config.mjs`

### **UI & Styling**

- **Library**: **Tailwind CSS**
- **Usage**: A utility-first CSS framework for all styling.
- **Location**: `tailwind.config.ts`, `src/app/globals.css`

- **Library**: **shadcn/ui & Radix UI**
- **Usage**: Provides the foundational, unstyled, accessible components for UI elements like dropdowns, dialogs, buttons, and forms.
- **Location**: `src/components/ui/`

- **Library**: **Framer Motion**
- **Usage**: Powers all animations and transitions throughout the application for a fluid user experience.
- **Location**: Used within various components like `HeroSection.tsx`.

### **State Management & Data Fetching**

- **Library**: **TanStack Query (React Query)**
- **Usage**: Manages server state, caching, and data fetching from the Supabase backend, providing a robust and efficient data synchronization strategy.
- **Location**: `src/components/Providers.tsx`

---

## 2. To Be Integrated Features

These are planned features and the services we intend to use to implement them.

### **Payment Processing**

- **Service**: **Chapa**
- **Usage**: To process all financial transactions, including donations, tithes (`Aserat`), vows (`Selet`), and annual contributions (`Gbir`). Chapa is the primary choice for handling payments in ETB.
- **Status**: **Not Integrated**. Requires creating API endpoints and a client-side integration to connect with the Chapa payment gateway.

### **AI Chat Assistant**

- **Service**: **OpenAI API (GPT-4) or Anthropic API (Claude)**
- **Usage**: To power the backend of the AI Chat Assistant for both members and admins. This will handle natural language understanding and response generation.
- **Status**: **Partially Integrated**. Frontend UI is complete. Backend API routes (`/api/chat/*`) exist but need to be connected to a live AI service.

### **Push Notifications**

- **Service**: **Supabase Realtime & Web Push (e.g., Firebase Cloud Messaging - FCM)**
- **Usage**: To send real-time notifications to users about donation confirmations, campaign updates, and payment reminders.
- **Status**: **Not Integrated**. Requires setting up Supabase Realtime listeners and a service worker for web push notifications.

### **Analytics**

- **Service**: **Vercel Analytics**
- **Usage**: To gather privacy-friendly analytics on user engagement, page views, and feature usage directly within the Vercel dashboard.
- **Status**: **Not Integrated**. Can be enabled with a single click in the Vercel project settings.
