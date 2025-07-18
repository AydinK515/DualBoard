import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { WhiteboardPage } from './pages/WhiteboardPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/whiteboard" element={<WhiteboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;