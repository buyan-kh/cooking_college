#!/usr/bin/env python
"""
Notes Quiz Generator - Creates multiple-choice quizzes from student notes using Gemini.

This module provides functionality to:
1. Extract key information from student notes
2. Generate challenging multiple-choice questions using Gemini
3. Structure the questions with 4 options and identify the correct answer

To be integrated with the main FastAPI application.
"""

import json
import re
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from google import genai
import google.generativeai as genair

# Load environment variables
load_dotenv()

# Initialize Gemini client
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set.")

# Create a new client with the API key
genai_client = genai.Client(api_key=GOOGLE_API_KEY)
# No need to get a model instance explicitly - we'll use the model name directly

def generate_multiple_choice_quiz(
    notes_text: str, 
    note_title: str, 
    image_content: Optional[bytes] = None, 
    image_mime_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Generate a multiple-choice quiz based on the provided notes.
    
    Args:
        notes_text: The text content of the notes
        note_title: The title of the notes
        image_content: Optional image data in bytes
        image_mime_type: MIME type of the image if provided
        
    Returns:
        A list of quiz questions with options and correct answers
    """
    print(f"Generating quiz for: {note_title}")
    print(f"Notes length: {len(notes_text)} characters")
    if image_content:
        print(f"Image provided: {len(image_content)} bytes, mime type: {image_mime_type}")
    else:
        print("No image provided")
    
    # Create a different prompt based on whether we have an image or text    
    if image_content and image_mime_type:
        # Special prompt for handwritten notes in images
        prompt = f"""
You are an expert educator analyzing handwritten or typed notes in an image to create a quiz.

First, carefully read and understand all the content visible in the image, which contains notes on: {note_title}

If there is handwritten text, analyze it thoroughly and extract all important information.

Then, create 10 multiple-choice quiz questions based on these notes. Each question should:
1. Test key concepts from the image content
2. Have 4 possible answer choices (A, B, C, D)
3. Have exactly one correct answer
4. Be challenging but fair

Format each question as a JSON object with these fields:
- id: question number (1-10)
- question: the full question text
- options: array of 4 possible answers
- correctAnswer: the correct answer (must be one of the options)

Return ONLY a valid JSON array with these 10 questions. No explanation or other text.
The structure should be exactly like this:
[
  {{
    "id": 1,
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B"
  }},
  ...and so on for all 10 questions
]
"""
        print("Using image-specific prompt for handwritten notes")
    else:
        # Original prompt for text-based notes
        prompt = f"""
You are an expert educator creating flashcard-style multiple-choice questions for students based on their notes.

NOTES TITLE: {note_title}

NOTES CONTENT:
{notes_text}

Create 10 multiple-choice quiz questions based on these notes. Each question should:
1. Test key concepts from the notes
2. Have 4 possible answer choices (A, B, C, D)
3. Have exactly one correct answer
4. Be challenging but fair

Format each question as a JSON object with these fields:
- id: question number (1-10)
- question: the full question text
- options: array of 4 possible answers
- correctAnswer: the correct answer (must be one of the options)

Return ONLY a valid JSON array with these 10 questions. No explanation or other text.
The structure should be exactly like this:
[
  {{
    "id": 1,
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B"
  }},
  ...and so on for all 10 questions
]
"""

    try:
        # Configure generation parameters
        if not hasattr(genai_client, 'config'):
            print("Note: This version of the Gemini SDK doesn't have a config attribute. Using default settings.")
        else:
            # Set generation parameters globally
            genai_client.config.temperature = 0.2
            genai_client.config.top_p = 0.95
            genai_client.config.max_output_tokens = 4096
        
        # Use the format compatible with SDK version 0.8.4
        if image_content and image_mime_type:
            print("Including image in the Gemini prompt")
            # Import necessary components for image handling
            import base64
            import io
            from PIL import Image
                        
            # Create a generative model instance for vision
            print("Creating GenerativeModel for vision")
            model = genair.GenerativeModel('gemini-2.0-flash')
            
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_content))
            
            # Call the model with the image and prompt
            print(f"Calling Gemini API with vision model and image...")
            try:
                # Use the generate_content method of the model instance
                response = model.generate_content([prompt, image])
                print("Gemini API call successful")
            except Exception as api_error:
                print(f"Gemini API call failed: {api_error}")
                import traceback
                traceback.print_exc()
                raise ValueError(f"Gemini API call failed: {api_error}")
        else:
            print("Using text-only Gemini prompt")
            # Create a generative model instance for text
            model = genair.GenerativeModel('gemini-2.0-flash') 
            
            # Call the API with just the text prompt
            print(f"Calling Gemini API with text model...")
            try:
                # Use the generate_content method of the model instance
                response = model.generate_content(prompt)
                print("Gemini API call successful")
            except Exception as api_error:
                print(f"Gemini API call failed: {api_error}")
                import traceback
                traceback.print_exc()
                raise ValueError(f"Gemini API call failed: {api_error}")
        
        # Extract and clean the response text
        print("Processing Gemini response...")
        raw_text = response.text
        print(f"Response length: {len(raw_text)} characters")
        print(f"Response preview: {raw_text[:100]}...")
        
        # Clean up any markdown code block formatting
        stripped = raw_text.strip()
        if stripped.startswith("```"):
            print("Detected markdown code block, removing formatting")
            stripped = re.sub(r"^```[a-zA-Z]*\n", "", stripped)
            stripped = re.sub(r"```$", "", stripped)
            stripped = stripped.strip()
            
        # Parse the JSON response
        print("Parsing JSON response...")
        try:
            quiz_data = json.loads(stripped)
            print(f"JSON parsed successfully, got {len(quiz_data)} items")
        except json.JSONDecodeError as json_err:
            print(f"JSON parsing failed: {json_err}")
            print(f"Failed content: {stripped[:500]}...")
            raise ValueError(f"Failed to parse JSON from Gemini response: {json_err}")
        
        # Validate the quiz data structure
        print("Validating quiz data structure...")
        if not isinstance(quiz_data, list) or len(quiz_data) == 0:
            print(f"Unexpected data format: {type(quiz_data)}")
            raise ValueError("Unexpected quiz data format")
            
        valid_questions = []
        for i, question in enumerate(quiz_data):
            try:
                # Ensure all required fields are present
                if not all(key in question for key in ["id", "question", "options", "correctAnswer"]):
                    print(f"Question {i+1} missing required fields: {question}")
                    continue
                
                # Ensure correctAnswer is one of the options
                if question["correctAnswer"] not in question["options"]:
                    print(f"Question {i+1} has correctAnswer not in options: {question}")
                    continue
                
                valid_questions.append(question)
            except Exception as q_err:
                print(f"Error validating question {i+1}: {q_err}")
                
        print(f"Validation complete, {len(valid_questions)} valid questions out of {len(quiz_data)}")
        
        if not valid_questions:
            raise ValueError("No valid questions found in Gemini response")
            
        return valid_questions
        
    except Exception as e:
        print(f"Error generating quiz: {e}")
        import traceback
        traceback.print_exc()
        # Return a simplified error structure
        return [{"error": f"Failed to generate quiz: {str(e)}"}]

def create_notes_quiz_endpoint(
    course_id: str,
    topic_number: int,
    note_title: str,
    note_content: str,
    image_data: Optional[bytes] = None,
    image_mime_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Function to be called from the FastAPI endpoint to create a notes quiz.
    
    Args:
        course_id: The ID of the course
        topic_number: The topic number
        note_title: The title of the notes
        note_content: The text content of the notes
        image_data: Optional image data in bytes
        image_mime_type: MIME type of the image if provided
        
    Returns:
        A dictionary with the quiz data
    """
    print(f"Creating notes quiz endpoint for course {course_id}, topic {topic_number}")
    
    # Generate the quiz questions
    questions = generate_multiple_choice_quiz(
        note_content, 
        note_title, 
        image_data, 
        image_mime_type
    )
    
    # Check if there was an error
    if len(questions) == 1 and "error" in questions[0]:
        print(f"Quiz generation failed with error: {questions[0]['error']}")
        return {"error": questions[0]["error"]}
        
    # Check if we got any valid questions
    if not questions:
        print("No valid questions were generated")
        return {"error": "Failed to generate valid quiz questions from the provided notes"}
    
    # Create the quiz object
    quiz = {
        "course_id": course_id,
        "topic_number": topic_number,
        "title": f"Quiz: {note_title}",
        "description": f"Test your knowledge from your notes on {note_title}",
        "source": "Your uploaded notes",
        "questions": questions,
        "created_at": None  # Will be set by the database
    }
    
    # Handle image ID if provided
    if image_data:
        quiz["has_image"] = True
        print("Image data included in quiz")
    
    print(f"Quiz created with {len(questions)} questions")
    return quiz

# Example usage (for testing)
if __name__ == "__main__":
    # Test with sample notes
    sample_notes = """
    The Krebs cycle, also known as the citric acid cycle or tricarboxylic acid (TCA) cycle, 
    is a series of chemical reactions used by all aerobic organisms to release stored energy. 
    It occurs in the mitochondrial matrix and is a key metabolic pathway that connects 
    carbohydrate, fat, and protein metabolism.
    
    The cycle starts when acetyl-CoA, derived from pyruvate oxidation, joins with oxaloacetate 
    to form citrate. Through a series of reactions, citrate is transformed back to oxaloacetate, 
    releasing carbon dioxide and energy-rich compounds like NADH and FADH2. 
    These compounds enter the electron transport chain to produce ATP.
    
    The Krebs cycle produces:
    - 3 NADH molecules
    - 1 FADH2 molecule
    - 1 GTP (equivalent to ATP)
    - 2 CO2 molecules
    
    Key enzymes in the cycle include citrate synthase, aconitase, isocitrate dehydrogenase, 
    α-ketoglutarate dehydrogenase, succinyl-CoA synthetase, succinate dehydrogenase, 
    fumarase, and malate dehydrogenase.
    """
    
    quiz = create_notes_quiz_endpoint(
        "sample_course_123", 
        1, 
        "The Krebs Cycle", 
        sample_notes
    )
    
    print(json.dumps(quiz, indent=2)) 