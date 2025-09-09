# Frontend - Tourist Places App

## 🚀 Quick Start

```bash
cd Front
npm install
npm run dev
```

The app will be available at `http://localhost:5173/`

## 📋 Current Status

✅ **Working Components:**
- Main layout with header and navigation
- Place cards with ratings, prices, age ranges
- Search bar and category filters
- AI Chat modal with mock responses
- Responsive design with Tailwind CSS

⏳ **TODO - Backend Connections Needed:**

### 1. Supabase Database Connection
**File:** `src/routes/Home.tsx`
**What's needed:**
- Update `.env` file with real Supabase credentials:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your_actual_anon_key
  ```
- Uncomment the real Supabase query in `Home.tsx`
- Remove mock data

### 2. AI Chat Backend Integration  
**File:** `src/components/AIChat.tsx`
**What's needed:**
- Backend endpoint: `POST /api/ai/chat`
- Expected request: `{ "prompt": string }`
- Expected response: Server-Sent Events stream
- Response format: `data: <chunk>\n\n`
- End signal: `data: [DONE]\n\n`
- Uncomment the real fetch implementation
- Remove mock response

## 🔧 Environment Variables

### Required `.env` file:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
```

## 📊 Database Schema Expected

### Places Table (Supabase)
```sql
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  image_url VARCHAR,
  category VARCHAR NOT NULL,
  min_age INTEGER,
  max_age INTEGER,
  price_min DECIMAL,
  price_max DECIMAL,
  rating DECIMAL,
  city VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Features

### Current Features:
- **Place Discovery:** Browse tourist places with detailed cards
- **Search & Filter:** Search bar and category filters
- **AI Assistant:** Chat modal for tourism recommendations (with mock data)
- **Responsive Design:** Works on desktop and mobile

### Mock Data Includes:
- Cristo de la Concordia
- Parque Nacional Tunari  
- Palacio Portales
- Mercado La Cancha
- Teatro Achá
- Laguna Alalay

## 🔌 API Integration Points

### 1. Places API (Supabase)
```typescript
// GET places
const { data, error } = await supabase
  .from("places")
  .select("*")
  .eq("is_active", true)
  .limit(30);
```

### 2. AI Chat API (Backend)
```typescript
// POST /api/ai/chat
const response = await fetch("http://localhost:8081/api/ai/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "user message" })
});

// Response: Server-Sent Events
// data: chunk1
// data: chunk2
// data: [DONE]
```

## 🎨 UI Components

- **PlaceCard:** Individual place display with image, details, actions
- **PlaceGrid:** Grid layout for multiple places
- **AIChat:** Modal chat interface with SSE support
- **ErrorBanner:** Error message display

## 📱 Tech Stack

- **React 19** with TypeScript
- **Vite** for development
- **Tailwind CSS** for styling
- **React Router DOM** for navigation
- **Supabase** for database (when configured)
- **Zustand** for state management (ready to use)
- **Lucide React** for icons

## 🚀 Next Steps

1. **Get Supabase credentials** from your team
2. **Update `.env`** with real values
3. **Test places loading** from database
4. **Wait for backend AI endpoint** implementation
5. **Replace mock responses** with real AI integration