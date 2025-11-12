# EchoCity - Community Civic Dashboard with AI Assistant

A modern civic engagement platform that allows citizens to report community issues, track complaint status, and get AI-powered assistance for civic matters.

## ✨ Features

- **Community Dashboard**: View and analyze all public complaints
- **Interactive Map**: Visual complaint tracking with location markers
- **AI Chatbot Assistant**: Get help with civic issues, pincode lookup, and authority contacts
- **Voice Recognition**: Talk to the AI assistant using speech-to-text
- **Real-time Analytics**: Community insights and complaint trends
- **Mobile-Responsive**: Works seamlessly on all devices

## 🤖 AI Assistant Features

The integrated Echo chatbot (powered by Gemini AI) can help with:
- Filing complaints and reporting civic issues
- Finding pincode information and authority contacts
- Answering questions about civic processes
- Providing guidance on municipal services
- Location-based assistance
- Speech recognition for hands-free interaction

## 🚀 How to run locally

1. Install dependencies:

```sh
npm install
```

2. Set up environment variables:

```sh
# Copy .env file and add your API keys
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

3. Run the dev server:

```sh
npm run dev
```

4. Open your browser:

- Cover page: `http://localhost:8082/Echocity1/`
- App: `http://localhost:8082/Echocity1/app`

## 🛠️ Technologies Used

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS  
- **Backend**: Supabase (Database + Authentication)
- **AI Integration**: Google Gemini API
- **Maps**: React Leaflet + OpenStreetMap
- **Speech**: Web Speech API (SpeechRecognition + SpeechSynthesis)
- **State Management**: TanStack Query (React Query)

## 🔧 API Setup

### Gemini AI API

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create a new API key
3. Add to your `.env` file as `VITE_GEMINI_API_KEY`

### Supabase Setup

1. Create a Supabase project
2. Get your project URL and public key
3. Add to `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

## 🚀 Deploying to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that will build the app and publish to GitHub Pages.

### Setup Steps:

1. **Add Repository Secrets** (Settings → Secrets → Actions):
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase public key
   - `VITE_GEMINI_API_KEY`: Your Gemini API key

2. **Enable GitHub Pages**:
   - Go to Repository Settings → Pages
   - Set source to `gh-pages` branch
   - The site will be available at: `https://yourusername.github.io/Echocity1`

3. **Deploy**:
   - Push to `main` branch
   - GitHub Actions will automatically build and deploy

### Important Notes:
- The AI chatbot requires a valid Gemini API key to function properly
- Speech recognition works best on HTTPS (required for production)
- Location services need user permission for precise pincode lookup

## 📱 Usage

1. **Browse Community Issues**: Visit the community dashboard to see reported complaints
2. **Chat with AI**: Click the chat bubble to open Echo, your AI civic assistant  
3. **Voice Interaction**: Use the microphone button to speak with the assistant
4. **File Complaints**: Create new complaints with photos and location
5. **Get Help**: Ask the AI about pincodes, authorities, or civic processes

## 🔍 Chatbot Capabilities

The Echo AI assistant can:
- **Answer Civic Questions**: Get information about municipal services and processes
- **Pincode Lookup**: Find area codes and authority contact information
- **Location Services**: Get relevant information based on your location  
- **Complaint Guidance**: Help you file complaints effectively
- **Voice Interaction**: Supports both text and speech input/output

## 🌟 Credits

This project integrates the proven chatbot implementation from [Echo2](https://github.com/sunidhiss/Echo2) with enhanced civic features and modern React architecture.

---

*Built with ❤️ for better civic engagement*

- The workflow writes env vars to `.env.production` before building, so make sure your Supabase keys are stored as secrets (never commit them to the repo).
- Vite is configured to use a relative base path for production builds so pages work when served from a subpath.
- If you want to use a custom domain, add it in the Pages settings and update DNS per GitHub instructions.

If you'd like, I can also:

- Add a GitHub Action step to run `npm test` or linting before deploy
- Configure the workflow to deploy only on tags (for releases)
- Use an alternate deploy action (e.g., `JamesIves/github-pages-deploy-action`) if you prefer

## Image analysis (Gemini / local stub)

You can integrate a multimodal model (e.g., Gemini 2.5 Pro) to analyze photos users upload and suggest categories like `pothole` or `waste_overflow`.

For local testing there's a small stub server included at `server/analyze_stub.js` that returns mock results. Run it with:

```sh
node server/analyze_stub.js
```

It listens by default on `http://localhost:8787/analyze` and your frontend will POST `{ image_url }` to `/api/analyze` (you can proxy or call the stub URL directly during dev).

To wire the real Gemini/Vertex API, deploy a small serverless function that accepts an image URL, calls the Gemini multimodal endpoint (using a service account or API key kept secret on the server), and returns structured JSON: `{ label, confidence, notes }`.

If you'd like, I can add an example serverless function for Vertex/PaLM that demonstrates sending the image and parsing results (I won't include your keys in the repo). 
