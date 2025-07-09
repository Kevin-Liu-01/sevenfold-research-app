# Ketspen

Ketspen is an agentic research environment designed to streamline the process of finding, digesting, and producing research. By learning the context of your project, Ketspen provides smarter, more relevant results, helping you accelerate your research workflow.

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Configuration](#configuration) ************(NEW \ added Configuration: makes sure devs dont get stuck where to put api. covers full process from clone to running app)
   - [Running the Application](#running-the-application)
   - [Building for Production](#building-for-production)
3. [Usage Examples](#usage-examples) ************(NEW \ Added Usage Examples: shows CLI script call/ cURL API fetch/ Brief UI description)
4. [Project Structure](#project-structure) ******* (Might wanna add "scripts" to tree structure)
6. [Scripts](#code-quality--scripts) ************(NEW\ not added yet)
7. [Contributing](#contributing)
8. [Changelog](#roadmap--changelog) ************(NEW\ not added yet)
9. [License & Authors](#license--authors)
   
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

### Configuration
(IN PROGRESS)
```
cp.env.example.env
```

### Running the Application

1. **Start the development server:**

   ```bash
   pnpm dev
   ```

2. **Open your browser:**

   Navigate to `http://localhost:5173` to see the application in action.

## Usage Examples
CLI
```
placeholder; add text
```

API
```
placeholder; add text
```

UI
```
The dashboard displays your recEnt projects and a search bar
```

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

## Licenses & Authors
Released under... (Does this need a License file)

Maintained by...
