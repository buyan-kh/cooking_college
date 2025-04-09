# 🔄 Deepify Workflow Diagram

The following diagram illustrates the main workflows and user journeys in the Deepify application.

## User Journey

```mermaid
flowchart TD
    Start([User Starts]) --> CourseFlow
    Start --> NotesFlow
    Start --> QuizFlow

    subgraph CourseFlow[Course Management Flow]
        C1[Upload Syllabus] -->|PDF/DOCX| C2[AI Processing]
        C2 --> C3[Generate Roadmap]
        C3 --> C4[Save Course]

        C5[Create Custom Course] --> C4

        C4 --> C6[View Course Dashboard]
        C6 --> C7[Track Progress]
    end

    subgraph NotesFlow[Notes Management Flow]
        N1[Select Topic] --> N2{Choose Input Method}
        N2 -->|Text| N3[Enter Notes]
        N2 -->|Document| N4[Upload PDF/DOCX]
        N2 -->|Handwritten| N5[Upload Image]

        N3 --> N6[Process Notes]
        N4 -->|Extract Text| N6
        N5 -->|OCR/Vision AI| N6

        N6 --> N7[Save Notes]
        N7 --> N8[View Notes]
    end

    subgraph QuizFlow[Quiz Flow]
        Q1[Select Topic] --> Q2{Quiz Type}
        Q2 -->|Pre-lecture| Q3[Generate Pre-lecture Quiz]
        Q2 -->|Notes-based| Q4[Generate Quiz from Notes]

        Q3 --> Q5[Take Quiz]
        Q4 --> Q5

        Q5 --> Q6[Submit Answers]
        Q6 --> Q7[View Results]
        Q7 --> Q8[Rate Confidence]
        Q8 --> Q9[Schedule for Repetition]
    end

    CourseFlow -.-> NotesFlow
    NotesFlow -.-> QuizFlow
```

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
flowchart TD
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
