from flask import Flask, request, render_template
import sqlite3
import bcrypt
from email_validator import validate_email, EmailNotValidError


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

@app.route("/login", methods = ["GET", "POST"])
def login():
    if (request.method == "GET"):
        return render_template("login.html")
    elif (request.method == "POST"):
        # TODO
        pass

@app.route("/signup", methods = ["GET", "POST"])
def signup():
    if (request.method == "GET"):
        return render_template("signup.html")
    
    elif (request.method == "POST"):
        # Get request data from the form
        request_data = request.form
        email_address = request_data["email-address"].strip()
        password = request_data["password"].strip()

        if (not validateSignupData(email_address, password)):
            # Do something
            return {"error": "Invalid signup data"}, 400
        
        # Check if the email is valid and can receive messages
        try:
            email_info = validate_email(email_address, check_deliverability=True)
            email_address = email_info.normalized

        except EmailNotValidError as e:
            print(str(e))
            return {"error": "Invalid email address"}, 400


def validateSignupData(email_address, password):
    # Check that the password is an appropriate length
    if (len(password) < 8):
        return False
    
    # Check whether the inputs are empty
    if (email_address == "" or password == ""):
        return False
    
    return True

def initialise_database():
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    cur.execute("""CREATE TABLE IF NOT EXISTS User(
                UserID INTEGER PRIMARY KEY AUTOINCREMENT,
                Email TEXT, 
                PasswordHash TEXT           
                )""")
    
    cur.execute("""CREATE TABLE IF NOT EXISTS Session(
                SessionID INTEGER PRIMARY KEY AUTOINCREMENT,
                Token TEXT,
                UserID INTEGER,
                CreatedAt TEXT,
                ExpiresAt TEXT,
                Revoked INTEGER,
                FOREIGN KEY (UserID) REFERENCES User(UserID)
                )""")

    cur.execute("""CREATE TABLE IF NOT EXISTS Activity(
                ActivityID INTEGER PRIMARY KEY AUTOINCREMENT,
                Title TEXT,
                CategoryID INTEGER,
                StartTime INTEGER,
                EndTime INTEGER,
                Date TEXT,
                GoalID INTEGER,
                UserID INTEGER,
                FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID),
                FOREIGN KEY (GoalID) REFERENCES Goal(GoalID),
                FOREIGN KEY (UserID) REFERENCES User(UserID)
                )""")
    
    cur.execute("""CREATE TABLE IF NOT EXISTS Goal(
                GoalID INTEGER PRIMARY KEY AUTOINCREMENT,
                Title TEXT,
                Duration INTEGER,
                TimeDone INTEGER,
                Date TEXT,
                UserID INTEGER,
                FOREIGN KEY (UserID) REFERENCES User(UserID)
                )""")
    
    cur.execute("""CREATE TABLE IF NOT EXISTS Category(
                CategoryID INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT,
                Colour INTEGER
                )""")
    
    con.commit()
    con.close()

if (__name__ == "__main__"):
    #initialise_database()
    app.run(debug=True, host="0.0.0.0", port=5000)