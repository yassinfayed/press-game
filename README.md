# Press Sprint Project


## Project Structure
```
press_sprint/
├── frontend/           # React + Vite frontend application
│   ├── src/           # Source code
│   └── ...            # Configuration files
└── server/            # Node.js backend application
    ├── src/           # Source code
    └── ...            # Configuration files
```

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Socket.IO Client

### Backend
- Node.js
- TypeScript
- Express
- Socket.IO

## Development Challenges and Solutions

### 1. Game State and Socket Connection Management
**Challenge**: Players were unable to start the game after being ready in the lobby. The game state wasn't properly transitioning from the lobby to the gameplay screen.
**Solution**: 
- Identified that the socket connection and game state weren't being properly transferred between GameLobby.tsx and GamePlay.tsx components
- Leveraged previous Socket.IO experience to implement proper state management
- Ensured socket connection persistence across component transitions

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd server
npm install
npm run dev
```

## Development Methodology

1. **Architecture**
   - Separated frontend and backend concerns
   - Used component-based architecture for frontend
   - Implemented RESTful API design for backend

2. **Type Safety**
   - Implemented TypeScript throughout the project
   - Used proper type definitions and interfaces
   - Enabled strict type checking