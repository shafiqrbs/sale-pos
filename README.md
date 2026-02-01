# example-buildable-electronjs

The repository [example-buildable-electronjs](https://github.com/Sharif-Minhaz/example-buildable-electronjs) provides a comprehensive template for building cross-platform desktop applications using Electron.js, React, and Vite. It is configured to utilize Electron Forge for packaging and distribution, supporting both Windows and Linux platforms. If it runs on offline mode, it will use the SQLite database for data persistence and when it runs on online mode, it will use the default api to fetch data. Also user can synchronize data between offline and online mode. It also includes a preload script to establish a secure communication channel between the main and renderer processes.

**Key Features:**

- **Electron.js Integration:** Leverages Electron.js to create native desktop applications with web technologies.
- **React with Vite:** Utilizes React for building user interfaces, bundled efficiently with Vite for rapid development.
- **SQLite Database Support:** Implements local data storage using SQLite via the `better-sqlite3` package, facilitating offline data persistence.
- **Electron Forge Configuration:** Employs Electron Forge for streamlined packaging and distribution, with configurations tailored for both Windows and Linux builds.
- **Preload Script with Context Bridge:** Uses a preload script to securely expose Node.js functionalities to the renderer process, ensuring a secure and efficient communication channel.

**Project Structure (client):**

- **`index.cjs`:** Main process script initializing the application, managing windows, and handling lifecycle events.
- **`preload.cjs`:** Preload script that sets up a secure context bridge between the main and renderer processes.
- **`App.jsx`:** React component serving as the entry point for the renderer process, managing UI and user interactions.
- **`db.cjs`:** Module handling SQLite database operations, providing functions for data manipulation and retrieval.

**Getting Started:**

1. **Installation:** Clone the repository and install dependencies using `npm install`.
2. **Development:** Start the development environment with `npm start`, which concurrently runs the React application and Electron.
3. **Building:** Package the application for distribution using `npm run make`, generating installers for the target platforms (**Windows**: `npm run make-win`).

This template serves as a solid foundation for developers looking to create robust, offline-capable desktop applications with modern web technologies, streamlined for efficient development and distribution.

```
sudo chown root /media/user-name/D/desktop_app_development/rms/node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 /media/user-name/D/desktop_app_development/rms/node_modules/electron/dist/chrome-sandbox
```

Execute to provide permission if folder is denying build

## TLDR;

### Run local development version

1. git pull
2. npm i
3. npm run build
4. npm start

### Build windows version

1. git pull
2. npm i
3. npm run build
4. npm run make
5. check /out/make/windowssquirrel/x64 directory and install it
