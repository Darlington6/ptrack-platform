# pTrack Frontend

This frontend is the pTrack React + Vite app, migrated to TypeScript.

## Development

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173` during development.

## Notes

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this app because of its impact on dev and build performance. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
