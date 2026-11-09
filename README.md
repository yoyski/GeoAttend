# GeoAttend 📍

**Location-based attendance tracking system with GPS verification**

GeoAttend is a modern web and mobile application that enables organizations, educators, and event organizers to track attendance using geolocation verification. Users can only check in when physically present at the designated location, ensuring accurate and trustworthy attendance records.

---

## 🌟 What is GeoAttend?

GeoAttend simplifies attendance tracking by combining **GPS technology** with flexible verification methods. Whether you're managing a classroom, coordinating a conference, or tracking field team attendance, GeoAttend ensures people are where they need to be.

### Key Highlights
- ✅ **Location-based verification** - Check-in only works within a defined radius
- 📱 **Cross-platform** - Works on web browsers and Android devices
- 🔐 **Multiple verification methods** - Passcode, email whitelist, or location-only
- 📊 **Real-time monitoring** - Live attendance view with auto-updates
- 📅 **Automated scheduling** - Sessions auto-open on selected days
- 📄 **Export capabilities** - Download attendance sheets as PDF
- 🎨 **Modern UI** - Clean, intuitive interface with smooth animations

---

## 🚀 Core Features

### 1. Session Management

#### Create Sessions with Flexibility
- **Basic Info**: Title, venue name, time range, capacity limit
- **Geographic Fence**: Set location (latitude/longitude) and radius (e.g., 50 meters)
- **Multiple Verification Options**:
  - 🔓 **Location Only** - Anyone within radius can check in
  - 🔢 **Passcode** - Require a 4-8 digit code
  - ✉️ **Email Whitelist** - Only pre-approved emails can join
  - 🔗 **Shareable Link** - Secure link-based verification

#### Session Status
- **Draft** - Not yet published
- **Closed** - Published but not accepting check-ins
- **Open** - Actively accepting attendance
- **Archived** - Ended and archived

#### Recurring Schedules 🆕
- **Auto-open** on specific days of the week (Sunday-Saturday)
- **Auto-close** at end time (optional)
- Perfect for weekly classes, daily shifts, or recurring meetings
- Works autonomously - no manual intervention needed

### 2. Attendance Check-In

#### Smart Location Detection
- **Real-time GPS tracking** with accuracy monitoring
- **Manual mode** - For development/testing with preset locations
- **Location services detection** - Prompts users to enable GPS if turned off
- **Settings quick-open** - One-tap access to enable location services 🆕

#### Check-In Process
1. User opens app and goes to "Attend" tab
2. GPS locates their position
3. Nearby open sessions appear automatically
4. User selects session and verifies (passcode/email/link)
5. Instant check-in with timestamp and location accuracy

#### Check-In Validation
- Distance from center point must be within radius
- GPS accuracy must be reasonable (warnings for >100m)
- Optional early check-in window (e.g., 15 minutes before start)
- Late arrivals marked automatically based on grace period

### 3. Live Monitoring

#### Real-time Dashboard
- **Server-Sent Events (SSE)** - Attendance updates appear instantly
- **Live attendee list** - See names and check-in times as they happen
- **Statistics**: Total checked in, capacity percentage, attendance rate
- **Status badges**: Present, Late, Left early

#### Records Management
- View complete check-in history
- Filter and search attendees
- See GPS accuracy for each check-in
- Distance from center point displayed

### 4. Attendance Export

#### Export Formats
- **CSV** - Spreadsheet-compatible format
- **PDF** - Formatted attendance sheet with branding
- **Includes**: Name, email, check-in time, distance, GPS accuracy, status

#### Export Details
- Session metadata (title, venue, date/time, creator)
- Complete attendee list with all verification data
- Professional formatting for archival and reporting

### 5. User Management

#### Authentication
- **Email/Password** - Traditional registration with email verification
- **Google OAuth** - One-click sign-in with Google account
- **Secure JWT tokens** - HttpOnly, Secure, SameSite cookies
- **Email verification** - Automated verification emails via Resend (see [EMAIL_SETUP.md](EMAIL_SETUP.md))
- **Password reset** - Secure token-based password recovery via email

#### User Profiles
- **Avatar system** - 20 cute animal avatars or custom photo upload 🆕
- **Profile customization** - Change name, email, password, avatar
- **Account security** - Password reset via email tokens

#### User History
- **Personal check-in log** - See all your past attendances
- **Organized by date** - Grouped as "Today", "Yesterday", or date
- **Session details** - Venue, time, distance, GPS accuracy for each check-in

### 6. Creator Dashboard

