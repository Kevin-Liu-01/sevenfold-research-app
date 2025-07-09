# Ketspen

Ketspen is an agentic research environment designed to streamline the process of finding, digesting, and producing research. By learning the context of your project, Ketspen provides smarter, more relevant results, helping you accelerate your research workflow.

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Configuration](#configuration)
   - [Running the Application](#running-the-application)
   - [Building for Production](#building-for-production)
3. [Usage Examples](#usage-examples)
4. [Project Structure](#project-structure)
5. [Code Quality & Scripts](#code-quality--scripts)
6. [Contributing](#contributing)
7. [Roadmap & Changelog](#roadmap--changelog)
8. [License & Authors](#license--authors)
   
## Tech Stack

- **Frontend:**
  - [React](https://reactjs.org/)
  - [Vite](https://vitejs.dev/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
- **Backend:**
  - [Supabase](https://supabase.io/)
- **PDF Viewing:**
  - [PDF.js Express](https://pdfjs.express/)

## Getting Started 

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/ketspen.git
   cd ketspen
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

### Running the Application

1. **Start the development server:**

   ```bash
   pnpm dev
   ```

2. **Open your browser:**

   Navigate to `http://localhost:5173` to see the application in action.

## Project Structure

```
/
├── public/               # Static assets
├── src/                  # Source code
│   ├── assets/           # Images, fonts, etc.
│   ├── components/       # Reusable React components
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Application pages
│   └── services/         # External services (e.g., Supabase)
├── .gitignore            # Git ignore file
├── index.html            # Main HTML file
├── package.json          # Project metadata and dependencies
├── pnpm-lock.yaml        # PNPM lock file
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```
