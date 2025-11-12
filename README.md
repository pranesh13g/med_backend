# MedConnect Backend API

Express.js backend API for the MedConnect Healthcare Platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_random_secret_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user profile
- `GET /api/users/patients` - Get all patients (Doctor only)
- `GET /api/users/doctor` - Get doctor information

### Chats
- `POST /api/chats` - Create new chat
- `GET /api/chats` - Get all user chats
- `GET /api/chats/:chatId/messages` - Get chat messages
- `POST /api/chats/:chatId/messages` - Send message

### Medicine Requests
- `POST /api/medicines/request` - Create medicine request (Patient only)
- `GET /api/medicines/requests` - Get medicine requests
- `GET /api/medicines/prescriptions` - Get approved prescriptions (Medicine Company only)
- `PATCH /api/medicines/requests/:requestId` - Update request status

## WebSocket Events

### Client to Server
- `register` - Register user socket connection
- `join_chat` - Join a chat room
- `send_message` - Send a message
- `typing` - Indicate typing status

### Server to Client
- `new_message` - Receive new message
- `user_typing` - User typing notification
- `medicine_request_update` - Medicine request status update

## Roles

- **patient** - Can chat with doctor and request medicines
- **doctor** - Can chat with patients, approve/reject medicine requests
- **medicine_company** - Can view approved prescriptions and update delivery status
# med_backend
