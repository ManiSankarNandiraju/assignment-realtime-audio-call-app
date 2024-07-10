# Audio Call App Project
## Overview
This project is an audio call application that allows multiple users to connect in an audio room and communicate with each other. It includes features such as mute/unmute functionality, text messaging, text-to-speech (TTS) service, and speech-to-text (STT) service. 

### The application is built using the following technologies:
Frontend: React \
Backend: Node.js \
Communication: WebSocket, WebRTC \
APIs: TTS API (Cartesia), STT API (Google Cloud) \
Deployment: Netlify (frontend), Render (backend) 

## Features
Audio Communication: Users can talk with each other in real-time. \
Mute/Unmute: Users can mute and unmute their microphones.\
Text Messaging: Users can send text messages.\
Text-to-Speech (TTS): Sent text messages are converted to speech and conveyed to users.\
Speech-to-Text (STT): Recorded audio is converted to text and conveyed to users.\
Join/Leave: Users can join or leave the meeting at any time.

## Setup and Installation
### Prerequisites
Node.js installed \
API keys from Cartesia and Google Cloud\
Local Setup
### Clone the repository:
git clone https://github.com/your-repo/audio-call-app.git \
cd audio-call-app 
### Replace the placeholders with your API keys:
Get the respective API keys from Cartesia and Google Cloud.\
Replace the placeholders in the code with these API keys.
### Frontend Setup:
Replace the frontend endpoint with localhost:3000.
### Navigate to the frontend folder and install dependencies:
cd frontend\
npm install
### Backend Setup:
In CallRoom.js, replace the server endpoint with localhost:5000.
### Navigate to the backend folder and install dependencies:
cd backend\
npm install
## Run the Project:
### Start the backend server:
npm start
### Start the frontend development server:
npm start
## Deployment

### Frontend: 
Deployed on Netlify - https://realtimeaudiocallmanisankar.netlify.app.
### Backend: 
Deployed on Render.\
Both parts are linked with respective endpoints.

## Usage
### Join Page
Asks for the username and has a join button.
### Lobby Page
Displays a list of users who joined the lobby in boxes.\
For the admin, there is a "Start Call" button.\
For others, it shows "Call not yet started". Once the admin starts the call, others get the "Join Call" button.\
The first user to join is the admin, indicated by "admin" next to their username with low opacity.
### CallRoom Page
Users can talk with each other using audio communication.\
Shows details of the admin and joined users along with individual mute and unmute buttons.
### Additional Features
Users can leave the meeting if they want.\
Users can send text messages.\
Text messages are converted to speech using the TTS service and conveyed to the users.\
Users can record audio, which is converted to text using the STT service and conveyed to the users.
### Current Status
The project is mostly functional, but there are some issues with the audio stream through WebRTC. While most features are working correctly, the WebRTC audio stream needs further debugging.\
I am willing to take some time to fix this issue, but I am concerned about missing the opportunity as there is no specific deadline.

## Conclusion
Working on this project has been a great learning experience. Despite the current issues with WebRTC audio streaming, all other features are working as expected. I hope you understand the effort and time constraints involved.\

Feel free to reach out if you have any questions or need further clarification.\

Mani Sankar
