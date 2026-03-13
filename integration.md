# TSEDK AI Chat Assistant - Integration Guide

## Overview

The TSEDK platform includes a comprehensive **AI-powered chat assistant** system that provides role-based conversations using Google Gemini 2.5 Flash API. The system supports four user roles with different access levels and features:

- **Guest** - Limited to 2 free messages, no authentication required
- **Member** - Full chat access with conversation history
- **Treasurer** - Access to financial data and reporting
- **Admin** - Caption generation for social media campaigns

---

## Architecture

### Frontend Stack

- **Framework**: Next.js 14.2+ with React 18
- **State Management**: React Context API (ChatContext)
- **UI Components**: shadcn/ui with Tailwind CSS
- **Authentication**: Supabase Auth
- **Real-time Updates**: Supabase Realtime (optional)

### Backend Stack

- **API Layer**: Next.js API Routes (`/app/api`)
- **AI Model**: Google Gemini 2.5 Flash
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase JWT + Service Role Keys
- **Storage**: Supabase Storage (for captions)

### File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   ├── guest/route.ts          # Guest chat endpoint
│   │   │   ├── member/route.ts         # Member chat endpoint
│   │   │   ├── member/history/route.ts # Member history retrieval
│   │   │   ├── treasurer/route.ts      # Treasurer chat with financial data
│   │   │   ├── treasurer/history/route.ts # Treasurer history
│   │   │   └── admin/caption/route.ts  # Caption generation
│   │   └── campaigns/route.ts          # Campaign listing for captions
│   └── (dashboard)/
│       └── layout.tsx
├── components/
│   ├── chat/
│   │   ├── ChatAssistant.tsx           # Main container
│   │   ├── FloatingChatButton.tsx      # Toggle button
│   │   ├── FloatingChatPanel.tsx       # Chat UI panel
│   │   ├── ChatHistorySidebar.tsx      # Session history
│   │   ├── MemberLimitedChat.tsx       # Message display
│   │   ├── ChatInput.tsx               # Input form
│   │   ├── MessageBubble.tsx           # Message component
│   │   └── CaptionGenerator.tsx        # Admin caption tool
│   └── ...
├── context/
│   └── ChatContext.tsx                 # Global chat state
├── hooks/
│   ├── useAuth.tsx                     # Auth hook with roles
│   └── use-toast.ts
└── integrations/
    └── supabase/
        ├── client.ts                   # Supabase client
        └── types.ts                    # Generated types

supabase/
├── migrations/
│   └── 20260313000000_add_ai_chat_tables.sql
└── config.toml
```

---

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API
GOOGLE_API_KEY=your-gemini-api-key
```

### How to Get Each Key

#### 1. Supabase Keys

- Go to: https://app.supabase.com/project/[YOUR-PROJECT-ID]/settings/api
- **NEXT_PUBLIC_SUPABASE_URL**: Project URL (already visible on page)
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Under "Project API keys" → anon (public)
- **SUPABASE_SERVICE_ROLE_KEY**: Under "Project API keys" → service_role (secret - hide in .gitignore)

#### 2. Google Gemini API Key

- Go to: https://makersuite.google.com/app/apikey
- Click "Create new API key"
- Copy and paste into `GOOGLE_API_KEY`

---

## API Endpoints

### 1. Guest Chat: `POST /api/chat/guest`

**Purpose**: Handle unauthenticated user messages with 2-message limit

**Request**:

```json
{
  "message": "What is TSEDK?",
  "sessionMessageCount": 0
}
```

**Response**:

```json
{
  "reply": "TSEDK is an Orthodox community platform...",
  "limitReached": false
}
```

**Limitations**:

- Max 2 messages per session
- Returns 403 when limit reached
- No database persistence

**System Prompt**: Focus on general information about TSEDK, donation processes, and how to register.

---

### 2. Member Chat: `POST /api/chat/member`

**Purpose**: Full chat with conversation history for authenticated members

**Headers**:

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request**:

```json
{
  "message": "How do I make a donation?",
  "sessionId": "uuid-or-null"
}
```

**Response**:

```json
{
  "reply": "To donate, you can...",
  "sessionId": "uuid"
}
```

**Features**:

