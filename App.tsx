import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import ModelViewer from './components/ModelViewer';

function App() {
  return (
    <ThemeProvider>
      <main className="w-full h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <ModelViewer />
      </main>
    </ThemeProvider>
  );
}

export default App;