#### Manage Your Sessions
- **Session list** - View all sessions you've created (draft, active, archived)
- **Quick actions**: Open, close, edit, delete, export
- **Status indicators** - Visual badges for session state
- **Session details** - Full control panel for each session

#### Edit Sessions
- Modify title, venue, time, location, verification method
- Update radius and capacity
- Configure or change recurring schedules 🆕
- Delete sessions with loading states 🆕

#### Analytics
- Total check-ins per session
- Attendance rate calculations
- Late arrival tracking
- Geographic distribution of check-ins

---

## 🎯 Use Cases

### Education
- **Classroom attendance** - Auto-open sessions for each class period
- **Lab sessions** - Verify students are physically in the lab
- **Field trips** - Track attendance at remote locations
- **Study groups** - Location-based meetup verification

### Corporate
- **Office check-ins** - Track when employees arrive at office
- **Team meetings** - Verify in-person meeting attendance
- **Training sessions** - Ensure participants are on-site
- **Client visits** - Log site visit attendance

### Events
- **Conferences** - Track session attendance
- **Workshops** - Verify participant presence
- **Seminars** - Monitor engagement through location
- **Networking events** - Attendance tracking for sponsors

### Field Work
- **Construction sites** - Daily worker check-ins
- **Delivery teams** - Verify location-based clock-ins
- **Security patrols** - Track guard location check-ins
- **Healthcare** - Home visit verification

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool
- **React Router 6** - Client-side routing
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **React Leaflet** - Interactive maps (OpenStreetMap)
- **Capacitor** - Native mobile capabilities
- **Axios** - HTTP client for API requests

### Backend
- **Node.js 20+** with TypeScript
- **Express** - Web application framework
- **MongoDB Atlas** - Cloud database with geospatial indexing
- **Mongoose 8** - MongoDB object modeling
- **JWT** - Secure authentication tokens
- **Bcrypt** - Password hashing
- **Passport.js** - Google OAuth integration
- **Zod** - Runtime type validation
- **Helmet** - Security headers
- **Express Rate Limit** - DDoS protection

### Mobile
- **Capacitor** - Native Android app wrapper
- **@capacitor/geolocation** - GPS access
- **@capacitor/app** - Native app integration
- **@capacitor/browser** - In-app browser

### Infrastructure
- **ES Modules** - Modern JavaScript module system
- **TypeScript** - Type-safe development
- **Nodemon** - Development auto-reload
- **TSX** - TypeScript execution
- **ESLint** - Code quality enforcement

---

## 📱 Platform Support

### Web Application
- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **Responsive design**: Phone, tablet, desktop
- **PWA-ready**: Can be installed as progressive web app
- **HTTPS required**: Geolocation API needs secure context

### Android Application
- **Minimum SDK**: Android 7.0 (API 24)
- **Target SDK**: Latest Android version
- **APK size**: ~8.5 MB
- **Permissions**: Location (required), Camera (for avatar uploads)

### Coming Soon
- iOS application (Capacitor ready)
- Offline support with background sync
- Push notifications for session reminders

---

## 🔒 Security Features

### Authentication Security
- **Bcrypt hashing** - Passwords never stored in plain text
- **JWT tokens** - HttpOnly, Secure, SameSite=Lax cookies
- **Token expiration** - Sessions expire after inactivity
- **Rate limiting** - Protection against brute force attacks

### Data Privacy
- **Minimal data collection** - Only necessary information
- **No password return** - Passwords never sent to clients
- **Private tokens** - Verification and reset tokens hashed (SHA-256)
- **Email verification** - Ensures legitimate account creation

### API Security
- **Helmet middleware** - Sets secure HTTP headers
- **CORS protection** - Only allowed origins can access API
- **Zod validation** - All inputs validated and sanitized
- **MongoDB injection prevention** - Parameterized queries

### Location Privacy
- **GPS accuracy tracking** - Users see how precise their location is
- **No continuous tracking** - Location only checked during check-in
- **Distance from center** - Stored for verification, not full coordinates
- **Creator privacy** - Attendees don't see creator's personal info

---

## 📊 Technical Highlights

### Geospatial Features
- **MongoDB 2dsphere index** - Efficient location queries
- **Haversine distance** - Accurate distance calculations
- **GeoJSON format** - Standard geographic data format
- **Radius-based queries** - Find sessions within distance

### Real-Time Updates
- **Server-Sent Events (SSE)** - Efficient one-way streaming
- **Live attendance feed** - `/sessions/:id/live` endpoint
- **Auto-reconnect** - Handles connection drops gracefully
- **Low latency** - Sub-second update delivery

