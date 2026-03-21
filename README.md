# 🛣️ Project Sadak

**A live, crowdsourced pothole reporting platform built to make Indian roads safer.**

> Every year, 20,000+ people lose their lives due to potholes on Indian roads.  
> Project Sadak gives citizens the tools to report, map, and escalate road hazards — directly to the people who can fix them.

🌐 **Live at** [projectsadak.in](http://projectsadak.in)

---

## What is Project Sadak?

Project Sadak is a civic tech platform where anyone can report a pothole from their phone or browser. Reports show up instantly on a live map, visible to volunteers, citizens, and government bodies across India — and internationally.

The goal isn't just to document bad roads. It's to create enough pressure and proof that authorities actually fix them.

---

## Features

- 📍 **Live pothole map** — Leaflet.js powered, crowdsourced, real-time
- 📸 **Photo + location reporting** — submit a report in under 30 seconds
- 🔐 **Google Sign-In** — lightweight auth, no passwords
- 🌆 **Multi-city coverage** — volunteers active across Delhi, Mumbai, and internationally
- 📧 **Automated alerts** — reports routed toward relevant civic bodies
- 📊 **Public data** — all reports are open and visible to everyone

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Map | Leaflet.js |
| Auth | Google OAuth |
| Backend | Node.js / Firebase (or your actual stack) |
| Hosting | Vercel |
| Domain | GoDaddy → projectsadak.in |

> Update the backend row with your actual stack if different.

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/yourusername/project-sadak.git
cd project-sadak

# Install dependencies
npm install

# Run locally
npm run dev
```

Set up your `.env` file:

```env
GOOGLE_CLIENT_ID=your_google_oauth_client_id
FIREBASE_API_KEY=your_firebase_key
# add other keys as needed
```

---

## Why This Exists

India loses billions every year to pothole-related accidents, vehicle damage, and medical costs. The problem isn't that nobody knows — it's that there's no accountability loop between citizens and repair authorities.

Project Sadak is that loop.

Built by [Parth Anand](https://primestudios.co.in), a student developer from Delhi.

---

## Current Status

- ✅ Platform live at projectsadak.in
- ✅ Volunteers onboarded across multiple Indian cities + international
- ✅ Submitted to Hack Club Flavortown showcase
- 🔄 Government partnership outreach in progress (MCD, DDA, CPGRAMS)
- 🔄 Press and media outreach ongoing

---

## Contributing

Contributions are welcome — whether that's code, design, testing, or just spreading the word.

1. Fork the repo
2. Create a branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a pull request

For major changes, open an issue first to discuss what you'd like to change.

---

## Contact

**Parth Anand**  
[primestudios.co.in](https://primestudios.co.in)  
Built with ❤️ in Delhi

---

## License

MIT — use it, fork it, build on it.
