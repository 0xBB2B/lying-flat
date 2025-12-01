# Japan Leave Management System

A modern, cyberpunk-themed web application for managing employee leave records, specifically tailored for Japanese labor laws. Built with React, Vite, and Tailwind CSS.

## Features

- **Employee Management**: Add, update, and remove employee records.
- **Leave Tracking**: Track leave usage and history for each employee.
- **Automated Calculation**: Automatically calculates annual leave entitlement based on hire date (Japanese Labor Standards).
- **Dark Mode**: Fully supported dark mode with a sleek cyberpunk aesthetic.
- **Data Persistence**: All data is saved locally in the browser (LocalStorage).
- **Responsive Design**: Works seamlessly on desktop and mobile devices.

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts

## Run Locally

**Prerequisites:** Node.js (v18+ recommended) and pnpm.

1.  **Clone the repository:**

    ```bash
    git clone <your-repo-url>
    cd lying-flat
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Start the development server:**

    ```bash
    pnpm dev
    ```

4.  **Build for production:**
    ```bash
    pnpm build
    ```

## Deployment

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

1.  Push your changes to the `main` branch.
2.  Go to your repository **Settings** > **Pages**.
3.  Under **Build and deployment**, ensure **Source** is set to **GitHub Actions**.
4.  The workflow will automatically build and deploy the app to the `gh-pages` environment.

## License

This project is private and proprietary.
