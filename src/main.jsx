import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from "react-router";
import "./lang/i18next.js";
import '@mantine/core/styles.css';
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import 'mantine-datatable/styles.layer.css';
import './index.css'

import App from './app/App.jsx'
import { createTheme, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { Provider } from 'react-redux';
import { store } from './app/store';

const theme = createTheme({
  primaryColor: "indigo",
  fontFamily: "Open Sans, sans-serif",
  fontSizes: {
    "2xs": "10px",
    "3xs": "8px",
    "4xs": "6px",
    les: "4px",
    es: "2px",
  },
  spacing: {
    "2xs": "10px",
    "3xs": "8px",
    "4xs": "6px",
    les: "4px",
    mes: "2px",
    es: "1px",
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <MantineProvider theme={theme} withNormalizeCSS withGlobalStyles>
        <HashRouter>
          <ModalsProvider>
            <App />
            <Notifications />
          </ModalsProvider>
        </HashRouter>
      </MantineProvider>
    </Provider>
  </StrictMode>,
)
