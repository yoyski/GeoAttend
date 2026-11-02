# GeoAttend

**Location-based attendance tracking made simple.**

GeoAttend is a full-stack web application that enables location-verified check-ins for events, classes, meetings, and gatherings. Participants can only check in when physically present within a designated radius.

## 🌟 Features

### For Participants
- **Location-verified check-ins** - Check in only when inside the designated radius
- **Multiple verification methods** - Location-only, passcode, or email whitelist
- **Real-time session discovery** - Automatically see nearby active sessions
- **Google OAuth sign-in** - Quick registration and login with Google account
- **Check-in history** - Track your attendance across all sessions
- **Mobile-friendly** - Optimized for smartphone use

### For Organizers
- **Easy session creation** - Set location, radius, date, time, and verification method
- **Live attendance tracking** - Real-time check-in updates via Server-Sent Events (SSE)
- **Customizable attendance sheets** - Design and print professional attendance records
- **Multi-page PDF export** - Automatically handles large attendee lists
- **Manual check-ins** - Add attendees who couldn't check in digitally
- **Session management** - Open, close, cancel, duplicate, and delete sessions
- **Email restrictions** - Limit attendance to authorized email addresses

### Attendance Sheets
- **Print-ready design** - Professional layouts with customizable colors and branding
- **QR code generation** - Easy session sharing
- **Multi-page support** - Automatically splits large attendee lists
- **PDF download** - Direct PDF generation without print dialog
- **Page navigation** - Preview and navigate through multi-page sheets

## 🛠️ Tech Stack

### Backend (MERN)
- **Node.js** 20+ with ES modules
- **Express.js** - REST API with TypeScript
- **MongoDB Atlas** - NoSQL database with geospatial queries
- **Mongoose** 8 - MongoDB ODM with 2dsphere indexing
- **JWT** - httpOnly cookie-based authentication
- **bcrypt** - Password hashing
- **Passport.js** - Authentication middleware with Google OAuth 2.0
- **Zod** - Runtime validation
- **Helmet** - Security headers
- **express-rate-limit** - API rate limiting

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool and dev server
- **React Router 6** - Client-side routing
- **react-leaflet** - Interactive OpenStreetMap integration
- **Radix UI** - Accessible UI primitives
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **html2canvas + jsPDF** - PDF generation
- **qrcode.react** - QR code generation

## 📁 Project Structure

```
geoattend/
├── client/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/           # API client and endpoints
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities
│   │   └── types.ts       # TypeScript types
│   └── package.json
├── server/                # Express + TypeScript + Mongoose
│   ├── src/
│   │   ├── config/        # Environment validation
│   │   ├── models/        # Mongoose schemas (User, Session, CheckIn)
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth, validation, rate limiting
│   │   ├── utils/         # Helper functions
│   │   └── scripts/       # Migration scripts
│   └── package.json
└── package.json           # Root scripts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **MongoDB Atlas** account (or local MongoDB)
- Modern browser with geolocation support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yoyski/GeoAttend.git
   cd GeoAttend
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment variables**

   Create `server/.env`:
   ```bash
   cp server/.env.example server/.env
   ```

   Update `server/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/geoattend
   JWT_SECRET=your-secure-random-string-here
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development

   # Check-in rules
   MAX_GPS_ACCURACY=100
   LATE_AFTER_MINUTES=10
   EARLY_CHECKIN_MINUTES=15

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

   **Google OAuth Setup (Optional):**
   If you want to enable "Sign in with Google", follow the [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md) to get your credentials and configure authorized redirect URIs.

   Optional - Create `client/.env`:
   ```env
   VITE_API_BASE=http://localhost:5000/api
   ```

### Development

**Run both client and server:**
```bash
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

**Run separately:**
```bash
npm run server  # Backend only
npm run client  # Frontend only
```

### Building for Production

```bash
npm run build
```

### Production Start

```bash
npm start
```

## 🔐 Security Features

- JWT stored in httpOnly, Secure, SameSite=Lax cookies
- Google OAuth 2.0 authentication with automatic account linking
- Passwords hashed with bcrypt (cost 12)
- Email verification tokens (SHA-256 hashed, 24h expiry)
- Password reset tokens (SHA-256 hashed, 30min expiry)
- Rate limiting on auth and check-in endpoints
- CORS restricted to CLIENT_URL
- Input validation with Zod on all routes
- Helmet.js security headers
- CSV injection prevention in exports

## 📍 How Location Verification Works

1. **Session Creation**: Organizer sets a location pin and radius (e.g., 100 meters)
2. **Geospatial Query**: MongoDB's 2dsphere index finds sessions within range
3. **Visibility Rule**: Participants only see sessions when inside the radius
4. **Check-in Validation**: Server calculates distance using Haversine formula
5. **GPS Accuracy Check**: Rejects check-ins with accuracy > 100m (configurable)

## 📱 Browser Requirements

- **Geolocation API** support (HTTPS required in production)
- Modern JavaScript (ES2020+)
- CSS Grid and Flexbox support
- Recommended: Chrome, Firefox, Safari, Edge (latest versions)

## 🧪 Testing

**Server unit tests:**
```bash
cd server
npm test
```

Currently covers:
- Haversine distance calculation
- Hash utility functions
- CSV escaping

## 📄 License

MIT

## 🙏 Acknowledgments

- OpenStreetMap and Leaflet for mapping
- Radix UI for accessible components
- Tailwind CSS for styling system
- MongoDB Atlas for managed database

---

**Note:** Email sending is not yet implemented. Verification and reset tokens are generated but not sent. Registration creates tokens that must be manually verified.
