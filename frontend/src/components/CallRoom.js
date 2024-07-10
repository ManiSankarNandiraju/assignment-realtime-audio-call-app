import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import { FaMicrophone, FaMicrophoneSlash, FaSignOutAlt } from 'react-icons/fa';
import './CallRoom.css';
import Chat from './Chat';

const socket = io('Server Endpoint Place Holder', { reconnection: true }); // Enable reconnection

const CallRoom = () => {
    const [users, setUsers] = useState([]);
    const [voiceLevel, setVoiceLevel] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const username = params.get('username');
    const localAudioRef = useRef();
    const audioContextRef = useRef();
    const analyserRef = useRef();
    const userRefs = useRef({}); // Ref to keep track of user elements

    useEffect(() => {
        console.log('Connecting to socket...');
        socket.connect();

        console.log('Joining with username:', username);
        socket.emit('join', username);

        socket.on('user-joined', (users) => {
            console.log('User joined event received:', users);
            setUsers(users);
        });

        socket.on('user-left', (users) => {
            console.log('User left event received:', users);
            setUsers(users);
        });

        socket.on('user-muted', ({ username, isMuted }) => {
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.username === username ? { ...user, isMuted } : user
                )
            );
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            if (reason === 'io server disconnect') {
                socket.connect();
            }
        });

        socket.on('connect', () => {
            console.log('Reconnected to server');
            socket.emit('join', username);
        });

        return () => {
            socket.disconnect();
        };
    }, [username]);

    const handleMuteUnmute = () => {
        const stream = localAudioRef.current.srcObject;
        const enabled = stream.getAudioTracks()[0].enabled;
        stream.getAudioTracks()[0].enabled = !enabled;
        setIsMuted(!enabled);

        // Emit mute/unmute event to server
        socket.emit('mute-unmute', { username, isMuted: !enabled });

        // Update the mute status for the current user
        const updatedUsers = users.map((user) => {
            if (user.username === username) {
                return { ...user, isMuted: !enabled };
            }
            return user;
        });
        setUsers(updatedUsers);
    };

    const handleLeave = () => {
        socket.emit('leave', username);
        socket.disconnect();
        window.location.href = '/';
    };

    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                localAudioRef.current.srcObject = stream;
                localAudioRef.current.muted = true;

                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContextRef.current.createMediaStreamSource(stream);
                analyserRef.current = audioContextRef.current.createAnalyser();
                source.connect(analyserRef.current);
                analyserRef.current.fftSize = 256;

                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                const updateVoiceLevel = () => {
                    analyserRef.current.getByteTimeDomainData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += (dataArray[i] - 128) ** 2;
                    }
                    const rms = Math.sqrt(sum / bufferLength);
                    setVoiceLevel(rms);
                    requestAnimationFrame(updateVoiceLevel);
                };

                updateVoiceLevel();
            }).catch((err) => {
                console.error('Error accessing media devices.', err);
            });
        } else {
            console.error('getUserMedia not supported on your browser!');
        }
    }, []);

    useEffect(() => {
        // Add glowing effect based on voice level
        users.forEach((user) => {
            const userElement = userRefs.current[user.username];
            if (userElement) {
                if (voiceLevel > 3) { // Adjust the threshold value as needed
                    userElement.classList.add('glowing');
                } else {
                    userElement.classList.remove('glowing');
                }
            }
        });
    }, [voiceLevel, users]);

    return (
        <div className="call-room">
            <div className="callroom-heading">
                <h1>Audio Room</h1>
            </div>
            <div className="user-list">
                {users.map((user, index) => (
                    <div className="user-box" key={index} ref={(el) => userRefs.current[user.username] = el}>
                        <img src="/image.png" alt="User Avatar" />
                        <p>{user.username}</p>
                        {!user.isMuted && (
                        <FaMicrophoneSlash className="mute-symbol" />
                    )}
                    </div>
                ))}
            </div>
            <Chat username={username} socket={socket} />
            <div className="control-buttons">
                <button onClick={handleMuteUnmute} className={`control-button ${isMuted ? 'unmuted' : 'muted'}`}>
                    {isMuted ? <FaMicrophone /> : <FaMicrophoneSlash />}
                </button>
                <button onClick={handleLeave} className="control-button leave-button" title="Leave">
                    <FaSignOutAlt />
                </button>
            </div>
            <div className="voice-level">
                <progress value={voiceLevel} max="25"></progress>
            </div>
            <audio ref={localAudioRef} autoPlay></audio>
        </div>
    );
};

export default CallRoom;