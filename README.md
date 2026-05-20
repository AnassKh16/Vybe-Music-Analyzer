<div align="center">

<br/>

# 〰️ Vybe
### *Feel the Data. Hear the Stats.*

<br/>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.10-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Flask](https://img.shields.io/badge/Flask-API-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

<br/>

> A Spotify-inspired music statistics and discovery web app that transforms 114,000 real Spotify tracks into interactive, beautiful, and statistically meaningful experiences — powered by Python, probability theory, regression modeling, and Naive Bayes classification.

<br/>

**[🎧 Try Vybe Live →](https://vybe-stats-main.vercel.app/)**

<br/>

</div>

---

## 📸 Screenshots

> Add your screenshots here after capturing them from the live app

| Home Dashboard | Playlist Generator | Song Face-Off |
|:-:|:-:|:-:|
| `<img width="851" height="818" alt="image" src="https://github.com/user-attachments/assets/375f14ef-b922-49d1-a757-93bc43590f16" />
`<img width="858" height="821" alt="image" src="https://github.com/user-attachments/assets/da418160-fe05-4055-9dd3-a19ada62e697" />
`<img width="846" height="814" alt="image" src="https://github.com/user-attachments/assets/4eb6238c-1dc1-4a08-b5cc-8d27e803618f" />
`|

| Hit Predictor | Genre Battle | Live Quiz |
|:-:|:-:|:-:|
| `<img width="885" height="822" alt="image" src="https://github.com/user-attachments/assets/4d9d94c8-d1fc-498c-a878-6d0c19d8f9a9" />
`<img width="867" height="818" alt="image" src="https://github.com/user-attachments/assets/3779e553-e340-49c1-990d-4e9300130147" />
`<img width="843" height="818" alt="image" src="https://github.com/user-attachments/assets/15c50a1e-3fd0-4f85-a718-eaadcd568e2d" />
` |

---

## 🎯 What is Vybe?

**Vybe** is not just a stats dashboard. It is a full music intelligence platform built as a university project for **MT2005 Probability and Statistics** at FAST NUCES Faisalabad-Chiniot Campus. Every single feature is backed by a real statistical concept from the course.

The app uses the **Spotify Tracks Dataset** (114,000 songs with 18 audio features) to power 9 interactive features — from Naive Bayes genre classification to OLS regression-based popularity prediction.

---

## ✨ Features

### 🎭 1. Music Personality Quiz
Answer 5 questions using interactive mood sliders. The app uses **Naive Bayes conditional probability** to compute your listener DNA and assigns you a personality type like *"The Midnight Burner"* or *"The Hype Machine"* — displayed as an animated donut chart breakdown.

---

### 🎵 2. Smart Playlist Generator
Pick a mood (Study / Gym / Party / Heartbreak / Road Trip / Late Night). The app filters 114,000 songs using **regression model coefficients** as feature weights and returns the 10 best matching tracks — each with a radar chart showing the playlist's audio DNA.

---

### ⏳ 3. Year Rewind
Drag a year range slider from 2000 to 2024 and watch animated trend lines show how **danceability, energy, and valence** of music evolved over time. Includes fun era badges like *"Most Danceable Year: 2012"* computed from descriptive statistics.

---

### 🕰️ 4. Music Time Machine *(Showstopper)*
Search any artist and pick a decade. The app computes the artist's average **audio feature vector** and uses **Euclidean distance** to find the closest matching songs from that era — returning *"Your Drake playlist from the 1980s."*

---

### ⚔️ 5. Song Face-Off *(Showstopper)*
Pick two songs and battle them head-to-head. The app pulls both from the dataset, overlays their **radar charts**, compares every feature with a winner highlight, computes a **weighted statistical score** using OLS coefficients, and declares a winner with P(A > B) probability.

---

### 🎯 6. Hit Song Probability Calculator
Set a target popularity score and the app draws a **Normal distribution bell curve** fitted on the dataset, shades the area, and computes **P(X > target)**. Also includes a **Binomial calculator** (k hits in n releases) and a **Poisson estimator** for viral songs per playlist.

---

### 🥊 7. Genre Battle Arena
Pick two genres and battle them statistically. The app renders **side-by-side box plots**, runs a live **t-test**, displays the p-value, and announces a winner with a plain-English verdict like *"Pop wins (p = 0.002, reject H₀)"*. Also shows **confidence interval overlap** visually.

---

### 🎲 8. Live Vybe Quiz *(Showstopper)*
A mystery song's audio features are shown as an animated radar chart — no name, no genre. You guess the genre. Then the **Naive Bayes classifier** reveals its prediction with posterior probabilities. A scoreboard tracks You vs AI across rounds.

---

### 🔬 9. Data Explorer & EDA
Browse all 114,000 songs in a searchable table. View the full **correlation heatmap** (click any cell for the scatter plot), explore **histogram distributions** with fitted curves for any audio feature, and read a complete **descriptive statistics** summary table.

---

## 🗂️ Dataset

| Property | Detail |
|---|---|
| **Source** | [Spotify Tracks Dataset — Kaggle](https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset) |
| **Size** | 114,000 songs |
| **Features** | 18 attributes per song |
| **Key variables** | `popularity`, `danceability`, `energy`, `tempo`, `valence`, `acousticness`, `track_genre` |

### Key Variables Used

| Variable | Range | Description |
|---|---|---|
| `popularity` | 0–100 | Target variable — Spotify popularity score |
| `danceability` | 0–1 | How suitable the track is for dancing |
| `energy` | 0–1 | Intensity and power of the track |
| `tempo` | 0–250 BPM | Speed of the song |
| `valence` | 0–1 | Musical positiveness / happiness |
| `acousticness` | 0–1 | How acoustic (non-electronic) the track is |
| `track_genre` | Categorical | Genre label for classification |

---

## 🧠 Statistical Methods Implemented

| Method | Where Used | Course Week |
|---|---|---|
| Descriptive Statistics (mean, median, SD, IQR, skewness) | Data Explorer, Home | Weeks 3–4 |
| Graphical Representation (histograms, bar charts, pie charts) | EDA, Year Rewind | Week 2 |
| Correlation & Covariance Matrix | Data Explorer, Face-Off | Week 13 |
| Normal Distribution & Area Under Curve | Hit Probability Calculator | Week 11 |
| Binomial Distribution | Hit Probability Calculator | Week 9 |
| Poisson Distribution | Hit Probability Calculator | Week 10 |
| Conditional Probability & Bayes Theorem | Personality Quiz, Genre Battle | Week 7 |
| Naive Bayes Classifier | Personality Quiz, Live Quiz | Week 7 |
| OLS Multiple Linear Regression | Hit Predictor, Face-Off | Weeks 13–14 |
| Confidence Intervals | Genre Battle, Hit Predictor | Week 16 |
| Hypothesis Testing (t-test, p-values) | Genre Battle Arena | Week 16 |
| Euclidean Distance / Similarity | Time Machine, Face-Off | Week 13 |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Styling and dark theme |
| **Framer Motion** | Animations and transitions |
| **Recharts** | Data visualizations (radar, line, bar, histogram) |
| **Axios** | HTTP requests to Flask backend |
| **React Router** | Page navigation |
| **Lucide React** | Icons |

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.10** | Backend language |
| **Flask** | REST API server |
| **Flask-CORS** | Cross-origin requests |
| **Pandas** | Data manipulation |
| **NumPy** | Numerical computations |
| **SciPy** | Statistical functions |
| **Statsmodels** | OLS Regression |
| **Scikit-learn** | Naive Bayes Classifier |

### External APIs
| API | Purpose |
|---|---|
| **Last.fm API** | Album artwork for song cards |

### Deployment
| Platform | Purpose |
|---|---|
| **Vercel** | Frontend deployment |
| **Local / Server** | Flask backend |

---

## 🚀 Getting Started

### Prerequisites
Make sure you have these installed:
- Node.js 18+
- Python 3.10+
- npm or yarn
- pip

---

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/vybe.git
cd vybe
```

---

### 2. Set up the Frontend
```bash
# Navigate to frontend folder
cd vybe-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
Frontend runs at **http://localhost:5173**

---

### 3. Set up the Backend
```bash
# Navigate to backend folder
cd vybe-backend

# Install Python dependencies
pip install flask flask-cors pandas numpy scipy scikit-learn statsmodels

# Download the Spotify dataset from Kaggle and place it at:
# vybe-backend/data/spotify.csv

# Start the Flask server
python app.py
```
Backend runs at **http://localhost:5000**

---

### 4. Configure environment
Create a `.env` file in the frontend folder:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_LASTFM_API_KEY=your_lastfm_api_key_here
```

Get your free Last.fm API key at: **https://www.last.fm/api/account/create**

---

### 5. Open the app
Go to **http://localhost:5173** in your browser and you are good to go!

---

## 📁 Project Structure

```
vybe/
│
├── vybe-frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/            # Reusable components
│   │   │   ├── CustomSlider.jsx   # Branded amber-to-green slider
│   │   │   ├── SongCard.jsx       # Swipeable song card with artwork
│   │   │   ├── SongCarousel.jsx   # Horizontal scroll carousel
│   │   │   ├── Logo.jsx           # Vybe V-wave logo
│   │   │   ├── BottomNav.jsx      # Bottom navigation bar
│   │   │   └── TopNav.jsx         # Top navigation bar
│   │   │
│   │   ├── pages/                 # App screens
│   │   │   ├── Splash.jsx         # Onboarding / splash screen
│   │   │   ├── Login.jsx          # Login screen
│   │   │   ├── Signup.jsx         # Sign up screen
│   │   │   ├── Home.jsx           # Home dashboard
│   │   │   ├── PersonalityQuiz.jsx
│   │   │   ├── PlaylistGenerator.jsx
│   │   │   ├── YearRewind.jsx
│   │   │   ├── TimeMachine.jsx
│   │   │   ├── SongFaceOff.jsx
│   │   │   ├── HitProbability.jsx
│   │   │   ├── GenreBattle.jsx
│   │   │   ├── LiveQuiz.jsx
│   │   │   ├── DataExplorer.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Profile.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js             # All Flask API calls
│   │   │   └── lastfm.js          # Last.fm album artwork
│   │   │
│   │   └── App.jsx                # Routes and app entry
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── vybe-backend/                  # Python Flask backend
│   ├── app.py                     # Flask API server (all endpoints)
│   ├── stats.py                   # Descriptive statistics (Member 2)
│   ├── probability.py             # Probability distributions (Member 3)
│   ├── regression.py              # OLS regression model (Member 4)
│   ├── naivebayes.py              # Naive Bayes classifier (Member 5)
│   └── data/
│       └── spotify.csv            # Kaggle dataset (114K songs)
│
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Used In |
|---|---|---|---|
| GET | `/api/stats?feature=popularity` | Descriptive statistics | Data Explorer |
| GET | `/api/correlation` | Correlation matrix | Data Explorer |
| GET | `/api/histogram?feature=energy` | Histogram data | Data Explorer |
| POST | `/api/boxplot` | Box plot stats for 2 genres | Genre Battle |
| POST | `/api/probability/normal` | Normal distribution + P(X>target) | Hit Probability |
| POST | `/api/probability/binomial` | Binomial distribution | Hit Probability |
| POST | `/api/probability/poisson` | Poisson estimate | Hit Probability |
| POST | `/api/probability/conditional` | Conditional probability | Genre Battle |
| GET | `/api/normality-test?feature=popularity` | Shapiro-Wilk test | Data Explorer |
| GET | `/api/regression/summary` | R², coefficients, p-values | Data Explorer |
| POST | `/api/predict` | Predict popularity score | Hit Predictor |
| POST | `/api/similar-songs` | Find similar songs | Face-Off, Predictor |
| POST | `/api/confidence-intervals` | CI + t-test + verdict | Genre Battle |
| POST | `/api/classify-genre` | Naive Bayes genre prediction | Quiz, Personality |
| GET | `/api/mystery-song` | Random mystery song | Live Quiz |
| POST | `/api/playlist` | Generate mood playlist | Playlist Generator |

---

## 👥 Team

<div align="center">

| | Name | Role |
|:-:|---|---|
| 🎨 | **Anass Khan** | Frontend Development & UI/UX — Built the complete React + Vite web app, all 15 screens, reusable components, animations, and API integration |
| 📊 | **Kanzah Sajjad** | Statistical Analysis — Descriptive statistics, EDA, correlation matrix, probability distributions, and data visualization |
| 🧠 | **Saad ur Rehman** | Machine Learning & Backend — OLS regression model, Naive Bayes classifier, Flask REST API, and Python statistical models |

</div>

---

## 📖 References

- Walpole, R.E. — *Probability & Statistics for Engineers and Scientists*
- Ross, S. — *A First Course in Probability*
- Akritas, M. — *Probability & Statistics with R for Engineers and Scientists*
- [Spotify Tracks Dataset — Kaggle](https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset)
- [Last.fm API Documentation](https://www.last.fm/api)

---

<div align="center">

<br/>

Made with 🎧 and a lot of statistics by **Anass Khan**, **Kanzah Sajjad** & **Saad ur Rehman**

**FAST NUCES Faisalabad-Chiniot Campus — Spring 2026**

<br/>

</div>
