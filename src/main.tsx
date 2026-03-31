import React from 'react';
import ReactDOM from 'react-dom/client';
import { Agentation } from 'agentation';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Agentation endpoint="http://localhost:4747" />
  </React.StrictMode>
);
