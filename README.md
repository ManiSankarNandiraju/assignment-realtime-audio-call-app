# Real Time Interactive Audio Bot App
## Overview
This project is a real-time interactive audio bot where users can connect in one room and chat with a bot named Jarvis. This audio bot uses STT, TTS, and LLM to generate a natural audio response. Users can use text messages or audio recordings to get responses from the bot.

## Name of the Bot
Jarvis

### The application is built using the following technologies:
Frontend: React \
Backend: Node.js \
Communication: WebSocket, WebRTC \
APIs: TTS API (Cartesia), STT API (Google Cloud) \
LLM: Openrouter ai , GPT 3.5 Turbo \
Deployment: Netlify (frontend), Render (backend) 

## Features
Audio Communication: Users can talk with a interactive bot in real-time. \
Mute/Unmute: Users can mute and unmute their microphones.\
Text Messaging: Users can send text messages to bot.\
Text-to-Speech (TTS): Sent text messages are converted to speech.\
Speech-to-Text (STT): Recorded audio is converted to text \
Large Language Model: To generate natural responses.\
Join/Leave: Users can join or leave the meeting at any time.

## Setup and Installation
### Prerequisites
Node.js installed \
API keys from Cartesia, Openrouter and Google Cloud\
Local Setup
### Clone the repository:
git clone https://github.com/ManiSankarNandiraju/assignment-realtime-interactive-audio-bot-app
### Replace the placeholders with your API keys:
Get the respective API keys from Cartesia, Openrouter and Google Cloud.\
Replace the placeholders in the code with these API keys.
### Navigate to the backend folder and install dependencies:
cd backend\
npm install
### Backend Setup:
Replace the frontend endpoint with localhost:3000.
### Navigate to the frontend folder and install dependencies:
cd frontend\
npm install
### Frontend Setup:
In CallRoom.js, replace the server endpoint with localhost:5000.
## Run the Project:
### Start the backend server:
npm start
### Start the frontend development server:
npm start
## Deployment

### Frontend: 
Deployed on Netlify - https://realtimeinteractiveaudiobotmanisankar.netlify.app.
### Backend: 
Deployed on Render.\
Both parts are linked with respective endpoints.

## Usage
### Join Page
Asks for the username and has a join button.
### CallRoom Page
Users can talk with bot using audio communication.\
Shows details of the admin and joined users along with individual mute and unmute buttons.
### Additional Features
Users can leave the meeting if they want.\
Text messages are sent to LLM then output text of LLM converted to speech using the TTS service and conveyed to the users.\
Users can record audio, which is converted to text using the STT service and sent to LLM then output text of LLM converted to speech using the TTS service and conveyed to the users.
### Current Status
The project is well functional. All the features are working correctly.\
Added ping as well to know the response time.

## Conclusion
Working on this project has been a great learning experience. Despite the issues with a bit slow audio response , all other features are working as expected. I hope you understand the effort and time constraints involved.

Feel free to reach out if you have any questions or need further clarification.

Mani Sankar
