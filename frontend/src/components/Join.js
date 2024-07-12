import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Join.css';

const Join = () => {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    const handleJoin = () => {
        if (username.trim()) {
            navigate(`/call?username=${username}`);
        }
    };

    return (
        <div >
        <div className="Join-heading">
             <h1>Real Time Interactive Audio Bot</h1>
        </div>
        <div className="Join-container">
        <div className="Join-form-group">
        <label className="Join-label">UserName</label>
          <input
            className="Join-input"
                type="text" 
                placeholder="Enter your username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
            />
        </div>
        <div className="Join-button-container">
            <button className="Join-button" onClick={handleJoin}>Connect</button>
            </div>
        </div>
        </div>
    );
};

export default Join;
