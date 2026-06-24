# Marga-Drishti

## Project Overview

Marga-Drishti is a sophisticated, browser-based traffic and mobility analytics platform. Built with a modern React stack, it leverages the power of DuckDB WebAssembly (WASM) to perform high-performance SQL queries directly in the client browser against statically hosted Parquet and JSON files. This architecture eliminates the need for a traditional backend database server, offering a completely serverless, highly responsive analytics experience.

The application provides deep insights into geospatial data, temporal trends, and network intelligence, alongside a simulation studio for modeling traffic scenarios.

## Key Features

- **Client-Side Analytics Engine:** Utilizes DuckDB-WASM and Apache Arrow for lightning-fast, in-browser data processing without a backend database.
- **Geospatial Visualization:** Interactive map-based analytics using MapLibre GL JS and Deck.gl for rendering complex, high-performance map layers.
- **Temporal Analysis:** Time-series data visualization powered by Recharts.
- **Simulation Studio:** Tools for modeling and visualizing network intelligence and traffic simulations.
- **Exploratory Sandbox:** An interactive environment for ad-hoc data exploration.
- **Robust State Management:** Centralized application state using Zustand, divided into specialized stores for different domains (e.g., geospatial, temporal, network).
- **Modern UI/UX:** Built with Tailwind CSS and shadcn/ui components for a sleek, responsive, and accessible user interface.
- **In-App Documentation:** Comprehensive, built-in guides covering simulation models, features, and aggregation methodologies.

## Technology Stack

### Core
- **Framework:** React 19 / Vite
- **Routing:** React Router v7
- **State Management:** Zustand
- **Styling:** Tailwind CSS (v4), class-variance-authority, clsx, tailwind-merge
- **UI Components:** shadcn/ui, Base UI, Hugeicons, Lucide React

### Data & Analytics
- **In-Browser Database:** DuckDB-WASM
- **Data Format:** Apache Arrow, Parquet, JSON
- **Charting:** Recharts

### Geospatial
- **Map Rendering:** MapLibre GL JS
- **Data Visualization Layers:** Deck.gl

## Architecture Overview

Marga-Drishti operates on a "Serverless Data" architecture:

1.  **Data Storage:** Raw data is stored as optimized `.parquet` and `.json` files within the `public/data` directory.
2.  **Data Indexing:** During the build process, a Node.js script (`generate_data_index.js`) scans the data directory and generates an `index.json` registry of all available datasets.
3.  **Data Loading:** The React application fetches the index and registers the relevant data files directly into the DuckDB-WASM virtual file system.
4.  **Query Execution:** User interactions trigger SQL queries via the `DuckDBEngine` (managed by `queries.js` and Web Workers). These queries run entirely within the user's browser.
5.  **Visualization:** Query results (often in Apache Arrow format) are passed to Deck.gl layers or Recharts for rendering.

## Repository Structure

```text
marga-drishti/
├── public/                 # Static assets and raw data files
│   └── data/               # Parquet and JSON data files (indexed at build time)
├── scripts/                # Utility scripts (e.g., fix-duckdb-sourcemaps.mjs)
├── src/                    # Main application source code
│   ├── app/                # Application entry points and global providers (App.jsx, main.jsx)
│   ├── components/         # Reusable UI components (shadcn/ui, base components)
│   ├── core/               # Core business logic and data engines
│   │   ├── arrow/          # Apache Arrow utilities
│   │   ├── config/         # Application configuration
│   │   ├── engine/         # DuckDB-WASM wrapper, queries, and Web Worker logic
│   │   └── storage/        # Storage utilities
│   ├── hooks/              # Custom React hooks
│   ├── layouts/            # Page layouts (e.g., standard app layout with sidebar/header)
│   ├── lib/                # Utility functions and helpers
│   ├── pages/              # Route-specific page components
│   │   ├── analytics/      # Geospatial, Temporal, Executive, Sandbox pages
│   │   ├── docs/           # Documentation pages rendered in-app
│   │   ├── simulation/     # Simulation Studio and Network Intelligence pages
│   │   └── system/         # Settings page
│   └── store/              # Zustand state stores (e.g., useGeospatialStore.js)
├── components.json         # shadcn/ui configuration
├── eslint.config.js        # ESLint configuration
├── generate_data_index.js  # Build script to index public/data
├── package.json            # Project dependencies and npm scripts
├── vercel.json             # Vercel deployment configuration (headers & rewrites)
└── vite.config.js          # Vite build configuration
```

## Prerequisites

- **Node.js:** v18.0.0 or higher recommended.
- **npm:** v9.0.0 or higher.

## Installation Instructions

1.  Clone the repository to your local machine.
2.  Navigate to the project root directory:
    ```bash
    cd marga-drishti
    ```
3.  Install the project dependencies:
    ```bash
    npm install
    ```

## Environment Configuration

*Not identified from the codebase.* The application appears to run entirely client-side without relying on external API keys or environment variables for its core data querying functionality, relying instead on static files in `public/data`.

## Running the Application

To start the development server:

```bash
npm run dev
```

This will launch Vite on `http://localhost:5173/` (or the next available port).

## Build Process

To build the application for production:

```bash
npm run build
```

