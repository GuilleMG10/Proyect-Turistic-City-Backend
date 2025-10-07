# Setup

in the main folder (.env), since we are using supabase its important to define the type session is used because that is deprecated! the port is 5432
See this: https://github.com/orgs/supabase/discussions/32755#discussioncomment-12320613
## Database Configuration
- DB_USER=postgres.our_host_instance_name
- DB_PASSWORD=our_password
- DB_HOST=our_host_aws_or_whatever_related.com
- DB_PORT=5432
- DB_NAME=postgres

## AI Configuration
- OLLAMA_URL=http://127.0.0.1:11434
- CHROMA_URL=http://localhost:8000
- HF_TOKEN=your_huggingface_token_here

## Frontend Configuration
- VITE_API_URL=http://localhost:8081
- VITE_AI_ENDPOINT=http://localhost:3000/ia/prompt
- VITE_SUPABASE_URL=https://our_host_instance_name.supabase.co
- VITE_SUPABASE_ANON_KEY=

## Running backend
- **go run cmd/backend/main.go**

## Running AI
if you didnt install Ollama you should install that first, then:
- **ollama pull (whatever link, model name here)**
- **npm install**
- **npm start**

## Running AI (memory)
- https://github.com/chroma-core/chroma -> download for your OS
- $env:CHROMA_SERVER_CORS_ALLOW_ORIGINS='["http://localhost:3000"]'; ./chroma run --host localhost --port 8000 (PowerShell)

¿Qué lugares me recomiendas visitar?

## Running frontend
- **npm install**
- **npm run build; npm run dev**
