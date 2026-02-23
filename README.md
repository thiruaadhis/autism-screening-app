# Medzilla: Autism Screening & Video Analysis Toolkit

## What This Project Does
This project is a full-stack, AI-powered web application designed to provide an accessible and insightful screening tool for autism. 

Unlike traditional, purely text-based questionnaires, this platform is being engineered to feature a **Hybrid Screening Architecture**:
1. **Clinical Questionnaire Engine:** A rigorous 30-question behavioral assessment utilizing an Escalation Matrix to handle false positives.
2. **Computer Vision Analysis (In Development):** A machine learning pipeline that will analyze user-uploaded videos using OpenCV and deep learning to track facial landmarks, pose, and repetitive motions.

**Mission Statement:** Autism is not a disease; it is neurodivergence. This toolkit is designed to map these unique neurological patterns to help individuals get the support and understanding they need to thrive.

---

## The Journey So Far (Current Features)
We have successfully built a bulletproof, monolithic foundation for the web application. The frontend and backend are fully integrated with a sleek, highly-optimized custom UI.

* **Advanced Clinical Scoring Logic:** * Implemented reverse-scoring mathematics for inverted psychological questions.
    * Engineered an **Escalation Matrix** that tracks "Critical Flags" (e.g., lack of eye contact) to establish moderate vs. high likelihood floors, drastically reducing false-positive panic.
    * Divides raw scores into specific DSM-5 sub-domains: "Social Communication" and "Behavioral" percentages.
* **Sleek, Tactile UI/UX Architecture:** * A monochromatic, dark-mode medical theme utilizing Z-index layering for physical depth.
    * Physics-based, hardware-accelerated CSS animations utilizing custom `cubic-bezier` curves for a tactile, native-app feel.
    * A responsive "Mini-Sidebar" that collapses seamlessly, centering SVG icons and hiding text to maximize viewport real estate.
    * Dedicated, decoupled user hubs for **Profile Management** and **Settings & Accessibility**.
* **Modern State & Error Management:** * Replaced all synchronous, blocking browser `alert()` popups with smooth-scrolling, DOM-based inline error banners for a fluid, uninterrupted user experience.
* **Bulletproof Authentication System:** * Real-time Regex validation for email formatting.
    * Password verification checks with interactive "eye" toggles for visibility.
    * Localized JSON database (`accounts.json`) for rapid prototyping and secure, localized testing.
* **Seamless UX Flow:** Fluid routing between login, signup, the assessment, result generation, and the central command dashboard without relying on page-refresh lag.

---

## The Kaiju Roadmap (What's Next)
The structural foundation is complete. Next, we awaken the Machine Learning models. 

- [ ] **Data Parsing & UI Rendering (`results.js`):** Intercept the new sub-domain scores from the backend and render dynamic, visual progress bars on the results dashboard.
- [ ] **Video Upload Pipeline:** Build `video_routes.py` and frontend logic to securely chunk and upload user videos to the backend storage.
- [ ] **Frame Extraction:** Implement Python scripts to slice video data into processable image frames.
- [ ] **Computer Vision Core (`face_detection.py`):** Integrate OpenCV and facial landmark models to detect eye contact frequency and emotional reactivity.
- [ ] **Pose & Motion Analytics (`pose_analysis.py`):** Utilize pose-estimation to track and classify repetitive motor movements (e.g., rocking, hand-flapping).
- [ ] **Data Synthesis:** Merge the questionnaire score with the ML video analysis score to provide a comprehensive, multi-modal screening report.

---

## Tech Stack (Up to Now)

**Frontend:**
* **HTML5 / CSS3:** Custom monochromatic dark theme, Flexbox architecture, and advanced CSS transitions.
* **Vanilla JavaScript (ES6+):** Asynchronous `fetch` API integration, local storage session management, and precise DOM manipulation.

**Backend:**
* **Python 3:** The core server language.
* **Flask:** Lightweight WSGI web application framework used for building the API endpoints and Blueprint routing.
* **Flask-CORS:** Handling Cross-Origin Resource Sharing to bridge the frontend and backend.
* **JSON:** Lightweight, localized database for rapid prototyping.

---
*Built with savage grind, 24/7 dedication, and zero distractions. Code, eat, sleep, repeat.*