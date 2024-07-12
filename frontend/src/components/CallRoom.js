import React, { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import { FaMicrophone, FaMicrophoneSlash, FaSignOutAlt, FaPaperPlane } from 'react-icons/fa';
import './CallRoom.css';
import './Chat.css';

const socket = io('Server Endpoint url', { reconnection: true });

const CallRoom = () => {
    const [users, setUsers] = useState([]);
    const [voiceLevel, setVoiceLevel] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    // eslint-disable-next-line
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [responseTime, setResponseTime] = useState(null);
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const username = params.get('username');
    const localAudioRef = useRef();
    const audioContextRef = useRef();
    const analyserRef = useRef();
    const userRefs = useRef({});
    const audioRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const speechApiKey = 'Api_Key';
    const ttsApiKey = 'Api_Key';
    const openRouterApiKey = 'Api_Key';

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

        socket.on('voice-level', ({ username, voiceLevel }) => {
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.username === username ? { ...user, voiceLevel } : user
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

        socket.on('chat-message', handleChatMessage);

        return () => {
            socket.disconnect();
            socket.off('chat-message', handleChatMessage);
        };
    }, [username]);

    const handleChatMessage = async (messageData) => {
        setMessages((prevMessages) => [...prevMessages, messageData]);
    };

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

        if (!enabled) {
            startRecording();
        } else {
            stopRecording();
        }
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
                // Mute the audio track initially
                stream.getAudioTracks()[0].enabled = false;
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
                    socket.emit('voice-level', { username, voiceLevel: rms }); // Emit voice level to server
                    requestAnimationFrame(updateVoiceLevel);
                };

                updateVoiceLevel();
            }).catch((err) => {
                console.error('Error accessing media devices.', err);
            });
        } else {
            console.error('getUserMedia not supported on your browser!');
        }
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        // Add glowing effect based on voice level
        users.forEach((user) => {
            const userElement = userRefs.current[user.username];
            if (userElement) {
                if (user.voiceLevel > 3) { // Adjust the threshold value as needed
                    userElement.classList.add('glowing');
                } else {
                    userElement.classList.remove('glowing');
                }
            }
        });
    }, [users]);

    const fetchTTS = useCallback(async (text) => {
        try {
            const response = await fetch('https://api.cartesia.ai/tts/bytes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cartesia-Version': '2024-06-10',
                    'X-API-Key': ttsApiKey,
                },
                body: JSON.stringify({
                    transcript: text,
                    model_id: 'sonic-english',
                    voice: {
                        mode: 'id',
                        id: 'a0e99841-438c-4a64-b679-ae501e7d6091'
                    },
                    output_format: {
                        container: 'wav',
                        encoding: 'pcm_s16le',
                        sample_rate: 44100
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            return audioUrl;
        } catch (error) {
            console.error('Error during TTS:', error);
            return null;
        }
    }, [ttsApiKey]);

    const fetchLLMResponse = useCallback(async (text) => {
        const startTime = Date.now();
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openRouterApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "openai/gpt-3.5-turbo-0613",
                    "messages": [
                        {"role": "user", "content": text},
                    ],
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const endTime = Date.now();
            setResponseTime(endTime - startTime);
            return result.choices[0].message.content;
        } catch (error) {
            console.error('Error during LLM fetch:', error);
            return null;
        }
    }, [openRouterApiKey]);

    const sendMessage = (msg, fromSTT = false, fromLLM = false) => {
        if (msg.trim() !== '') {
            const messageData = {
                username: fromLLM ? 'Jarvis BOT' : username,
                message: msg,
                fromSTT,
                fromLLM
            };
            socket.emit('chat-message', messageData);
            if (!fromLLM) {
                setMessage('');
            }
        }
    };

    const sendTTSMessage = async () => {
        if (message.trim() !== '') {
            sendMessage(message);  // Send user's message first

            setIsLoading(true);
            const llmResponse = await fetchLLMResponse(message);
            setIsLoading(false);

            if (llmResponse) {
                sendMessage(llmResponse, false, true);
                const audioUrl = await fetchTTS(llmResponse);
                if (audioUrl) {
                    playAudio(audioUrl);
                }
            }
        }
    };

    const playAudio = (audioUrl) => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play();
        }
    };

    const startRecording = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                mediaRecorderRef.current = new MediaRecorder(stream);
                mediaRecorderRef.current.ondataavailable = handleStopRecording;
                mediaRecorderRef.current.start();
                setIsRecording(true);
            }).catch((err) => {
                console.error('Error accessing media devices for recording.', err);
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
    };

    const handleStopRecording = async (event) => {
        setIsRecording(false);
        setIsLoading(true);
        const audioData = event.data;
        const reader = new FileReader();
        reader.readAsDataURL(audioData);
        reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1];
            try {
                const response = await fetch(`https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${speechApiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        config: {
                            encoding: 'WEBM_OPUS',
                            sampleRateHertz: 48000,
                            languageCode: 'en-US',
                        },
                        audio: {
                            content: base64data,
                        },
                    }),
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                setIsLoading(false);

                if (result.results && result.results[0] && result.results[0].alternatives && result.results[0].alternatives[0]) {
                    const transcript = result.results[0].alternatives[0].transcript;
                    sendMessage(transcript, true);

                    const llmResponse = await fetchLLMResponse(transcript);
                    if (llmResponse) {
                        sendMessage(llmResponse, true, true);
                        const audioUrl = await fetchTTS(llmResponse);
                        if (audioUrl) {
                            playAudio(audioUrl);
                        }
                    }
                }
            } catch (error) {
                console.error('Error during transcription:', error);
                setIsLoading(false);
            }
        };
    };

    return (
        <div className="call-room">
            <div className="callroom-heading">
                <h1>Jarvis Audio Bot</h1>
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
            <div className="chat-box">
                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`message ${msg.username === username ? 'user-message' : 'others-message'} ${msg.fromSTT ? 'speaking' : ''}`}
                        >
                            <span className="username">{msg.username}</span>
                            <p>{msg.message}</p>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="loading-message">
                            <p>Loading<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></p>
                        </div>
                    )}
                </div>
                <div className="chat-input">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') sendTTSMessage();
                        }}
                    />
                    <button onClick={sendTTSMessage} title="Send LLM Request">
                        <FaPaperPlane className="send-icon"/>
                    </button>
                </div>
                {responseTime !== null && (
                    <div className="response-time">
                        {responseTime} ms
                    </div>
                )}
                <audio ref={audioRef} style={{ display: 'none' }}></audio>
            </div>
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
