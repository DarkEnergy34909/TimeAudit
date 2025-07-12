import os
from flask import Flask, request, render_template, make_response
import sqlite3
import bcrypt
from email_validator import validate_email, EmailNotValidError
import jwt
import time
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Secret key
# TODO: Move to .env file
SECRET_KEY = os.getenv("SECRET_KEY")

app = Flask(__name__)

@app.route('/', methods = ['GET', 'POST'])
def index():
    return render_template("index.html")

@app.route("/statistics", methods = ["GET", "POST"])
def statistics():
    return render_template("statistics.html")

@app.route("/calendar", methods = ["GET"])
def calendar():
    return render_template("calendar.html")
        
@app.route("/goals", methods = ["GET"])
def goals():
    return render_template("goals.html")


@app.route("/login", methods = ["GET", "POST"])
def login():
    if (request.method == "GET"):
        return render_template("login.html")
    elif (request.method == "POST"):
        # Error checking 
        try:
            # Get the form data
            request_data = request.form
            email_address = request_data["email-address"].strip()
            password = request_data["password"].strip()

            if (email_address == "" or password == ""):
                #return render_template("login.html", incorrect_login=False, login_error=True), 400
                return {"error": "empty_email_or_password"}, 400
            
            # Check if the user is in the database with the given email and password
            user_id = check_login(email_address, password)
            if (user_id != -1):
                # If the user exists, create a new JWT token
                token = create_jwt_token(user_id)

                # Create a HTTP response
                response = make_response({"token": token}, 200)

                # Set the response headers
                response.headers["Content-Type"] = "application/json"
                response.headers["Access-Control-Allow-Credentials"] = "true"
                
                response.set_cookie("token", token, domain="192.168.1.136", httponly=True, secure=False, samesite='Lax')

                # Use make_response here to use cookies
                return response
            
            else:
                #return render_template("login.html", incorrect_login=True, login_error=False), 401
                return {"error": "incorrect_email_or_password"}, 401

        except Exception as e:
            print(f"An error occurred during login: {str(e)}")
            #return render_template("login.html", incorrect_login=False, login_error=True), 500
            return {"error": "server_error"}, 500

@app.route("/signup", methods = ["GET", "POST"])
def signup():
    if (request.method == "GET"):
        return render_template("signup.html")
    
    elif (request.method == "POST"):
        # Error checking
        try:

            # Get request data from the form
            request_data = request.form
            email_address = request_data["email-address"].strip()
            password = request_data["password"].strip()

            if (not validateSignupData(email_address, password)):
                # Do something
                #return render_template("signup.html", email_exists_error=False, signup_error=True), 400
                return {"error": "invalid_email_or_password"}, 400
        
            # Check if the email is valid and can receive messages
            try:
                email_info = validate_email(email_address, check_deliverability=True)
                email_address = email_info.normalized

            except EmailNotValidError as e:
                print(str(e))
                #return render_template("signup.html", email_exists_error=False, signup_error=True), 400
                return {"error": "invalid_email"}, 400

            # Check for duplicate emails
            if (email_exists_in_database(email_address)):
                #return render_template("signup.html", email_exists_error=True, signup_error=False), 400
                return {"error": "duplicate_email"}, 400

            # TODO: Hash password
            hashed_password = hash_password(password)

            # Inser the user into the database and get their UserID
            user_id = insert_user(email_address, hashed_password)
            print("User signed up successfully")

            if (user_id == -1):
                print("An error occurred while signing up")
                return {"error": "server_error"}, 500
            else:
                # Create a new JWT token for the user
                token = create_jwt_token(user_id)

                # Make a HTTP response
                response = make_response({"token": token}, 200)

                # Set headers
                response.headers["Content-Type"] = "application/json"
                response.headers["Access-Control-Allow-Credentials"] = "true"

                # Add a cookie to the response
                response.set_cookie("token", token, domain="192.168.1.136", httponly=True, secure=False, samesite='Lax')

                return response
                #return {"token": token}, 200


        except Exception as e:
            print(f"An error occurred during signup: {str(e)}")
            #return render_template("signup.html", email_exists_error=False, signup_error=True), 500
            return {"error": "server_error"}, 500
        
@app.route("/api/auth", methods=["GET"])
def auth():
    authenticated = False
    if ("token" in request.cookies):
        token = request.cookies.get("token")
        authenticated = authenticate_user(token)
    return {"authenticated": authenticated}, 200

