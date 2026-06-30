# Digital Friend - AI Support Chatbot 🤖

This is an AI-powered customer support chatbot web application designed for **Digital Friend**. The application allows users to ask questions, receive polite, intelligent support responses (constrained to under 150 words), view and manage chat history, copy responses, regenerate answers, and export transcripts.

It supports **OpenAI (GPT-4o-mini)**, **Gemini (2.5 Flash)**, and features an integrated **Mock Support Agent** that works out-of-the-box without requiring any API keys.

---

## 🌟 Key Features

### Core Requirements
*   **Chat Interface**: Elegant user messaging, AI responses, auto-scroll, and dynamic typing indicator.
*   **API Integration**: Seamless integration with OpenAI and Gemini API.
*   **Robust Fallback**: If no API key is provided, the system falls back to a custom-tailored **Mock Support Agent** answering questions about Digital Friend.
*   **Conversation History**: SQLite database persistence to store chat sessions and messages across reloads.
*   **Polite Support Persona**: Strictly adheres to: *"You are a customer support executive of Digital Friend. Answer politely in less than 150 words."*

### Bonus Features (Fully Implemented)
*   🎨 **Theme Toggle**: Beautiful dark and light modes with glassmorphic visuals.
*   📝 **Markdown Support**: Custom Markdown parsing rendering lists, bold text, links, and code blocks beautifully.
*   📋 **Copy Response**: Clipboard copier button directly on message bubbles.
*   🔄 **Regenerate Answer**: Refresh button to recreate responses from the AI.
*   💾 **Chat Export**: Download conversation history in JSON or plain text formats.
*   🧠 **Conversation Memory**: Feeds previous context/messages to LLM APIs to maintain continuity.

---

## 🛠️ Architecture & Tech Stack

*   **Frontend**: React (built with Vite), Lucide React (Icons), and Vanilla CSS (featuring premium glassmorphism and custom animation effects).
*   **Backend**: Node.js & Express server.
*   **Database**: SQLite (`sqlite3` package) with automated table creation.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm

### Installation

1.  **Backend Setup**:
    Open a terminal, navigate to the `backend/` directory, and install dependencies:
    ```bash
    cd backend
    npm install
    ```

    *(Optional)* Create a `.env` file in the `backend/` directory to configure global API keys:
    ```env
    PORT=5000
    DATABASE_URL=database.sqlite
    OPENAI_API_KEY=your_openai_api_key_here
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

2.  **Frontend Setup**:
    Open a new terminal, navigate to the `frontend/` directory, and install dependencies:
    ```bash
    cd frontend
    npm install
    ```

---

## 🏃 Running the Application

### 1. Start the Backend Server
In the `backend/` directory, run:
```bash
npm start
```
The server will start at `http://localhost:5000` and initialize a local `database.sqlite` file.

### 2. Start the Frontend Dev Server
In the `frontend/` directory, run:
```bash
npm run dev
```
Open the URL shown in the terminal (usually `http://localhost:5173`) in your web browser.

---

## 🧪 Testing Guidelines

1.  **Mock Support Executive (No Setup Required)**:
    By default, the application runs in **Mock mode**. Ask the chatbot questions like:
    *   *"What services do you offer?"*
    *   *"Where are you located?"*
    *   *"How can I apply for an internship?"*
    *   The Mock Agent responds using Digital Friend's real company data ( Ahmedabad, Gujarat, SEO, web design, contact details).
2.  **LLM APIs (OpenAI/Gemini)**:
    *   Click on **Settings & LLM** in the bottom-left sidebar.
    *   Select your provider (**Gemini** or **OpenAI**).
    *   Enter your API Key and click **Save Settings**.
    *   Ask a question; the assistant will use the selected model while strictly adhering to the under-150-word support persona.

---

## 📂 Code Structure

```text
├── backend/
│   ├── db.js             # SQLite database connections and table schemas
│   ├── server.js         # Express app, endpoint logic, and LLM API handlers
│   ├── mockAgent.js      # Customer support replies for mock fallback
│   ├── test-mock.js      # Testing tool for mock responder
│   └── package.json
└── frontend/
    ├── index.html        # Main HTML file
    ├── src/
    │   ├── main.jsx      # React entrypoint
    │   ├── App.jsx       # Chat layout, sidebars, modals, and states
    │   └── index.css     # CSS style tokens and glassmorphism definitions
    └── package.json
```
