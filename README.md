
# 내부 문서 챗봇

사용자가 제공한 문서 내용을 기반으로 질문에 답변하는 챗봇입니다. 정책 문서, 설계 사양서 등 내부 팀용으로 적합합니다.

## 주요 기능

*   문서 기반 질의응답
*   관리자 대시보드 (문서 관리, 사용자 통계, FAQ 관리)
*   다양한 챗봇 응답 스타일 (AI 비서, 친절한 어린이, 구조화된 개요)
*   고급 챗봇 설정 (Temperature, Top-K, Top-P, Max Tokens)
*   FAQ 기반 빠른 답변
*   사용자 인증 및 팀 관리

## 기술 스택

*   React 19 (via esm.sh)
*   TypeScript
*   Tailwind CSS
*   Google Gemini API (@google/genai via esm.sh)

## 사전 요구 사항

1.  **Web Browser**: A modern web browser that supports ES6 modules.
2.  **GitHub Account**: To host your code.
3.  **Vercel Account**: To deploy the application.
4.  **API Key**: You **must** have a valid Google Gemini API Key.

## 로컬 실행 방법

1.  **Clone the repository (or download the files):**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **API Key (Conceptual for Local):**
    The application code in `App.tsx` expects `process.env.API_KEY`. For client-side execution without a build step that injects environment variables (like opening `index.html` directly or via a simple static server), this variable won't be available from the OS.
    *   **Note:** The primary way to use the `API_KEY` securely is by setting it in your deployment environment (like Vercel).
    *   For purely local testing *if absolutely necessary and not for production*, you might temporarily modify the code to hardcode it or use a local configuration, but this is not recommended and against the API key guidelines for the final deployed app.

3.  **Serve `index.html`:**
    You can open the `index.html` file directly in your browser, or use a simple HTTP server. For example, using Python's built-in server:
    ```bash
    python -m http.server
    ```
    Or using `npx`:
    ```bash
    npx serve .
    ```
    Then open `http://localhost:<port>` (e.g., `http://localhost:8000` or `http://localhost:3000`) in your browser.

## Vercel 배포 방법

This project is structured as a static site and can be easily deployed to Vercel.

1.  **Push to GitHub:** Ensure all your latest code (including `index.html`, `.tsx` files, `components/`, `package.json`) is pushed to your GitHub repository.

2.  **Connect to Vercel:**
    *   Sign up or log in to [Vercel](https://vercel.com/) using your GitHub account.
    *   Click "Add New..." -> "Project".
    *   Import your GitHub repository.

3.  **Configure Project in Vercel:**
    *   **Framework Preset:** Vercel might auto-detect it or you might need to select "**Other**".
    *   **Build and Output Settings:**
        *   **Build Command:** You can likely leave this **blank**. If Vercel requires a command, you can enter: `echo "Static site, no build step needed."`
        *   **Output Directory:** Leave this **blank** (Vercel will typically serve from the root for static sites if no specific build output directory is generated).
        *   **Install Command:** Leave this **blank**.
    *   **Environment Variables (CRITICAL):**
        *   Navigate to your project's "Settings" tab in Vercel.
        *   Go to "Environment Variables".
        *   Add a new variable:
            *   **Name:** `API_KEY`
            *   **Value:** Paste your actual Google Gemini API Key here.
        *   Ensure the variable is available for all environments (Production, Preview, Development).
        *   Save the environment variables.

4.  **Deploy:** Click the "Deploy" button. Vercel will build (if a command is given, otherwise just prepare) and deploy your site. You'll get a unique URL for your chatbot.

## 관리자 계정

Default admin accounts (username: password):
*   `원창연`: `1234`
*   `오종하`: `1234`
*   `김태현`: `1234`

## 주요 파일 구조

*   `index.html`: Main HTML file, loads scripts and styles.
*   `index.tsx`: Entry point for the React application.
*   `App.tsx`: Main application component, handles state and logic.
*   `package.json`: Project metadata (minimal, no build scripts for this setup).
*   `components/`: Contains React components for different parts of the UI.
*   `types.ts`: TypeScript type definitions.
*   `utils.ts`: Utility functions.
*   `metadata.json`: Application metadata.
*   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
*   `README.md`: This file.