@app.route("/api/activities", methods=["GET", "POST"])
def activities_api():
    if (request.method == "GET"):
        # Frontend is retrieving activities from the server

        # Token should already have been authenticated client-side so no need to do error checking
        token = request.cookies.get("token")
        decoded_token = decode_jwt_token(token)
        if ("error" in decoded_token):
            return {"error": "invalid_token"}, 400
        else:
            # Get the user id
            user_id = decoded_token["user-id"]

            # Get all activities from the server from that user
            activities = get_activities_from_database(user_id)

            # Return the activities
            return activities
    elif (request.method == "POST"):
        # Frontend is posting activities from the server

        # List of activities posted to the server
        activities = request.get_json()

        # Get the token
        token = request.cookies.get("token")
        decoded_token = decode_jwt_token(token)

        if ("error" in decoded_token):
            return {"error": "authentication_failed"}, 400
        else:
            # Get the user id
            user_id = decoded_token["user-id"]

            # Add the activities to the database
            result = add_activities_to_database(activities, user_id)

            # Check if writing to database was successful
            if (result):
                return {"success": True}, 200
            else:
                return {"error": "activities_added_failed"}, 500
            
@app.route("/api/goals", methods=["GET", "POST"])
def goals_api():
    if (request.method == "GET"):
        # TODO
        pass
    elif (request.method == "POST"):
        # Frontend is posting goals to the server

    # List of goals posted to the server
        goals = request.get_json()

        # Get the token
        token = request.cookies.get("token")
        decoded_token = decode_jwt_token(token)

        if ("error" in decoded_token):
            return {"error": "authentication_failed"}, 400
        else:
            # Get the user id
            user_id = decoded_token["user-id"]

            # Add the activities to the database
            result = add_goals_to_database(goals, user_id)

            # Check if writing to database was successful
            if (result):
                return {"success": True}, 200
            else:
                return {"error": "goals_added_failed"}, 500


def authenticate_user(token):
    decoded_token = decode_jwt_token(token)
    if ("error" in token):
        return False
    else:
        return True


def create_jwt_token(user_id):
    # Get the current timestamp (in SECONDS)
    current_time = int(time.time())

    # Set the expiration time to 1 minute from now
    expiration_time = current_time + 60

    # Create a new JWT token
    token = jwt.encode({"user-id": user_id, "exp": expiration_time}, SECRET_KEY, algorithm="HS256")

    return token

def decode_jwt_token(token):
    try:
        # Decode JWT token
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        print("Token is valid")
        return decoded_token
    except jwt.ExpiredSignatureError:
        print("Token has expired")
        return {"error": "expired_token"}
    except jwt.InvalidTokenError:
        print("Invalid token")
        return {"error": "invalid_token"}
    
