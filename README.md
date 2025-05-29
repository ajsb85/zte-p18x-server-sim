# ZTE P18X API Simulator

This project provides a Node.js-based REST API simulator for the ZTE P18X Web UI.
It's designed to help develop and test applications that interact with this device by providing mock responses.

## Project Structure

(Details about the project structure can be added here)

## Prerequisites

- Node.js (v14.x or later recommended)
- npm (usually comes with Node.js)

## Setup

1.  **Clone the repository (if applicable):**

    ```bash
    # git clone <your-repo-url>
    # cd zte-p18x-server-sim
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the Simulator

- **Development mode (with auto-restart on file changes):**

  ```bash
  npm run dev
  ```

- **Production mode:**
  ```bash
  npm start
  ```

The server will typically start on `http://localhost:3000`.

## API Endpoints

- `GET /goform/goform_get_cmd_process?cmd=...[&isMulti=1]`
- `POST /goform/goform_set_cmd_process` (with `goformId` and other parameters in the body)
- `GET /zte_web/web/version`

## Linting and Formatting

- **Run ESLint:**
  ```bash
  npm run lint
  ```
- **Fix ESLint issues:**
  ```bash
  npm run lint:fix
  ```
- **Check Prettier formatting:**
  ```bash
  npm run prettier
  ```
- **Fix Prettier formatting:**
  ```bash
  npm run prettier:fix
  ```

## Testing

- **Run Jest tests:**
  ```bash
  npm test
  ```
- **Run Jest tests in watch mode:**

  ```bash
  npm run test:watch
  ```

  Coverage reports are generated in the `./coverage` directory.

- **Run Postman/Newman tests:**
  Ensure the server is running. Then:
  ```bash
  npm run postman:run
  ```
  Or directly:
  ```bash
  ./run_postman_tests.sh
  ```
  HTML and JUnit reports will be saved in the `postman/reports` directory.

## VS Code Integration

This project is set up with VS Code configurations for:

- Recommended extensions (`.vscode/extensions.json`)
- Debug launch configurations (`.vscode/launch.json`) for the server and Jest tests.
- Workspace settings (`.vscode/settings.json`) for formatting and linting.
- Tasks (`.vscode/tasks.json`) for common operations like starting the server, running tests, and linting.

## Contributing

(Add contribution guidelines if this is a shared project)

## License

MIT