**Build Pipeline:**
1.  **Data Indexing:** The command first executes `node generate_data_index.js`. This script traverses the `public/data` directory, identifies `.parquet` and `.json` files, and generates `public/data/index.json`. This index is crucial for the DuckDB engine to know what tables are available.
2.  **Asset Bundling:** Vite then bundles the React application, CSS, and optimizes dependencies, placing the output in the `dist/` directory.

## Deployment Instructions

The repository is pre-configured for deployment on **Vercel**, as indicated by the `vercel.json` file.

**Crucial Deployment Requirement:**
DuckDB-WASM requires specific security headers to enable SharedArrayBuffer for optimal performance. The `vercel.json` file ensures these headers are set:

```json
{
  "key": "Cross-Origin-Opener-Policy",
  "value": "same-origin"
},
{
  "key": "Cross-Origin-Embedder-Policy",
  "value": "credentialless"
}
```

To deploy:
1.  Connect the repository to your Vercel account.
2.  Set the Build Command to `npm run build`.
3.  Set the Output Directory to `dist`.
4.  Deploy.

## Available Scripts and Commands

- `npm run dev`: Starts the local Vite development server.
- `npm run build`: Generates the data index and builds the application for production.
- `npm run lint`: Runs ESLint to check for code quality and formatting issues.
- `npm run preview`: Locally previews the production build generated in the `dist/` folder.
- `npm run postinstall`: Executes `scripts/fix-duckdb-sourcemaps.mjs` to patch any issues with DuckDB-WASM sourcemaps after module installation.

## Data Flow / System Design Overview

1.  **Initialization:** On application load, `DuckDBEngine` initializes a Web Worker containing the DuckDB WASM binary.
2.  **Mounting:** It fetches `public/data/index.json` and creates views/tables inside the DuckDB instance mapping to the static Parquet files via HTTP Range requests.
3.  **Interaction:** A user interacts with the UI (e.g., changes a date filter on the `TemporalAnalysis` page).
4.  **State Update:** The component updates the relevant Zustand store (e.g., `useTemporalStore`).
5.  **Query Generation:** A React `useEffect` or an action in `queries.js` detects the state change and formulates a SQL query string based on the new filters.
6.  **Execution:** The query is dispatched to the `DuckDBEngine` worker.
7.  **Result Handling:** DuckDB executes the query against the Parquet files (fetching only the required byte ranges) and returns an Apache Arrow table or JSON array.
8.  **Rendering:** The application state is updated with the query results, triggering a re-render of the Recharts or Deck.gl components to display the new data.

## Configuration Details

- **Vite (`vite.config.js`):** Configured with React and Tailwind plugins. Sets up path aliases (`@/`, `@app/`, `@components/`, etc.) for cleaner imports. Enforces COOP/COEP headers for local development to mirror the production Vercel environment.
- **shadcn/ui (`components.json`):** Configured to use the "base-mira" style, standard CSS variables, and the Hugeicons library.
- **Tailwind CSS:** Configured via Vite plugin (`@tailwindcss/vite`), utilizing CSS variables defined in `src/index.css`.

## API Integration Details

*Not identified from the codebase.* The application is designed to query static files rather than relying on external REST or GraphQL APIs for its primary data source.

## Important Dependencies and Their Purpose

- `@duckdb/duckdb-wasm`: The core engine enabling in-browser SQL querying.
- `apache-arrow`: Used for efficient, zero-copy data transfer between DuckDB and visualization layers.
- `deck.gl` / `@deck.gl/react`: High-performance WebGL-powered data visualization (used for large-scale map overlays).
- `maplibre-gl` / `react-map-gl`: Provides the base map tiles and camera controls.
- `zustand`: A small, fast, and scalable bearbones state-management solution.
- `recharts`: A composable charting library built on React components.
- `shadcn`: A collection of re-usable components built with Radix UI and Tailwind CSS.
- `lucide-react` & `@hugeicons/react`: Icon libraries used throughout the UI.

## Usage Guide

1.  Navigate to the **Analytics** section via the sidebar to view high-level summaries and temporal/geospatial breakdowns.
2.  Use the **Geospatial Analysis** page to explore data overlayed on the map. Adjust filters (time, category) to see the Deck.gl layers update dynamically.
3.  The **Simulation Studio** provides tools for modeling hypothetical traffic scenarios based on the ingested network data.
4.  Consult the **Docs** section for detailed explanations of the underlying simulation models, aggregation methodologies, and feature capabilities.
5.  Check the **Settings** page to toggle application themes or adjust global configurations.

## Troubleshooting / Common Issues

- **"SharedArrayBuffer is not defined" Error:** This occurs if the COOP and COEP headers are not set correctly. Ensure your development server or production host (Vercel) is serving the application with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless`.
- **Data Not Loading/Empty Charts:** 
    - Ensure `npm run build` (or at least `node generate_data_index.js`) has been run so that `public/data/index.json` exists.
    - Verify that actual `.parquet` or `.json` files exist within the `public/data` directory.

## Contributing Guidelines

1.  Ensure all new components are styled using Tailwind CSS and, where applicable, standard shadcn/ui components.
2.  Run `npm run lint` before committing to ensure code style consistency.
3.  Keep data fetching and query logic contained within the `src/core/engine` and `queries.js` modules, abstracting it away from the UI components.

## License Information

*Not explicitly identified from the codebase.*
