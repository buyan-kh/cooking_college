# 🍳 Cooking College

Try it now at:

## [https://cooking.buyan.tech/](https://cooking.buyan.tech/)

Cooking College: AI-powered study tool, built on evidence-based learning techniques.

## ✨ Features

### 📋 Course Management

- **Syllabus Processing** - Upload your course syllabus (PDF/DOCX) and get an AI-generated study roadmap
- **Custom Courses** - Create and manage your own courses
- **Progress Tracking** - Monitor your learning journey with visual progress indicators

### 🧩 Smart Quizzes

- **Pre-lecture Quizzes** - Test your knowledge before diving into topics
- **Notes-based Quizzes** - Generate quizzes from your own notes
- **Handwritten Notes Analysis** 📝 - Take photos of your handwritten notes and let AI generate quizzes
- **Spaced Repetition** ⏰ - Smart scheduling of review questions based on your confidence ratings

### 📝 Test yourself from your notes

- **Flexible Formats** - Add notes as text, upload PDFs/DOCXs, or take photos of handwritten notes
- **Content Extraction** - Automatic text extraction from uploaded documents
- **Image Support** - Store and view images alongside your notes

<img src="./1.png">

## 🚀 Youtube demo link

### <a href="https://youtu.be/-K4-ZRm3IHY">Link</a>

### Prerequisites if you want to try:

- Python 3.10+
- MongoDB Atlas account
- Google Gemini API key

## 🔧 Techstack

### Frontend

- ⚛️ Next.js
- 🎨 Tailwind CSS
- 🧰 TypeScript
- 📊 React

### Backend

- 🐍 FastAPI
- 🗄️ MongoDB Atlas
- 🤖 Google Gemini AI
- 📄 PDF & DOCX processing

## 📱 Key User Journeys

1. **Course Creation** - Upload a syllabus and get an instant roadmap
2. **Pre-lecture Preparation** - Take AI-generated quizzes to prepare for upcoming topics
3. **Notes Enhancement** - Convert notes into interactive quizzes
4. **Spaced Learning** - Review material at optimal intervals for better retention
5. **Handwritten Notes** - Snap photos of your notes for automatic digitization and quiz generation

## ⚠️ Limitations

- Handwriting analysis works best with clear, well-spaced writing
- PDF extraction might not preserve complex formatting
- API rate limits apply for the free tier of Gemini AI

<img src="./2.png">
<img src="./3.png">
<img src="./4.png">

## Data Flow Architecture

```mermaid
flowchart TD
    subgraph Frontend
        UI[User Interface] --> API[API Client]
        API --> State[State Management]
        State --> UI
    end

    subgraph Backend
        Routes[FastAPI Routes] --> Services[Service Layer]
        Services --> DB[MongoDB Integration]
        Services --> AI[AI Integration]
    end

    subgraph ExternalServices
        MongoDB[(MongoDB Atlas)]
        Gemini[Google Gemini AI]
    end

    UI -->|HTTP Requests| Routes
    Routes -->|HTTP Responses| UI
    DB <-->|CRUD Operations| MongoDB
    AI <-->|API Calls| Gemini
```

## Document Processing Pipeline

```mermaid
flowchart LR
    Upload[File Upload] --> Validation[File Validation]
    Validation -->|Valid| Extract[Content Extraction]
    Validation -->|Invalid| Error[Error Response]

    Extract -->|Text| Process[AI Processing]
    Extract -->|Images| Vision[Vision AI]

    Process --> Structure[Structure Data]
    Vision --> Structure

    Structure --> Save[Save to Database]
    Save --> Response[API Response]
```

## Quiz Generation Workflow

```mermaid
flowchart LR
    Start([Quiz Request]) --> Source{Source Type}

    Source -->|Course Topics| C1[Fetch Topic Content]
    Source -->|User Notes| N1[Fetch Notes]

    C1 --> P1[Generate Prompt]
    N1 --> P1

    P1 --> AI[Send to Gemini AI]
    AI --> Parse[Parse Response]
    Parse --> Format[Format Quiz]
    Format --> Save[Save Quiz]
    Save --> Return[Return Quiz to User]

    subgraph Confidence-Based Repetition
        Answer[User Answers] --> Score[Calculate Score]
        Score --> Confidence[User Confidence Rating]
        Confidence --> Algorithm[Spacing Algorithm]
        Algorithm --> Schedule[Schedule Repetition]
    end

    Return --> Answer
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
