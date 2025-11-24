# 🏙️ Echocity - Voice of the Citizens

An AI-powered civic complaint management platform that empowers citizens to report and track urban issues in real-time with intelligent analysis and visualization.

## 🌟 Features

### 🤖 AI-Powered Chatbot
- **Google Gemini 2.5 Flash** integration with grounding (Google Search + Maps)
- Image upload and analysis for automated complaint categorization
- Voice input support for accessibility
- Conversation history with localStorage persistence
- Real-time complaint detection and auto-fill

### 📍 Interactive Mapping
- **Leaflet + OpenStreetMap** for free, open-source mapping
- Live complaint visualization with status-based color coding
- Reverse geocoding with Nominatim API
- Click-to-locate functionality

### 👤 User Features
- **Supabase Authentication** with JWT tokens
- Personal complaint dashboard with status tracking
- Profile management with avatar support
- Community dashboard for public complaint viewing

### 🛡️ Admin Portal
- Department-based complaint management
- Status update workflow (Pending → Approved → In Progress → Resolved)
- Analytics dashboard with real-time statistics
- Row Level Security (RLS) for data protection

### 🎨 Modern UI/UX
- Built with **React 18 + TypeScript + Vite**
- **Tailwind CSS** + **shadcn/ui** components
- Fully responsive design
- Dark mode ready

## 🚀 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (Build tool)
- Tailwind CSS + shadcn/ui
- React Router v6
- Leaflet (Maps)

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Row Level Security policies
- Real-time subscriptions

**AI & APIs:**
- Google Gemini 2.5 Flash (with grounding)
- Nominatim (Reverse geocoding)
- Web Speech API (Voice input)

**Deployment:**
- GitHub Pages
- GitHub Actions (CI/CD)

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or bun
- Supabase account
- Google Gemini API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nmamit-Annika/Echocity1.git
   cd Echocity1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` file:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Configure Supabase**
   - Update `src/integrations/supabase/client.ts` with your Supabase URL and anon key
   - Run database migrations (SQL schema in Supabase dashboard)

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open http://localhost:3000

## 🗄️ Database Schema

### Tables
- `profiles` - User information
- `departments` - Government departments
- `categories` - Complaint categories
- `complaints` - Citizen complaints
- `user_roles` - Role-based access control

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only view/edit their own complaints
- Admins have full access to assigned department complaints

## 🎯 Usage

### For Citizens
1. Sign up with email
2. Use AI chatbot to describe issues or upload images
3. Review auto-filled complaint form
4. Submit and track complaint status
5. View community complaints on the map

### For Admins
1. Login with admin credentials
2. View all complaints assigned to your department
3. Update complaint status through workflow
4. Monitor analytics and resolution rates

## 🌐 Deployment

The app is configured for GitHub Pages deployment:

```bash
npm run build
```

Deployment is automated via GitHub Actions on push to `main` branch.

**Live Demo:** [https://nmamit-annika.github.io/Echocity1/](https://nmamit-annika.github.io/Echocity1/)

## 🧩 Project Structure

```
Echocity1/
├── src/
│   ├── components/        # React components
│   ├── pages/             # Route pages
│   ├── services/          # API integrations (Gemini, Supabase)
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React context providers
│   └── integrations/      # Third-party integrations
├── public/                # Static assets
└── dist/                  # Production build
```

## 🤝 Contributing

This is a hackathon project. Contributions are welcome!

## 📄 License

MIT License

## 👥 Team

Built with ❤️ for improving civic engagement

---

**Note:** This project uses Google Gemini AI for automated complaint analysis. Ensure you have a valid API key and comply with Google's terms of service.