### Performance Optimizations
- **Caching strategy** - Client and server-side caching 🆕
- **Stale-while-revalidate** - Serve cached data while updating
- **ETags** - Conditional requests save bandwidth
- **Background refetching** - Updates without blocking UI
- **Minimal database queries** - Optimized MongoDB operations

### Scheduled Automation
- **Cron-style scheduler** - Runs every minute
- **Auto-open sessions** - Based on day of week and time
- **Auto-close expired** - Optional automatic closure
- **Timezone aware** - Uses server timezone for scheduling
- **Reliable execution** - Continues even if individual sessions fail

---

## 🎨 User Interface

### Design System
- **Modern aesthetic** - Clean, professional appearance
- **Custom color system** - Pine green primary, semantic colors
- **Tabler Icons** - Consistent iconography throughout
- **Smooth animations** - Hover effects and transitions
- **Skeleton loaders** - Loading states for better UX

### Responsive Layout
- **Mobile-first** - Optimized for phone screens
- **Breakpoint system** - Adapts to tablet and desktop
- **Touch-friendly** - Adequate tap targets (44x44px minimum)
- **Safe zones** - Content avoids screen notches

### Accessibility
- **Semantic HTML** - Proper heading hierarchy and landmarks
- **ARIA labels** - Screen reader friendly
- **Keyboard navigation** - Full keyboard support
- **Focus indicators** - Clear focus states for navigation
- **Color contrast** - WCAG AA compliant

---

## 🚧 Current Limitations

### Email Functionality
- ✉️ Email verification tokens generated but **not sent** (placeholder)
- 📧 Password reset tokens generated but **not sent** (placeholder)
- 🔧 Mailer service exists but needs SMTP configuration

### Scheduling
- ⏰ Same time for all scheduled days (no per-day times yet)
- 📅 No recurring end date (schedules run indefinitely)
- 🌍 Server timezone used (no per-session timezone yet)

### Mobile Platform
- 🤖 Android APK available (debug build)
- 🍎 iOS build not yet tested
- 📴 No offline support yet

### Testing
- ✅ Unit tests for server utilities only (haversine, hash, CSV)
- ❌ No client tests yet
- ❌ No integration tests yet

---

## 📖 Documentation

Detailed documentation available:
- **[EMAIL_SETUP.md](EMAIL_SETUP.md)** - Email verification setup with Resend
- **[SCHEDULING.md](SCHEDULING.md)** - Recurring schedule feature guide
- **[LOCATION_SERVICES_DETECTION.md](LOCATION_SERVICES_DETECTION.md)** - GPS detection implementation
- **[AVATAR_SETUP.md](AVATAR_SETUP.md)** - Avatar system instructions
- **[CACHING.md](CACHING.md)** - Caching strategy details
- **[BUILD_APK.md](client/BUILD_APK.md)** - Android APK build guide
- **[QUICKSTART_OAUTH.md](QUICKSTART_OAUTH.md)** - Google OAuth setup

---

## 🎯 Roadmap

### Short Term
- [ ] Send actual verification and reset emails (SMTP integration)
- [ ] iOS testing and build
- [ ] Add attendance statistics dashboard
- [ ] Enhanced location accuracy warnings

### Medium Term
- [ ] Service worker for offline support
- [ ] Push notifications for session reminders
- [ ] Different times for different days in schedules
- [ ] QR code generation for sessions
- [ ] Bulk user import for email whitelists

### Long Term
- [ ] Multi-organization support with teams
- [ ] Advanced analytics and reporting
- [ ] Integration with LMS platforms (Canvas, Moodle, etc.)
- [ ] Face recognition for enhanced verification
- [ ] Geofencing with polygon shapes (not just circles)
- [ ] Attendance insights and trends

---

## 🤝 Contributing

GeoAttend is actively developed and welcomes contributions! Areas for contribution:
- 🐛 Bug fixes and issue reports
- 📝 Documentation improvements
- ✨ New feature implementations
- 🧪 Test coverage expansion
- 🎨 UI/UX enhancements
- 🌍 Internationalization (i18n)

---

## 📄 License

This project is developed for educational and organizational use.

---

## 🙏 Acknowledgments

Built with:
- OpenStreetMap tiles via Leaflet
- Tabler Icons for consistent iconography
- Radix UI for accessible components
- MongoDB Atlas free tier for database hosting
- Capacitor for native mobile capabilities

---

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check documentation files in the repository
- Review existing closed issues for solutions

---

**GeoAttend** - Making attendance tracking simple, accurate, and location-verified. 📍✅
