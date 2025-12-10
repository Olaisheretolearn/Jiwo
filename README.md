# Jiwo

## Overview
Jiwo is a cooperative notetaking platform designed for classrooms, study groups, and collaborative sessions.  
Any student can start a live note session. Other students can join instantly and see notes appear in real time as they are typed.  
Students can also upload files instead of typing live. All active sessions appear on the dashboard as “Live Notes,” and users can click into any session they have permission to join.

Jiwo focuses on speed, simplicity, and low-friction collaboration.

---

## Features

### Live Note Sessions
- Any student can start a note session.  
- Other students can join the session from the dashboard.  
- Notes update in real time via WebSockets.  
- Supports claps as positive feedback.  
- Supports “Buy Me a Coffee” links for creators.

### File Uploads
- Students can upload files (PDFs, images, etc.) instead of typing notes directly.  
- Uploaded files become part of the session for others to view.

### Cooperative Notetaking
- Multiple students can contribute to the same session.  
- Real-time syncing ensures everyone sees the latest content.

### Session Archive
- Once a session ends, it is archived.  
- Students can revisit past sessions for up to 24 hours.

---

## Tech Stack

**Backend**
- Node.js  
- Express  
- express-ws for real-time communication  
- MongoDB (Atlas)  
- Multer for handling file uploads

**Frontend**
- Pug templating engine  
- Custom CSS and JavaScript for live updates

**Other**
- Environment variables stored in `.env`  
- `.gitignore` excludes sensitive and build-related files

---

## Project Structure

