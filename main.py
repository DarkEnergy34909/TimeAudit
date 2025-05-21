from flask import Flask, request, render_template

app = Flask(__name__)

@app.route('/', methods = ['GET', 'POST'])
def index():
    return render_template("index.html")

@app.route("/statistics", methods = ["GET", "POST"])
def statistics():
    return render_template("statistics.html")

@app.route("/calendar", methods = ["GET", "POST"])
def calendar():
    return render_template("calendar.html")

@app.route("/goals", methods = ["GET", "POST"])
def goals():
    return render_template("goals.html")

if (__name__ == "__main__"):
    app.run(debug=True, host="0.0.0.0", port=5000)