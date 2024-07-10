import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Join from './components/Join';
import CallRoom from './components/CallRoom';


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Join />} />
                <Route path="/call" element={<CallRoom />} />
            </Routes>
        </Router>
    );
}

export default App;
