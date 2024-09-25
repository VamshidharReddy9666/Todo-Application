import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { setAuthToken } from './services/authService';

const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);