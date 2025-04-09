from google import genai
from dotenv import load_dotenv
import os
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=GOOGLE_API_KEY)

from google.genai import types

with open("./hist17.pdf", "rb") as file:
    doc_data = file.read()

prompt = (
        "You are an expert academic planner. Given the following semester syllabus, "
        "produce a JSON array where each element has: `date` (YYYY-MM-DD), "
        "has element `topic` and `info` which is detailed 2 sentence of what the topic is about and `assignment` due on that day if theres any"
        )

response = client.models.generate_content(
  model="gemini-2.0-flash",
  contents=[
      types.Part.from_bytes(
        data=doc_data,
        mime_type='application/pdf',
      ),
      prompt])
print(response.text)

filename = "summary.md"
with open(filename, "w", encoding="utf-8") as md_file:
    md_file.write(response.text)

print(f"Summary has been saved to {filename}")