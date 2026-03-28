# Multi-Modal Food Intelligence System

## Current State
New project. Empty Motoko backend (main.mo scaffold). No frontend yet.

## Requested Changes (Diff)

### Add
- Motoko backend with `/analyze` equivalent: `analyzeFood(imageData, textQuery)` returning structured predictions
- Food freshness analysis simulation with top 3 predictions, confidence scores, freshness label
- AI chat response generation based on food + user query
- Frontend: dark futuristic glassmorphism UI
- Drag-and-drop image upload with file picker fallback
- Image preview before analysis
- Analyze button with loading state
- Results panel: food name, fresh/rotten badge, confidence %, status message
- Top 3 predictions with animated progress bars
- Multi-modal text input (optional question field)
- Chat-style AI response display
- Microphone button (Web Speech API)
- Sound feedback on results
- Theme toggle (dark/light)
- Error handling for no image or invalid file type
- Mobile responsive layout
- Smooth animations and transitions

### Modify
- main.mo: implement food analysis logic

### Remove
- Nothing

## Implementation Plan
1. Generate Motoko backend with food analysis actor
2. Select blob-storage component for image handling
3. Build React frontend with all UI features
4. Wire backend API calls from frontend
