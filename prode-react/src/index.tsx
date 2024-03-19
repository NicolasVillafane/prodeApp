import { createRoot } from 'react-dom/client';
import App from './App';

const el: any = document.getElementById('root');
const root = createRoot(el);

root.render(<App />);
