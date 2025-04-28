# Meal Calorie Tracker - Quick Start

This guide provides the essential steps to set up and run the Meal Calorie Tracker application locally.

## Prerequisites

*   **Node.js & npm:** Download and install from [https://nodejs.org/](https://nodejs.org/)
*   **MongoDB:** Install locally ([Community Server](https://www.mongodb.com/try/download/community)) or use a cloud service ([Atlas](https://www.mongodb.com/cloud/atlas)). You'll need the connection string.

## Setup & Run

1.  **Clone the Repository (if you haven't already):**
    ```bash
    # Replace <your-repository-url> with the actual URL
    git clone <your-repository-url> 
    cd meal-calorie-tracker
    ```

2.  **Set up Backend:**
    *   Navigate to the server directory:
        ```bash
        cd server
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Create a `.env` file in the `server` directory (`meal-calorie-tracker/server/.env`) with the following content, replacing placeholders with your values:
        ```env
        MONGO_URI=your_mongodb_connection_string
        PORT=5000
        JWT_SECRET=your_strong_random_jwt_secret
        JWT_EXPIRE=30d
        ```

3.  **Set up Frontend:**
    *   Navigate to the client directory (from the project root `meal-calorie-tracker`):
        ```bash
        cd ../client 
        # Or if you are in the root: cd client
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```

4.  **Run the Application (Requires 2 Terminals):**

    *   **Terminal 1: Start Backend**
        *   Navigate to the `server` directory (`meal-calorie-tracker/server`).
        *   Run:
            ```bash
            npm start
            ```
        *   *(Wait for the "Server running on port..." message)*

    *   **Terminal 2: Start Frontend**
        *   Navigate to the `client` directory (`meal-calorie-tracker/client`).
        *   Run:
            ```bash
            npm run dev
            ```
        *   *(Vite will provide a URL like http://localhost:5173)*

5.  **Access:** Open the URL provided by the frontend (e.g., `http://localhost:5173`) in your browser.

## Key Features

*   **User Authentication:** Secure registration and login using JWT.
*   **Dashboard:** Overview of daily calorie intake vs. goals.
*   **Meal Logging:** Record meals with date, description, and calorie count.
*   **Meal History:** View and manage past meal entries.
*   **Calorie Goal Setting:** Set and update personal daily calorie targets.
*   **Protected Routes:** Ensures only authenticated users can access the main application features.
*   **(Potential) Nutritional Information:** Integration with an external service (like USDA FoodData Central) to fetch nutritional details for logged foods (based on `foodDataCentralService.js`).
*   **User Profile/Settings:** Manage user account details (implied by `Profile.jsx`/`Settings.jsx`).