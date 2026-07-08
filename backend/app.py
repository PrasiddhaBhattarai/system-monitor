from flask import Flask, jsonify, request, abort
from flask_cors import CORS
import psutil

app = Flask(__name__)
CORS(app)

API_KEY = "my-secret"

CORS(app, resources={
    r"/api/*": {
        "origins": "http://localhost:3000",
        "allow_headers": ["X-API-Key"]
    }
})

@app.before_request
def check_api():
    if request.headers.get("X-API-Key") != API_KEY:
        abort(403)


@app.route("/api/stats")
def stats():
    cpu_percent = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    return jsonify({
        "cpu": {
            "percent": cpu_percent,
            "cores": psutil.cpu_count(logical=True),
        },
        "memory": {
            "total": memory.total,
            "used": memory.used,
            "percent": memory.percent,
        },
        "disk": {
            "total": disk.total,
            "used": disk.used,
            "percent": disk.percent,
        },
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)
