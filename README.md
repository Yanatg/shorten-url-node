# Short URL Service

A web application built with **Node.js (Express)** and **Vue.js (Vite)** that allows users to shorten long URLs, generate QR codes, and view their history if logged in.

<img width="1440" alt="image" src="https://github.com/user-attachments/assets/26b773b0-9adf-4de3-8a5d-f694ba3bd49f" />

## Features

* Shorten any valid URL into a shorter code.
* Redirect from short URL to the original URL.
* Track the number of visits for each short URL.
* User registration and login.
* Logged-in users can view a history of the URLs they have shortened, including visit stats.
* Logged-in users can delete URLs from their history.
* Generate QR codes for shortened URLs (displayed in a modal).
* Anonymous URL shortening supported (history not tracked).
* Duplicate URL checking for logged-in users (returns existing short URL).

## Tech Stack

* **Backend:**
    * Node.js
    * Express.js
    * PostgreSQL (Database)
    * `node-postgres` (`pg`) (PostgreSQL client)
    * `express-session` (Session management)
    * `bcrypt` (Password hashing)
    * `dotenv` (Environment variables)
    * `cors` (Cross-Origin Resource Sharing)
* **Frontend:**
    * Vue.js 3 (Composition API w/ `<script setup>`)
    * Vite (Build tool)
    * Vue Router (Routing)
    * Pinia (State management)
    * Axios (HTTP client)
    * Tailwind CSS (Utility-first CSS framework)
    * `qrcode.vue` (QR Code generation component)
* **Development:**
    * `nodemon` (Backend auto-reload)
    * npm or yarn (Package management)

## Prerequisites

* Node.js (v16 or later recommended)
* npm or yarn
* PostgreSQL Server (running and accessible)
* Git (for cloning)

## Installation & Setup Guide

Follow these steps to set up the project for local development.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Yanatg/shorten-url-node.git
    cd shorten-url-node
    ```

2.  **Backend Setup:**
    * Navigate into the backend directory:
        ```bash
        cd backend
        ```
    * Install dependencies:
        ```bash
        npm install
        ```
    * **Database Setup:**
        * Connect to your PostgreSQL instance (using `psql`, pgAdmin, DBeaver, etc.).
        * Create a database (e.g., `short_url_db`).
        * Create a user with privileges on that database (e.g., `short_url_user`).
        * Create the necessary tables (`users`, `urls`) according to the schema discussed (refer to ER Diagram if available).
            * **Important:** The `urls` table **must allow NULL** values in the `user_id` column to support anonymous URL shortening. If it doesn't, run: `ALTER TABLE urls ALTER COLUMN user_id DROP NOT NULL;`
    * **Environment Variables:**
        * Copy the example environment file: `cp .env.example .env`
        * Edit the `.env` file with your configuration:
            ```dotenv
            # PostgreSQL Database Connection Details
            DB_HOST=localhost
            DB_PORT=5432
            DB_USER=your_db_user         # Your DB username
            DB_PASSWORD=your_db_password # Your DB password
            DB_DATABASE=short_url_db     # Your DB name

            # Base URL for the backend server itself (used for constructing short URLs)
            # Include protocol, no trailing slash
            BASE_URL=http://localhost:3000
            ```

3.  **Frontend Setup:**
    * Navigate into the frontend directory (from the root):
        ```bash
        cd ../frontend
        # Or if you are in ./backend: cd ../frontend
        ```
    * Install dependencies:
        ```bash
        npm install
        ```
    * **Environment Variables:**
        * Copy the example environment file: `cp .env.example .env` (If `.env.example` is not present, create `.env` manually).
        * Edit the `.env` file:
            ```dotenv
            # URL where the backend API can be reached (no trailing slash)
            VITE_API_BASE_URL=http://localhost:3000/api

            # Base URL for the redirect links (usually same as backend BASE_URL for local dev)
            # Used by frontend to display full short links and generate QR codes (no trailing slash)
            VITE_APP_BASE_REDIRECT_URL=http://localhost:3000
            ```

## Running the Application

You need to run both the backend and frontend servers concurrently in separate terminals.

1.  **Run Backend Server:**
    * Navigate to the `backend` directory.
    * Run:
        ```bash
        npm run dev
        ```
    * The backend API should start, typically on `http://localhost:3000`.

2.  **Run Frontend Server:**
    * Navigate to the `frontend` directory.
    * Run:
        ```bash
        npm run dev
        ```
    * The frontend development server should start, typically on `http://localhost:5173`. Open this URL in your browser.