- Conversation history persisted in database
- Auto-generates session titles from first message
- Access to community resources and campaign info
- Supports Amharic, Afan Oromo, and English

---

### 3. Member History: `GET /api/chat/member/history`

**Purpose**: Retrieve list of past chat sessions for a member

**Headers**:

```
Authorization: Bearer {access_token}
```

**Response**:

```json
[
  {
    "sessionId": "uuid",
    "title": "How do I make a donation?",
    "createdAt": "2026-03-13T10:30:00Z"
  }
]
```

---

### 4. Treasurer Chat: `POST /api/chat/treasurer`

**Purpose**: Specialized chat with financial data access

**Headers**:

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request**:

```json
{
  "message": "What is the total campaign progress?",
  "sessionId": "uuid-or-null"
}
```

**Response**:

```json
{
  "reply": "Campaign progress summary: ...",
  "sessionId": "uuid"
}
```

**Special Features**:

- Fetches and injected financial data (campaigns, Aserat, Gbir, Selet)
- Read-only access to financial reporting
- Role validation (treasurer only)
- System prompt includes current financial summary

---

### 5. Treasurer History: `GET /api/chat/treasurer/history`

**Purpose**: Retrieve treasurer's chat history

**Headers**:

```
Authorization: Bearer {access_token}
```

**Response**: Same format as member history

---

### 6. Admin Caption Generator: `POST /api/chat/admin/caption`

**Purpose**: Generate 3 social media captions in Amharic for a campaign

**Headers**:

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request**:

```json
{
  "campaignId": "uuid"
}
```

**Response**:

```json
{
  "captions": [
    "Caption 1 with hashtags and call-to-action...",
    "Caption 2 with hashtags and call-to-action...",
    "Caption 3 with hashtags and call-to-action..."
  ]
}
```

**Features**:

- Admin role only (validated on backend)
- Generates exactly 3 distinct captions
- Captions are in Amharic
- Includes relevant hashtags (#TSEDK, #EthiopianChurch, #Fundraising)
- Stored in `ai_captions` table for audit trail
- Retrieves full campaign details before generation

---

### 7. Campaigns List: `GET /api/campaigns`

**Purpose**: Retrieve available campaigns for caption generator

**Headers**:

```
Authorization: Bearer {access_token}
```

**Response**:

```json
[
  {
    "id": "uuid",
    "name": "Easter Campaign 2026"
  }
]
```

---

## Database Schema

### `chat_history` Table

Stores all chat messages for members and treasurers

```sql
CREATE TABLE chat_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  session_id uuid NOT NULL,
  role text NOT NULL, -- 'user' or 'assistant'
  content text NOT NULL,
  session_title text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX idx_chat_history_user_session ON chat_history(user_id, session_id);
```

**Row Level Security (RLS)**:

- Users can only access their own chat history
- Service role bypasses RLS for admin operations

---

### `ai_captions` Table

Stores generated captions for audit trail

```sql
CREATE TABLE ai_captions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaigns ON DELETE CASCADE,
  generated_captions text[] NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX idx_ai_captions_campaign ON ai_captions(campaign_id);
```

---

## Authentication Flow

### 1. Initial Login

```
User → Supabase Auth → JWT Token (access_token + refresh_token)
```

### 2. Chat Request

```
Client sends: Authorization: Bearer {access_token}
              ↓
Server validates token via Supabase.auth.getUser(token)
              ↓
Check user role from user_roles table
              ↓
Route to appropriate handler (guest/member/treasurer/admin)
```

### 3. Guest vs Authenticated

- **Guest**: No auth header → No JWT validation → Limited functionality
- **Member**: Auth header present → JWT validated → Full access

---

## React Context: ChatContext

### Purpose

Central state management for all chat interactions

### Key State

```typescript
interface ChatContextType {
  isOpen: boolean;
  isLoading: boolean;
  history: ChatSession[]; // Past sessions
  activeSessionId: string | null;
  activeConversation: ChatMessage[];
  error: string | null;
  guestMessageCount: number;
}
```

### Key Functions

```typescript
setIsOpen(open: boolean)           // Toggle chat panel
startNewChat()                     // Reset conversation
sendMessage(message: string)       // Send to appropriate endpoint
fetchHistory()                     // Load past sessions
loadChatSession(sessionId: string) // Load old conversation
generateCaptions(campaignId)       // Admin caption generation
```

### Automatic Features

- **Endpoint routing**: Automatically selects /api/chat/guest, /api/chat/member, etc. based on user role
- **Token management**: Automatically includes Bearer token in authenticated requests
- **Error handling**: Catches and displays API errors gracefully
- **Guest message counting**: Tracks messages for 2-message limit

---

## Frontend Components

### ChatAssistant

Main container that combines button and panel

### FloatingChatButton

Floating action button (bottom-right corner)

- Sparkles icon
- Click to toggle chat panel
- Dark theme (#1F1F1F background)

### FloatingChatPanel

Main chat UI with:

- Header (title + subtitle)
- History sidebar toggle
- Message display area
- Input field
- Admin-specific: Tab view for chat/caption generator

### ChatHistorySidebar

Shows past conversations

- Click to load old session
- Date-formatted creation timestamps
- Responsive design

### MemberLimitedChat

Message display component

- Shows message bubbles
- Loading indicators
- Error messages
- Role-specific welcome messages

### ChatInput

Text input form

- Auto-focus
- Enter key sends (Shift+Enter for newline)
- Send button with loading state

### MessageBubble

Individual message display

- Different styling for user vs assistant
- Copy button (assistant only)
- Markdown rendering support (optional)

### CaptionGenerator (Admin Only)

- Campaign dropdown selector
- Generated captions display
- Copy buttons for each caption

---

## System Prompts

### Guest System Prompt

Focus on general TSEDK information:

- What TSEDK is
- How to donate
- Meaning of financial terms (Aserat, Selet, Gbir)
- How to register
- Current active campaigns
- Explicitly states: "I can only answer general questions about TSEDK"

### Member System Prompt

Access to community resources:

- Donation processes
- Campaigns and their progress
- Church events and calendar
- Community resources
- General platform functionality
- Supportive and helpful tone

### Treasurer System Prompt

Financial reporting focus:

- Real-time financial data injection
- Campaign progress and goals
- Aserat (tithe) status and overdue lists
- Gbir (feast) compliance
- Selet (vow) due dates
- Member payment summaries
- **Read-only** - Cannot modify data
- Cannot generate captions
- Factual and clear formatting

### Admin Caption System Prompt

Social media content creation:

- Generate exactly 3 distinct captions
- Amharic language
- Relevant hashtags (#TSEDK, #EthiopianChurch, #Fundraising, #Community)
- Clear call-to-action
- Inspiring and community-focused tone
- Output as JSON: `{ "captions": [...] }`

---

## Testing the Integration

### 1. Test Guest Chat (No Auth)

```bash
curl -X POST http://localhost:3000/api/chat/guest \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is TSEDK?",
    "sessionMessageCount": 0
  }'
```

### 2. Test Member Chat (With Auth)

```bash
# First, get a JWT token from Supabase Auth
# Then:
curl -X POST http://localhost:3000/api/chat/member \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {YOUR_ACCESS_TOKEN}" \
  -d '{
    "message": "How do I donate?",
    "sessionId": null
  }'
```

### 3. Test Member History

```bash
curl -X GET http://localhost:3000/api/chat/member/history \
  -H "Authorization: Bearer {YOUR_ACCESS_TOKEN}"
```

### 4. Test Treasurer Chat

```bash
curl -X POST http://localhost:3000/api/chat/treasurer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TREASURER_TOKEN}" \
  -d '{
    "message": "What is the total donation progress?",
    "sessionId": null
  }'
```

### 5. Test Caption Generation

```bash
curl -X POST http://localhost:3000/api/chat/admin/caption \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{
    "campaignId": "uuid-of-campaign"
  }'
```

---

## Configuration & Customization

### Change AI Model

Edit API route files (e.g., `/api/chat/guest/route.ts`):

```typescript
// Current: Gemini 2.5 Flash
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
);

// To use different model, change:
// - gemini-1.5-pro
// - gemini-1.5-flash
// - gemini-2.5-pro (when available)
```

### Modify Message Limit

In `ChatContext.tsx`, change guest message count check:

```typescript
// Current: 2 messages
if (guestMessageCount >= 2) {
  // Change 2 to desired limit
}

// Also update in /api/chat/guest/route.ts:
if (sessionMessageCount >= 2) {
  // Change 2 here too
}
```

### Change UI Colors

All colors in `FloatingChatPanel.tsx` and components use Tailwind classes:

- Background: `bg-[#1F1F1F]` (dark gray)
- Border: `border-[#2F2F2F]` (slightly lighter)
- Header: `bg-[#252525]`
- Text: `text-white`, `text-[#E8E8E8]`

Edit these hex values to match your brand colors.

### Add New Languages

Update system prompts to include new language:

```typescript
// In system prompt:
"Respond in the same language the user writes in. Supported languages: Amharic, Afan Oromo, English, [NEW_LANGUAGE]";
```

---

## Error Handling

### Common Errors

| Error                     | Cause                               | Solution                          |
| ------------------------- | ----------------------------------- | --------------------------------- |
| `supabaseKey is required` | Missing `SUPABASE_SERVICE_ROLE_KEY` | Add to `.env.local`               |
| `API key not valid`       | Invalid/missing `GOOGLE_API_KEY`    | Get new key from Google AI Studio |
| `Unauthorized (401)`      | No/invalid JWT token                | User not authenticated            |
| `Forbidden (403)`         | Wrong user role                     | Verify user_roles table entry     |
| `Invalid response format` | Unexpected Gemini API response      | Check API documentation           |

### Error Responses

All API endpoints return consistent error format:

```json
{
  "error": "Human-readable error message",
  "status": 400 // HTTP status code
}
```

---

## Performance Optimization

### Caching

- ChatContext caches session history in memory
- Supabase client caches auth state
- Consider Redis for high-traffic deployments

### Rate Limiting

- Google Gemini API has built-in rate limits
- Implement frontend debouncing on input (optional)
- Consider rate limiting middleware on API routes

### Database Queries

- Indexes on `(user_id, session_id)` for chat_history
- Indexes on `campaign_id` for ai_captions
- Use pagination for large history queries

---

## Security Considerations

### RLS (Row Level Security)

- All authenticated endpoints check user_id
- Users cannot access other users' chat history
- Service role used only for admin operations

### Secret Management

- Never commit `.env.local` to git (added to `.gitignore`)
- `SUPABASE_SERVICE_ROLE_KEY` is secret - never expose in frontend
- Only used in server-side API routes

### Token Safety

- JWT tokens validated on every request
- Refresh tokens handled by Supabase SDK
- No tokens stored in localStorage (risk: XSS)

---

## Deployment Checklist

- [ ] All environment variables set in production
- [ ] Supabase RLS policies enabled
- [ ] Database migrations run on production
- [ ] Google Gemini API quota increased if needed
- [ ] HTTPS enforced
- [ ] CORS configured for your domain
- [ ] Error monitoring (Sentry/LogRocket) set up
- [ ] Database backups automated
- [ ] API rate limiting configured
- [ ] Load balancing for high traffic

---

## Support & Troubleshooting

### Check Logs

```bash
npm run dev
# View terminal output for error details
```

### Test Endpoints Directly

```bash
# Use curl or Postman to test API endpoints
# Check response status and body
```

### Database Inspection

```bash
# Via Supabase dashboard:
# 1. Navigate to SQL Editor
# 2. Query chat_history to see stored messages
# 3. Check user_roles for role assignments
```

### JWT Debugging

```javascript
// In browser console:
// Get current token from localStorage (if stored)
// Decode at jwt.io to inspect claims
```

---

## Future Enhancements

- [ ] Voice input/output using Web Speech API
- [ ] Real-time message streaming (SSE)
- [ ] Message search and filtering
- [ ] Export conversation as PDF
- [ ] Multi-language caption generation
- [ ] Conversation analytics dashboard
- [ ] Custom AI model fine-tuning
- [ ] Webhook integrations
- [ ] Message moderation/safety filters

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [React Context API](https://react.dev/reference/react/useContext)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Last Updated**: March 13, 2026  
**Version**: 1.0  
**Maintainer**: TSEDK Development Team