def add_goals_to_database(goals, user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()
    # Goals will be JSON (i.e. a dict of dicts)
    for goal in goals:
        # Add the goal information to the database
        goal_title = goal["title"]
        goal_duration = goal["duration"]
        goal_time_done = goal["timeDone"]
        goal_date = goal["date"]

        # Insert the goal into the database
        res = cur.execute("INSERT INTO Goal (Title, Duration, TimeDone, Date, UserID) VALUES (?, ?, ?, ?, ?);", (goal_title, goal_duration, goal_time_done, goal_date, user_id))
    con.commit()
    con.close()
    return True

def add_goal_to_database(goal, user_id):
    # Connect to the database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get goal data
    goal_title = goal["title"]
    goal_duration = goal["duration"]
    goal_time_done = goal["timeDone"]
    goal_date = goal["date"]

    # Insert the goal into the database
    res = cur.execute("INSERT INTO Goal (Title, Duration, TimeDone, Date, UserID) VALUES (?, ?, ?, ?, ?);", (goal_title, goal_duration, goal_time_done, goal_date, user_id))
    
    # Commit to database
    con.commit()
    con.close()

    return True

def get_activities_from_database(user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get all the activities associated with that user
    res = cur.execute("SELECT * FROM Activity WHERE UserID = ?;", (user_id,))

    activities = res.fetchall()
    if (len(activities == 0)):
        return None
    else:
        # Activities need to be returned as a list of dicts in order to be sent as JSON
        activity_dict_list = []
        for activity in activities:
            category_name = cur.execute("SELECT Name FROM Category WHERE CategoryID = ?;", (activity[2],)).fetchone()[0]
            goal_name = cur.execute("SELECT Title FROM Goal WHERE GoalID = ?", (activity[6],)).fetchone()[0]
            if (goalName == None):
                goalName = "None"
            new_activity = {"title": activity[1], "category": category_name, "startTime": activity[3], "endTime": activity[4], "date": activity[5], "goalName": goal_name}

            # Add to the list
            activity_dict_list.append(new_activity)
        
        return activity_dict_list


def add_activities_to_database(activities, user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Activities will be JSON (i.e. a dict of dicts)
    for activity in activities:
        activity_title = activity["title"]
        activity_category = activity["category"]
        activity_start_time = activity["startTime"]
        activity_end_time = activity["endTime"]
        activity_date = activity["date"]

        # Get the correct CategoryID from the category table
        res = cur.execute("SELECT CategoryID FROM Category WHERE Name = ?;", (activity_category,))
        one_item_tuple = res.fetchone()
        if one_item_tuple == None:
            print("Error: No such category exists")
            return False
        activity_category_id = one_item_tuple[0]

        # GoalID will be None (NULL) if there is no goal associated with the activity
        goal_id = None

        # First check the activity has an associated goal
        if ("goalName" in activity):
            # Get the goal name
            activity_goal_name = activity["goalName"]

            # Get the GoalID of the goal associated with that activity (if there is one)
            res = cur.execute("SELECT * FROM Goal WHERE Title = ? AND Date = ? AND UserID = ?", (activity_goal_name, activity_date, user_id))
            one_item_tuple = res.fetchone()
            if (one_item_tuple == None):
                print("Error: No such goal exists.")
                return False
            goal_id = one_item_tuple[0]

        res = cur.execute("INSERT INTO Activity (Title, CategoryID, StartTime, EndTime, Date, GoalID, UserID) VALUES (?, ?, ?, ?, ?, ?, ?)", (activity_title, activity_category_id, activity_start_time, activity_end_time, activity_date, goal_id, user_id))
    # Commit if no errors
    con.commit()
    con.close()
    return True

def add_activity_to_database(activity, user_id):
    # Connect to the database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get activity data
    activity_title = activity["title"]
    activity_category = activity["category"]
    activity_start_time = activity["startTime"]
    activity_end_time = activity["endTime"]
    activity_date = activity["date"]

    # Get the correct CategoryID from the category table
    res = cur.execute("SELECT CategoryID FROM Category WHERE Name = ?;", (activity_category,))
    one_item_tuple = res.fetchone()
    if one_item_tuple == None:
        print("Error: No such category exists.")
        return False
    activity_category_id = one_item_tuple[0]

    # GoalID will be None (NULL) if there is no goal associated with the activity
    goal_id = None
    activity_goal_name = activity["goalName"]

    if (activity_goal_name != "None"):
        # Get the GoalID of the goal associated with that activity (if there is one)
        res = cur.execute("SELECT * FROM Goal WHERE Title = ? AND Date = ? AND UserID = ?", (activity_goal_name, activity_date, user_id))
        one_item_tuple = res.fetchone()
        if (one_item_tuple == None):
            print("Error: No such goal exists.")
            return False
        goal_id = one_item_tuple[0]
    

    # Add the activity to the database
    res = cur.execute("INSERT INTO Activity (Title, CategoryID, StartTime, EndTime, Date, GoalID, UserID) VALUES (?, ?, ?, ?, ?, ?, ?)", (activity_title, activity_category_id, activity_start_time, activity_end_time, activity_date, goal_id, user_id))

    con.commit()
    con.close()
    return True


def validateSignupData(email_address, password):
    # Check that the password is an appropriate length
    if (len(password) < 8):
        return False
    
    # Check whether the inputs are empty
    if (email_address == "" or password == ""):
        return False
    
    return True

def hash_password(password):
    # Hash the password using bcrypt
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')

# Inserts a new user into the User table and returns the UserID
def insert_user(email_address, hashed_password):
    # Create a new User in the User table
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    cur.execute("INSERT INTO User (Email, PasswordHash) VALUES (?, ?)", (email_address, hashed_password))
    con.commit()

    # Get the UserID of the newly created user
    res = cur.execute("SELECT UserID FROM User WHERE Email = ?", (email_address,))
    user_id = res.fetchone()[0]

    con.close()

    return user_id

def insert_activity(title, category, start_time, end_time, date, goal_id, user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get the correct category for the activity

    res = cur.execute("SELECT CategoryID FROM Category WHERE Name = ?", category)
    con.commit()
    category_id = res.fetchone()

    if (category_id == None):
        print("An error occurred")
        return False
    
    # Add the activity to the database with the correct CategoryID

    res = cur.execute("INSERT INTO Activity (Title, CategoryID, StartTime, EndTime, Date, GoalID, UserID) VALUES (?, ?, ?, ?, ?, ?, ?);", (title, category_id, start_time, end_time, date, goal_id, user_id))
    con.commit()
    con.close()

    # TODO: Error checking
    return True 

# Returns the UserID of the user with a given email, and -1 otherwise
def check_login(email_address, password):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get the password hash from the user with the given email address
    res = cur.execute("SELECT * FROM User WHERE Email = ?", (email_address,))
    record = res.fetchone()
    con.commit()
    con.close()

    if (record == None):
        # User with the given email address does not exist
        print("User with the given email address does not exist")
        return -1
    
    # Check if the password matches the hashed password
    stored_password_hash = record[2]

    if (not bcrypt.checkpw(password.encode("utf-8"), stored_password_hash.encode("utf-8"))):
        # Passwords do not match
        print("Passwords do not match")
        return -1
    
    print("Login successful")
    # Return the UserID
    return record[0]
    
def email_exists_in_database(email_address):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    res = cur.execute("SELECT * FROM User WHERE Email = ?", (email_address,))
    record = res.fetchone()

    con.commit()
    con.close()

    if (record == None):
        # Email is not in the database
        return False
    else: 
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
                Colour TEXT
                )""")
    con.commit()
    con.close()

if (__name__ == "__main__"):
    #initialise_database()
    app.run(debug=True, host="0.0.0.0", port=5000)
    #app.run(debug=True, port=5000)