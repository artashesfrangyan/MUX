import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Не найден элемент #root');

// StrictMode не используется намеренно: в dev-режиме он монтирует компоненты дважды,
// из-за чего одновременно запускаются два цикла ReceiveNotification (long polling).
createRoot(container).render(<App />);
