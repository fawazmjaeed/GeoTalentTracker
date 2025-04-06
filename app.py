import os
import json
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)
DATA_FILE = 'static/uploads/data.json'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return jsonify(json.load(f))
    return jsonify([])

@app.route('/submit', methods=['POST'])
def submit():
    data = request.get_json()
    new_entry = {
        "lat": data["lat"],
        "lon": data["lon"],
        "job": data["job"],
        "exp": data["exp"],
        "url": data["url"]
    }

    existing = []
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            existing = json.load(f)

    existing.append(new_entry)
    with open(DATA_FILE, 'w') as f:
        json.dump(existing, f, indent=2)

    return jsonify(success=True)

if __name__ == '__main__':
    app.run(debug=True)
