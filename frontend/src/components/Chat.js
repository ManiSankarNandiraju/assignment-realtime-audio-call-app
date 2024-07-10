import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReactMediaRecorder } from 'react-media-recorder';
import { FaPaperPlane } from 'react-icons/fa';
import './Chat.css';

const Chat = ({ username, socket, speechApiKey, ttsApiKey }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const audioRef = useRef(null);

    const fetchTTS = useCallback(async (text) => {
        try {
            const response = await fetch('https://api.cartesia.ai/tts/bytes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cartesia-Version': '2024-06-10',
                    'X-API-Key': 'cartesia TTS API KEY here',
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

    useEffect(() => {
        const handleChatMessage = async (messageData) => {
            setMessages((prevMessages) => [...prevMessages, messageData]);

            if (messageData.username !== username && !messageData.fromSTT) {
                const audioUrl = await fetchTTS(messageData.message);
                if (audioUrl) {
                    playAudio(audioUrl);
                }
            }
        };

        socket.on('chat-message', handleChatMessage);

        return () => {
            socket.off('chat-message', handleChatMessage);
        };
    }, [socket, username, fetchTTS]);

    const sendMessage = async (msg, fromSTT = false) => {
        if (msg.trim() !== '') {
            const messageData = {
                username,
                message: msg,
                fromSTT,
            };
            socket.emit('chat-message', messageData);
            setMessage('');
        }
    };

    const sendTTSMessage = async () => {
        if (message.trim() !== '') {
            const audioUrl = await fetchTTS(message);
            if (audioUrl) {
                playAudio(audioUrl);
            }
            sendMessage(message);
        }
    };

    const playAudio = (audioUrl) => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play();
        }
    };

    const handleStopRecording = async (blobUrl, blob) => {
        setIsRecording(false);
        const audioData = blob;
        const reader = new FileReader();
        reader.readAsDataURL(audioData);
        reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1];
            try {
                const response = await fetch(`https://speech.googleapis.com/v1p1beta1/speech:recognize?key=GoogleCloudSTTAPIKEYhere`, {
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

                if (result.results && result.results[0] && result.results[0].alternatives && result.results[0].alternatives[0]) {
                    const transcript = result.results[0].alternatives[0].transcript;
                    sendMessage(transcript, true);
                }
            } catch (error) {
                console.error('Error during transcription:', error);
            }
        };
    };

    return (
        <div className="chat-box">
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.username === username ? 'user-message' : 'others-message'} ${msg.fromSTT ? 'speaking' : ''}`}
                    >
                        <span className="username">{msg.username}    </span>
                        <p>{msg.message}</p>
                    </div>
                ))}
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') sendMessage(message);
                    }}
                />
                <button onClick={() => sendMessage(message)} title="Send Message">
                    <FaPaperPlane className="send-icon" />
                </button>
                <button onClick={sendTTSMessage} title="Send TTS Request">
                    <img src={`/send-tts-icon.png`} alt="Send Icon" className="send-icon" />
                </button>
                <ReactMediaRecorder
                    audio
                    onStop={handleStopRecording}
                    render={({ startRecording, stopRecording }) => (
                        <>
                            <button 
                                className={`record-button ${isRecording ? 'recording' : ''}`}
                                onClick={() => {
                                    if (isRecording) {
                                        stopRecording();
                                    } else {
                                        setIsRecording(true);
                                        startRecording();
                                    }
                                }}
                                title="Send STT Request" >
                                <div className="inner-circle"></div>
                            </button>
                        </>
                    )}
                />
            </div>
            <audio ref={audioRef} style={{ display: 'none' }}></audio>
        </div>
    );
};

export default Chat;
