# CogniCare: AI-Powered Early-Stage Dementia Detection

> A project for Smart India Hackathon, developed to provide an accessible, low-cost screening tool for the early detection of dementia using multi-modal AI analysis.

## 🌟 Our Vision

Dementia affects millions, yet early detection remains a significant challenge due to a lack of accessible and affordable screening tools. CogniCare aims to bridge this gap by leveraging the power of AI to analyze speech, cognitive performance, and behavioral patterns, providing an early-warning risk score that can empower individuals and clinicians to take timely action.

## 👥 Meet the Team

This project is brought to you by a dedicated team of innovators:

- **Pulkit Pathak**
- **Somya Aggarwal**
- **Pratyusha Chaturvedi**
- **Sarthak Chalia**
- **Ishita Srivastava**
- **Arpita Arora**

## 🎯 The Problem

The onset of dementia is often subtle, with early signs being missed or mistaken for normal aging. Traditional diagnostic methods can be expensive, time-consuming, and require specialist visits, making them inaccessible to a large portion of the population, especially in remote areas. There is a critical need for a scalable, user-friendly screening tool that can be used at home.

## ✨ Our Solution: CogniCare

CogniCare is a mobile-first application that transforms a smartphone into a powerful tool for monitoring cognitive health. By engaging users in a series of simple tasks and passively analyzing behavioral markers, our AI model generates a comprehensive Dementia Risk Score (DRS).

### Key Features

- **🧠 Gamified Cognitive Assessments**: A suite of engaging games designed to evaluate key cognitive domains like memory, attention, and visuospatial skills.

- **🗣️ Advanced Speech & Language Analysis**: The AI analyzes linguistic features (e.g., lexical diversity, coherence) and acoustic features from voice recordings to detect subtle changes in speech patterns.

- **🚶 Passive Behavioral Monitoring**: With user consent, the app analyzes phone sensor data (e.g., activity levels, circadian rhythms) to identify behavioral changes associated with cognitive decline.

- **🤖 AI-Powered Risk Scoring**: A multi-modal fusion model combines data from all assessments to generate a reliable risk score, helping to identify at-risk individuals who should seek a clinical evaluation.

- **🧑‍⚕️ Clinician & Caregiver Dashboard**: A secure web portal that provides healthcare professionals and caregivers with a longitudinal view of a user's cognitive health, complete with explainable AI (XAI) insights.

- **🏞️ "Memory Lane" Feature**: A unique, nostalgia-based assessment that uses personal photos to make tasks more engaging and serve as a form of reminiscence therapy.

## 🛠️ System Architecture & Technology Stack

CogniCare is built on a modern, scalable microservices architecture to ensure reliability and maintainability.

### Architecture Overview

- **Client Layer**: Mobile app (React Native/Flutter) and a web dashboard (React.js)
- **Backend Services Layer**: A set of microservices (Node.js, Python, Go) to manage users, assessments, and AI analysis
- **Data & AI Layer**: Secure databases (PostgreSQL, MongoDB) and the core machine learning models (TensorFlow/PyTorch)

### Technology Stack

| Category | Technologies |
|----------|-------------|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| AI/ML | TensorFlow, PyTorch, OpenAI API |
| Database | PostgreSQL, MongoDB |
| Deployment | Vercel, Docker |

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/your_username/CogniCare.git
   ```

2. **Install NPM packages**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- Smart India Hackathon for providing the platform to develop this solution
- All contributors and supporters of this project
- The open-source community for the amazing tools and libraries

---

**Made with ❤️ for early dementia detection and cognitive health monitoring**
