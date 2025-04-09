from flask import Flask, request, render_template, flash, redirect, url_for, jsonify
import os
from werkzeug.utils import secure_filename
#import for database
from dotenv import load_dotenv
from datetime import datetime
from pymongo import MongoClient
from urllib.parse import quote_plus
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Required for flashing messages

load_dotenv()  # Load variables from .env

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'doc', 'docx'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_mongo_client():
    try:
        mongo_uri = os.getenv("MONGO_URI")
        logger.debug(f"MongoDB URI: {mongo_uri.split('@')[0]}@...")  # Log URI without password
        
        if not mongo_uri:
            raise ValueError("MONGO_URI environment variable is not set")

        # Split the URI into parts
        scheme = "mongodb+srv://"
        rest = mongo_uri[len(scheme):]
        auth_part, host_part = rest.split('@', 1)
        
        # Get username and password
        username, password = auth_part.split(':', 1)
        
        # URL encode only the password
        encoded_password = quote_plus(password)
        
        # Reconstruct the URI
        encoded_uri = f"{scheme}{username}:{encoded_password}@{host_part}"
        
        logger.debug("Attempting to connect to MongoDB...")
        client = MongoClient(encoded_uri, serverSelectionTimeoutMS=5000)
        # Test the connection
        client.server_info()
        logger.debug("Successfully connected to MongoDB!")
        return client
    except Exception as e:
        logger.error(f"MongoDB connection failed: {str(e)}")
        raise

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        # Check if a file was uploaded
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        
        file = request.files['file']
        
        # If no file is selected
        if file.filename == '':
            flash('No file selected')
            return redirect(request.url)
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            flash('File successfully uploaded')
            return redirect(url_for('upload_file'))

    return render_template('index.html')


#database functions #

#adding stuff to the databa
@app.route('/add_question', methods=['POST'])
def add_question():
    try:
        logger.debug("Received request to add question")
        client = get_mongo_client()
        db = client["mydatabase"]
        collection = db["questions"]

        data = request.get_json()
        logger.debug(f"Received data: {data}")
        
        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        if not all(key in data for key in ("user", "question", "answer", "difficulty")):
            missing_fields = [key for key in ("user", "question", "answer", "difficulty") if key not in data]
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

        item = {
            "user": data["user"],
            "question": data["question"],
            "answer": data["answer"],
            "difficulty": data["difficulty"]
        }

        logger.debug(f"Attempting to insert item: {item}")
        result = collection.insert_one(item)
        logger.debug(f"Successfully inserted item with ID: {result.inserted_id}")
        
        return jsonify({"message": "Item added", "id": str(result.inserted_id)}), 201
    except ValueError as e:
        logger.error(f"Configuration error: {str(e)}")
        return jsonify({"error": f"Configuration error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e),
            "type": type(e).__name__
        }), 500

if __name__ == '__main__':
    app.run(debug=True)



