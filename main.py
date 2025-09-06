import os
from flask import Flask, request, render_template, make_response, jsonify
from flask_limiter import Limiter
from openai import OpenAI
import sqlite3
import bcrypt
from email_validator import validate_email, EmailNotValidError
import jwt
import time
import datetime
from dotenv import load_dotenv
import json


# Load environment variables
load_dotenv()

# Secret key
# Get keys
SECRET_KEY = os.getenv("SECRET_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Constants
# Cookies expire in 48 hours
COOKIE_EXPIRY_TIME = int(172800)

# Connect to OpenAI API
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Define the flask app
app = Flask(__name__)

# Define the rate limiter
limiter = Limiter(app)

@app.route('/', methods = ['GET', 'POST'])
def index():
    return render_template("index.html")

@app.route("/privacy-policy", methods = ["GET"])
def privacy_policy():
    return render_template("privacy-policy.html")

@app.route("/terms-of-service", methods = ["GET"])
def terms_of_service():
    return render_template("terms.html")

@app.route("/robots.txt", methods= ["GET"])
def robots_txt():
    # Create a response object
    response = make_response("User-agent: *\nDisallow: /api/\nSitemap: https://timeaudit.net/sitemap.xml")

    # Set the content type to text/plain
    response.headers["Content-Type"] = "text/plain"
    
    return response

@app.route("/sitemap.xml", methods=["GET"])
def sitemap_xml():
    # Create a response object
    response = make_response(render_template("sitemap.xml"), 200)

    # Set the content type to application/xml
    response.headers["Content-Type"] = "application/xml"
    
    return response

@app.route("/audit", methods = ["GET", "POST"])
def audit():
    # Check if the user is authenticated
    if ("token" in request.cookies):
        # Get the token from HttpOnly cookie
        token = request.cookies["token"]

        # Decode the token
        decoded_token = decode_jwt_token(token)

        # If the token is valid
        if ("user-id" in decoded_token):
            # Get the user id from the token
            user_id = decoded_token["user-id"]

            # Get the user's email address from the database
            email_address = get_email_address_from_user_id(user_id)

            # Get the user's streak from the database
            streak = reset_streak_if_expired(user_id)

            if (email_address == None or streak == None):
                # TODO
                return {}
            else:
                # Format the streak
                streak = format_streak(streak)

                # Render template with email address
                return render_template("statistics.html", email_address=email_address, streak=streak)

    # If the user is not authenticated, render the statistics page without email address    
    return render_template("statistics.html")

@app.route("/calendar", methods = ["GET"])
def calendar():
    print(request.cookies)

    # Check if the user is authenticated
    if ("token" in request.cookies):
        # Get the token from HttpOnly cookie
        token = request.cookies["token"]

        # Decode the token
        decoded_token = decode_jwt_token(token)

        # If the token is valid
        if ("user-id" in decoded_token):
            # Get the user id from the token
            user_id = decoded_token["user-id"]

            # Get the user's email address from the database
            email_address = get_email_address_from_user_id(user_id)

            # Update the user's streak
            streak = reset_streak_if_expired(user_id)

            if (email_address == None or streak == None):
                # TODO
                return {}
            else:
                # Format the streak
                streak = format_streak(streak)

                # Render template with email address
                return render_template("calendar.html", email_address=email_address, streak=streak)

    print("NO TOKEN???")
    return render_template("calendar.html")
        
@app.route("/tasks", methods = ["GET"])
def tasks():
    # Check if the user is authenticated
    if ("token" in request.cookies):
        # Get the token from HttpOnly cookie
        token = request.cookies["token"]

        # Decode the token
        decoded_token = decode_jwt_token(token)

        # If the token is valid
        if ("user-id" in decoded_token):
            # Get the user id from the token
            user_id = decoded_token["user-id"]

            # Get the user's email address from the database
            email_address = get_email_address_from_user_id(user_id)

            # Get the user's streak from the database
            streak = reset_streak_if_expired(user_id)

            if (email_address == None or streak == None):
                # TODO
                return {}
            else:
                # Format the streak
                streak = format_streak(streak)

                # Render template with email address
                return render_template("goals.html", email_address=email_address, streak=streak)
    
    # If the user is not authenticated, render the goals page without email address
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
                
                response.set_cookie("token", token, domain="192.168.1.136", httponly=True, secure=False, samesite='Lax', expires=time.time() + COOKIE_EXPIRY_TIME)  # Cookie expires in 48 hours

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
                response.set_cookie("token", token, domain="192.168.1.136", httponly=True, secure=False, samesite='Lax', expires=time.time() + COOKIE_EXPIRY_TIME)

                return response
                #return {"token": token}, 200


        except Exception as e:
            print(f"An error occurred during signup: {str(e)}")
            #return render_template("signup.html", email_exists_error=False, signup_error=True), 500
            return {"error": "server_error"}, 500
        
@app.route("/api/auth", methods=["GET"])
def auth():
    authenticated = False
    expired = False
    if ("token" in request.cookies):
        token = request.cookies.get("token")
        authenticated = authenticate_user(token)
        print("lol")
        # Check if the token has expired
        if (not authenticated):
            decoded_token = decode_jwt_token(token)
            print("ERROR: " + decoded_token["error"])
            if decoded_token["error"] == "expired_token":
                expired = True

    return {"authenticated": authenticated, "expired": expired}, 200

@app.route("/api/activities", methods=["GET", "POST"])
def activities_api():
    if (request.method == "GET"):
        # Frontend is retrieving activities from the server

        # Token should already have been authenticated client-side so no need to do error checking
        token = request.cookies["token"]
        decoded_token = decode_jwt_token(token)
        if ("error" in decoded_token):
            return {"error": "invalid_token"}, 400
        else:
            # Get the user id
            user_id = decoded_token["user-id"]

            # Get all activities from the server from that user
            activities = get_activities_from_database_as_dicts(user_id)

            # Return the activities
            return jsonify(activities), 200
    elif (request.method == "POST"):
        # Frontend is posting activities from the server

        # List of activities posted to the server
        activities = request.get_json()
        print(activities)

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

            # Update the user's streak
            updated_streak = update_streak(user_id)

            # Get a formatted string (with emoji) for the streak
            formatted_streak = format_streak(updated_streak)

            # Check if writing to database was successful
            if (result):
                return {"success": True, "streak": formatted_streak}, 200
            else:
                return {"error": "activities_added_failed"}, 500
            
@app.route("/api/scheduled-activities", methods=["GET", "POST"])
def scheduled_activities_api():
    if (request.method == "GET"):
        # Frontend is retrieving scheduled activities from the server

        # Token should already have been authenticated client-side so no need to do error checking
        token = request.cookies["token"]
        decoded_token = decode_jwt_token(token)
        if ("error" in decoded_token):
            return {"error": "invalid_token"}, 400
        else:
            # Get the user id
            user_id = decoded_token["user-id"]

            # Get all scheduled activities from the server from that user
            scheduled_activities = get_scheduled_activities_from_database_as_dicts(user_id)

            # Return the scheduled activities
            return jsonify(scheduled_activities), 200
    elif (request.method == "POST"):
        # Frontend is posting scheduled activities from the server

        # List of scheduled activities posted to the server
        scheduled_activities = request.get_json()
        print(scheduled_activities)

        # Get the token
        token = request.cookies.get("token")
        decoded_token = decode_jwt_token(token)

        if ("error" in decoded_token):
            return {"error": "authentication_failed"}, 400
        else:
            # Get the user id
            user_id = decoded_token["user-id"]

            # Add the scheduled activities to the database
            result = add_scheduled_activities_to_database(scheduled_activities, user_id)

            # Check if writing to database was successful
            if (result):
                return {"success": True}, 200
            else:
                return {"error": "scheduled_activities_added_failed"}, 500
            
@app.route("/api/goals", methods=["GET", "POST"])
def goals_api():
    if (request.method == "GET"):
        # Get the token
        token = request.cookies["token"]
        decoded_token = decode_jwt_token(token)

        if ("error" in decoded_token):
            return {"error": "authentication_failed"}
        else:
            user_id = decoded_token["user-id"]

            # Get all goals from the database
            goals = get_goals_from_database_as_dicts(user_id)

            return jsonify(goals), 200

        pass
    elif (request.method == "POST"):
        # Frontend is posting goals to the server

        # List of goals posted to the server
        goals = request.get_json()

        # Get the token
        token = request.cookies.get("token")
        decoded_token = decode_jwt_token(token)

        # Check if the token is valid
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
            
@app.route("/api/goals/remove", methods=["POST"])
def remove_goal_api():
    # Get the goal
    goal = request.get_json()

    # Get the token
    token = request.cookies.get("token")
    decoded_token = decode_jwt_token(token)

    # Check if the token is valid
    if ("error" in decoded_token):
        return {"error": "authentication_failed"}, 400
    else:
        # Get the user id 
        user_id = decoded_token["user-id"]

        # Remove the goal from the database
        remove_goal_from_database(goal, user_id)

        return {"success": True}, 200
    
@app.route("/api/goals/update", methods=["POST"])
def update_goal_api():
    # Get the goal
    goal = request.get_json()

    # Get the token
    token = request.cookies.get("token")
    decoded_token = decode_jwt_token(token)

    # Check if the token is valid
    if ("error" in decoded_token):
        return {"error": "authentication_failed"}, 400
    else:
        # Get the user id 
        user_id = decoded_token["user-id"]

        # Update the goal in the database
        update_goal_in_database(goal, user_id)

        return {"success": True}, 200
            
@app.route("/api/activities/remove", methods=["POST"])
def remove_activity_api():
    # Get the activity
    activity = request.get_json()

    # Get the token
    token = request.cookies["token"]
    decoded_token = decode_jwt_token(token)#

    # Check if the token is valid
    if ("error" in decoded_token):
        return {"error": "authentication_failed"}, 400
    else:
        # Get the user id 
        user_id = decoded_token["user-id"]

        # Remove the activity from the database
        remove_activity_from_database(activity, user_id)

        # Reset the streak if applicable
        new_streak = reset_streak_if_expired(user_id)

        # Format the streak
        formatted_streak = format_streak(new_streak)

        return {"success": True, "streak": formatted_streak}, 200
    
@app.route("/api/scheduled-activities/remove", methods=["POST"])
def remove_scheduled_activity_api():
    # Get the scheduled activity
    scheduled_activity = request.get_json()

    # Get the token
    token = request.cookies["token"]
    decoded_token = decode_jwt_token(token)

    # Check if the token is valid
    if ("error" in decoded_token):
        return {"error": "authentication_failed"}, 400
    else:
        # Get the user id 
        user_id = decoded_token["user-id"]

        # Remove the scheduled activity from the database
        remove_scheduled_activity_from_database(scheduled_activity, user_id)

        return {"success": True}, 200
    

    
@app.route("/api/activities/sync", methods=["POST"])
def sync_activities_api():
    # Get activities from request
    activities = request.get_json()

    # Get the token
    token = request.cookies["token"]
    decoded_token = decode_jwt_token(token)

    # Check if token is valid
    if ("error" in decoded_token):
        return {"error": "authentication_failed"}, 400
    else:
        # Get the user id
        user_id = decoded_token["user-id"]

        # Sync activities with the database
        result = sync_activities_with_database(activities, user_id)

        if (result):
            return {"success": True}, 200
        else:
            return {"error": "activities_sync_failed"}, 500
        
@app.route("/api/activities/edit", methods=["POST"])
def update_activity_api():
    # Get the request data
    request_data = request.get_json()

    # Get the activity
    activity = json.loads(request_data["activity"])

    # Get the activity id
    activity_id = request_data["id"]

    # Get the token
    token = request.cookies["token"]
    decoded_token = decode_jwt_token(token)

    # Check if token is valid
    if ("error" in decoded_token):
        return {"error": "authentication_failed"}, 400
    else:
        # Get the user id
        user_id = decoded_token["user-id"]

        # Update the activity in the database
        result = update_activity_in_database(activity, activity_id, user_id)

        if (result):
            return {"success": True}, 200
        else:
            return {"error": "update_activity_failed"}, 500
        
@app.route("/api/activities/id", methods=["POST"])
def activity_id_api():
    # Get the activity
    activity = request.get_json()

    # Get the token
    token = request.cookies["token"]
    decoded_token = decode_jwt_token(token)

    # Check if token is valid
    if ("error" in decoded_token):
        return {"error": "authentication_failed"}, 400
    else:
        # Get the user id
        user_id = decoded_token["user-id"]

        # Get the activity id from the database
        activity_id = get_activity_id_from_database(activity, user_id)

        if (activity_id != -1):
            return {"success": True, "id": activity_id}, 200
        else:
            return {"error": "get_activity_id_failed"}, 500
        
@app.route("/api/scheduled-activities/sync", methods=["POST"])
def sync_scheduled_activities_api():
    # Get scheduled activities from request
    scheduled_activities = request.get_json()

    # Get the token
    token = request.cookies["token"]
    decoded_token = decode_jwt_token(token)

    # Check if token is valid
    if ("error" in decoded_token):
        return {"error": "authentication_failed"}, 400
    else:
        # Get the user id
        user_id = decoded_token["user-id"]

        # Sync scheduled activities with the database
        result = sync_scheduled_activities_with_database(scheduled_activities, user_id)

        if (result):
            return {"success": True}, 200
        else:
            return {"error": "scheduled_activities_sync_failed"}, 500

@app.route("/api/goals/sync", methods=["POST"])
def sync_goals_api():
    # Get goals from request
    goals = request.get_json()

    # Get the token
    token = request.cookies["token"]
    decoded_token = decode_jwt_token(token)

    # Check if token is valid
    if ("error" in decoded_token):
        return {"error": "authentication_failed"}, 400
    else:
        # Get the user id
        user_id = decoded_token["user-id"]

        # Sync goals with the database
        result = sync_goals_with_database(goals, user_id)

        if (result):
            return {"success": True}, 200
        else:
            return {"error": "goals_sync_failed"}, 500
        
@app.route("/api/activities/running", methods=["GET", "POST"])
def running_activity_api():
    if (request.method == "GET"):
        # Frontend is retrieving activity from the server

        # Token should already have been authenticated client-side so no need to do error checking
        token = request.cookies["token"]
        decoded_token = decode_jwt_token(token)
        if ("error" in decoded_token):
            return {"error": "invalid_token"}, 400
        else:
            # Get the user id
            user_id = decoded_token["user-id"]

            # Get the currently running activity
            activity = get_currently_running_activity(user_id)

            print(activity)

            # Return the activity
            if (activity == None):
                return {"no_activity": True}, 200
            else:
                return activity, 200
    if (request.method == "POST"):
        # Frontend is posting activities from the server

        # List of activities posted to the server
        activity = request.get_json()
        print(activity)

        # Get the token
        token = request.cookies.get("token")
        decoded_token = decode_jwt_token(token)

        if ("error" in decoded_token):
            return {"error": "authentication_failed"}, 400
        else:
            # Get the user id
            user_id = decoded_token["user-id"]

            # Add the activity to the database
            result = add_activity_to_database(activity, user_id, running=True)

            # Check if writing to database was successful
            if (result):
                return {"success": True}, 200
            else:
                return {"error": "activities_added_failed"}, 500
            
@app.route("/api/activities/running/stop", methods=["POST"])
def stop_running_activity_api():
    # Get the token
    token = request.cookies["token"]
    decoded_token = decode_jwt_token(token)

    if ("error" in decoded_token):
        return {"error": "invalid_token"}, 400

    # Get the user id
    user_id = decoded_token["user-id"]

    # Remove the currently running activity from the database
    result = remove_running_activity_from_database(user_id)
    if (result):
        return {"success": True}, 200
    else:
        return {"error": "failed_to_stop_running_activity"}, 500
    
@app.route("/api/logout", methods=["POST"])
def logout_api():
    # Get the token from the request
    token = request.cookies["token"]

    # Decode the token
    decoded_token = decode_jwt_token(token)

    if ("error" in decoded_token):
        return {"error": "invalid_token"}, 400

    # Reset the HttpOnly cookie
    response = make_response({"success": True}, 200)
    response.set_cookie("token", "", domain="192.168.1.136", expires=0, httponly=True, secure=False, samesite='Lax')
    return response

@app.route("/api/account/delete", methods=["POST"])
def delete_account_api():
    # Get the token from the request
    token = request.cookies["token"]

    # Decode the token
    decoded_token = decode_jwt_token(token)

    if ("error" in decoded_token):
        return {"error": "invalid_token"}, 400
    
    # Get the user id from the token
    user_id = decoded_token["user-id"]

    # Delete the user and all associated data from the database
    delete_account(user_id)

    # Reset the HttpOnly cookie
    response = make_response({"success": True}, 200)
    response.set_cookie("token", "", domain="192.168.1.136", expires=0, httponly=True, secure=False, samesite='Lax')
    return response

@app.route("/api/account/change-email", methods=["POST"])
def change_email_api():
    # Get the token from the request
    token = request.cookies["token"]

    # Decode the token
    decoded_token = decode_jwt_token(token)

    if ("error" in decoded_token):
        return {"error": "invalid_token"}, 400
    
    # Get the user id from the token
    user_id = decoded_token["user-id"]

    # Get the request body
    request_data = request.get_json()
    email_address = request_data["email-address"].strip()

    # If the email is invalid, return an error
    try:
        email_info = validate_email(email_address, check_deliverability=True)
        email_address = email_info.normalized
    except EmailNotValidError as e:
        print(str(e))
        print("Invalid email address")
        return {"error": "invalid_email"}, 400

    # If the email already exists, return an error
    if (email_exists_in_database(email_address)):
        print("Email exists")
        return {"error": "email_exists"}, 400

    # Update the email address
    update_email_address(user_id, email_address)

    print("LOL")
    return {"success": True}, 200

@app.route("/api/account/update-streak", methods=["POST"])
def update_streak_api():
    # Get the token from the request
    token = request.cookies["token"]

    # Decode the token
    decoded_token = decode_jwt_token(token)

    if ("error" in decoded_token):
        return {"error": "invalid_token"}, 400
    
    # Get the user id from the token
    user_id = decoded_token["user-id"]

    # Update the user's streak
    updated_streak = reset_streak_if_expired(user_id)

    # Format the streak
    formatted_streak = format_streak(updated_streak)

    # Send the updated streak to the frontend
    return {"success": True, "streak": formatted_streak}, 200

@app.route("/api/account/generate-schedule", methods=["POST"])
@limiter.limit("5 per hour")
def generate_schedule_api():
    # Get the token from the request
    token = request.cookies["token"]

    # Decode the token
    decoded_token = decode_jwt_token(token)

    if ("error" in decoded_token):
        return {"error": "invalid_token"}, 400

    # Get the user id from the token
    user_id = decoded_token["user-id"]

    # Get the date from the request
    request_data = request.get_json()
    date = request_data["date"]
    startTime = request_data["startTime"]
    endTime = request_data["endTime"]

    # Generate the user's schedule
    schedule = generate_user_schedule(user_id, date, startTime, endTime) 
    #schedule = '[{"title": "Maths revision", "category": "Work/Study", "startTime": 510, "endTime": 600, "date": "2025-08-01"}]'  # Placeholder for testing

    return {"success": True, "schedule": schedule}, 200

def get_categories():
    categories = []

    # Connect to the database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get all categories
    res = cur.execute("SELECT Name FROM Category;")

    for category in res.fetchall():
        categories.append(category[0])

    return categories


def generate_user_schedule(user_id, date, startTime, endTime): 
    # Get scheduled activities from the database
    scheduled_activities = get_scheduled_activities_from_database_as_dicts(user_id)
    #print(scheduled_activities)

    # Get activities from the database
    activities = get_activities_from_database_as_dicts(user_id)

    # Narrow down activities to just those in the past 2 weeks
    iso_two_weeks_ago = get_iso_date_from__datetime(datetime.datetime.now() - datetime.timedelta(weeks=2))

    # Didn't know you could do this lol
    activities = [activity for activity in activities if activity["date"] >= iso_two_weeks_ago]
    scheduled_activities = [activity for activity in scheduled_activities if activity["date"] >= iso_two_weeks_ago]


    # Get goals from the database
    goals = get_todays_goals_from_database_as_dicts(user_id)
    #print(goals)

    # Get categories from the database
    categories = get_categories()

    # The initial context prompt for the AI
    context_prompt = """
    You are a helpful assistant that creates daily schedules for users based on their goals, past logged activities, and scheduled plans. 
    Generate a schedule for the user on the given date which:
    1. Covers all their goals (e.g. 2hrs revision) (for goals, date is the deadline (inclusive), if dateCompleted is not empty, the goal is already done and should NOT be included in the schedule)
    2. Does not conflict with any activities already scheduled (scheduled_activities) on this date (if an activity is already scheduled, it should NOT be included in the schedule)
    3. Fits in time limits given (in minutes since midnight)
    4. Includes short breaks between activities if possible
    5. Includes activities not in their goals if they are relevant to the user's interests or past activities
    Your output should be a JSON array of activities in the following format:
    { 'title': 'Maths revision', 'category': 'Work/Study', 'startTime': 510, 'endTime': 600, 'date': '2025-08-01' }
    where the 'category' attribute can only be a string from the categories array below, and the 'startTime' and 'endTime' are the times in minutes since midnight on that day.
    DO NOT include any explanatory text, just return the JSON array. DO NOT WRAP THE JSON ARRAY IN ANY OTHER TEXT OR MARKUP.
    """

    prompt_content = json.dumps({
        "date": date,
        "startTime": startTime,
        "endTime": endTime,
        "categories": categories,
        "activities": activities,
        "scheduled_activities": scheduled_activities,
        "goals": goals
    })

    # Create the full prompt 
    prompt = [
        {
            "role": "system",
            "content": context_prompt
        },
        {
            "role": "user",
            "content": prompt_content
        }
    ]

    # Call OpenAI API
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=prompt,
        temperature=0.5,
        top_p=1.0,
        n=1,
        #response_format={"type": "json_array"}
    )

    # Get the generated schedule from the response
    if (response.choices and len(response.choices) > 0):
        return response.choices[0].message.content
    else:
        return []


def format_streak(streak):
    if (streak == 0):
        return "❄️" + str(streak)
    else:
        return "🔥" + str(streak)

def get_current_iso_date():
    return datetime.datetime.now().isoformat().split("T")[0]

def get_yesterdays_iso_date():
    yesterdays_date = datetime.datetime.now() - datetime.timedelta(1)
    return yesterdays_date.isoformat().split("T")[0]

def get_iso_date_from__datetime(dt):
    return dt.isoformat().split("T")[0]


def get_streak(user_id):
    # Connect to the database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    res = cur.execute("SELECT Streak FROM User WHERE UserID = ?;", (user_id,))
    streak_tuple = res.fetchone()

    if (streak_tuple == None):
        return None
    else:
        return streak_tuple[0]
    
def update_streak(user_id):

    # Connect to the database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get the current date
    current_date = get_current_iso_date()

    # Get the user's current streak
    current_streak = get_streak(user_id)

    # First check if the user hasn't already had the streak updated
    res = cur.execute("SELECT * FROM User JOIN Activity ON User.UserID = Activity.UserID WHERE User.UserID = ? AND Date = ?;", (user_id, current_date))
    if (len(res.fetchall()) >= 2 and current_streak != 0):
        # Streak has already been updated, so do nothing
        return current_streak

    # Get the user's new streak
    new_streak = current_streak + 1

    # Update the database
    res = cur.execute("UPDATE User SET Streak = ? WHERE UserID = ?;", (new_streak, user_id))

    # Close the database
    con.commit()
    con.close()

    # Return the new streak
    return new_streak

# On loading the web app, reset the streak if they didn't do anything on the previous day
def reset_streak_if_expired(user_id):
    # Connect to the database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get yesterday's date and today's date in ISO format
    yesterdays_date = get_yesterdays_iso_date()
    todays_date = get_current_iso_date()

    # Check if the user has any activities with yesterday's date
    res = cur.execute("SELECT * FROM Activity WHERE UserID = ? AND Date = ?;", (user_id, yesterdays_date))

    # Get the records from the query
    records = res.fetchall()
    no_activities_on_previous_day = len(records) == 0

    # Check if the user has any activities with today's date
    res = cur.execute("SELECT * FROM Activity WHERE UserID = ? AND Date = ?;", (user_id, todays_date))

    # Get the records from the query
    records = res.fetchall()
    no_activities_on_current_day = len(records) == 0

    if (no_activities_on_previous_day and no_activities_on_current_day):
        # User recorded no activities yesterday so remove their streak
        res = cur.execute("UPDATE User SET Streak = 0 WHERE UserID = ?;", (user_id,))
        print("Streak reset")

    # Write changes
    con.commit()
    con.close()

    # Return the streak
    return get_streak(user_id)


def get_email_address_from_user_id(user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get email address from the User table
    res = cur.execute("SELECT Email FROM User WHERE UserID = ?", (user_id,))
    con.commit()

    email_tuple = res.fetchone()
    if (email_tuple == None):
        return None
    else:
        return email_tuple[0]

def authenticate_user(token):
    decoded_token = decode_jwt_token(token)
    if ("error" in decoded_token):
        return False
    else:
        return True
    
def delete_account(user_id):
    # Connect to the database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Delete all activities associated with the user
    cur.execute("DELETE FROM Activity WHERE UserID = ?", (user_id,))

    # Delete all scheduled activities associated with the user
    cur.execute("DELETE FROM ScheduledActivity WHERE UserID = ?", (user_id,))

    # Delete all goals associated with the user
    cur.execute("DELETE FROM Goal WHERE UserID = ?", (user_id,))

    # Delete the user from the User table
    cur.execute("DELETE FROM User WHERE UserID = ?", (user_id,))

    # Write changes to the database
    con.commit()
    con.close()

def update_email_address(user_id, new_email_address):
    # Connect to the database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Update the email address in the User table
    cur.execute("UPDATE User SET Email = ? WHERE UserID = ?", (new_email_address, user_id))

    # Write changes to the database
    con.commit()
    con.close()


def create_jwt_token(user_id):
    # Get the current timestamp (in SECONDS)
    current_time = int(time.time())

    # Set the expiration time to 48 hours from now
    expiration_time = current_time + COOKIE_EXPIRY_TIME

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
        goal_date_completed = goal["dateCompleted"]

        # Insert the goal into the database
        res = cur.execute("INSERT INTO Goal (Title, Duration, TimeDone, Date, UserID, DateCompleted) VALUES (?, ?, ?, ?, ?, ?);", (goal_title, goal_duration, goal_time_done, goal_date, user_id, goal_date_completed))
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
    goal_date_completed = goal["dateCompleted"]

    # Insert the goal into the database
    res = cur.execute("INSERT INTO Goal (Title, Duration, TimeDone, Date, UserID, DateCompleted) VALUES (?, ?, ?, ?, ?, ?);", (goal_title, goal_duration, goal_time_done, goal_date, user_id, goal_date_completed))

    # Commit to database
    con.commit()
    con.close()

    return True

def update_goal_in_database(goal, user_id):
    # Connect to the database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Update the goal in the database
    res = cur.execute("UPDATE Goal SET TimeDone = ?, DateCompleted = ? WHERE Title = ? AND Duration = ? AND Date = ? AND UserID = ?;", (goal["timeDone"], goal["dateCompleted"], goal["title"], goal["duration"], goal["date"], user_id))

    # Commit to database
    con.commit()
    con.close()

    return True

def remove_goal_from_database(goal, user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Remove the goal from the database
    res = cur.execute("DELETE FROM Goal WHERE Title = ? AND Duration = ? AND TimeDone = ? AND Date = ? AND UserID = ?", (goal["title"], goal["duration"], goal["timeDone"], goal["date"], user_id))
    
    # Commit to database
    con.commit()
    con.close()

    return True

def sync_activities_with_database(activities, user_id):
    database_activities = get_activities_from_database_as_tuples(user_id)

    for activity in activities:
        # Check if the activity already exists in the database
        exists = False

        for database_activity in database_activities:
            if activity["title"] == database_activity[1] and activity["startTime"] == database_activity[3] and activity["endTime"] == database_activity[4] and activity["date"] == database_activity[5] and user_id == database_activity[7]:
                exists = True
                break
        
        if (not exists):
            print(f"Activity {activity['title']} does not exist in the database, adding it now.")

            # Add the activity to the database
            add_activity_to_database(activity, user_id)
    
    return True

def sync_scheduled_activities_with_database(scheduled_activities, user_id):
    database_scheduled_activities = get_scheduled_activities_from_database_as_tuples(user_id)

    for scheduled_activity in scheduled_activities:
        # Check if the scheduled activity already exists in the database
        exists = False

        for database_scheduled_activity in database_scheduled_activities:
            if scheduled_activity["title"] == database_scheduled_activity[1] and scheduled_activity["startTime"] == database_scheduled_activity[3] and scheduled_activity["endTime"] == database_scheduled_activity[4] and scheduled_activity["date"] == database_scheduled_activity[5] and user_id == database_scheduled_activity[6]:
                exists = True
                break

        if (not exists):
            print(f"Scheduled Activity {scheduled_activity['title']} does not exist in the database, adding it now.")

            # Add the scheduled activity to the database
            add_scheduled_activity_to_database(scheduled_activity, user_id)

    return True

def sync_goals_with_database(goals, user_id):
    database_goals = get_goals_from_database_as_tuples(user_id)

    for goal in goals:
        # Check if the goal already exists in the database
        exists = False

        for database_goal in database_goals:
            if goal["title"] == database_goal[1] and goal["duration"] == database_goal[2] and goal["timeDone"] == database_goal[3] and goal["date"] == database_goal[4] and user_id == database_goal[5]:
                exists = True
                break
        
        if (not exists):
            print(f"Goal {goal['title']} does not exist in the database, adding it now.")

            # Add the goal to the database
            add_goal_to_database(goal, user_id)

    return True

def get_goals_from_database_as_tuples(user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get all the goals associated with that user
    res = cur.execute("SELECT * FROM Goal WHERE UserID = ? ORDER BY DateCompleted, Date;", (user_id,))
    goals = res.fetchall()
    con.commit()
    con.close()
    if (len(goals) == 0):
        return []
    else:
        return goals
    
def get_goals_from_database_as_dicts(user_id):
    dict_list = []

    goal_tuples = get_goals_from_database_as_tuples(user_id)

    for goal in goal_tuples:
        goal_dict = {"title": goal[1], "duration": goal[2], "timeDone": goal[3], "date": goal[4], "dateCompleted": goal[6]}

        dict_list.append(goal_dict)

    return dict_list

def get_todays_goals_from_database_as_dicts(user_id):
    goals = get_goals_from_database_as_dicts(user_id)
    todays_date = get_current_iso_date()

    todays_goals = []
    for goal in goals:
        if (goal["date"] == todays_date):
            todays_goals.append(goal)

    return todays_goals



def remove_activity_from_database(activity, user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Remove the activity from the database
    res = cur.execute("DELETE FROM Activity WHERE Title = ? AND StartTime = ? AND EndTime = ? AND Date = ? AND UserID = ?;", (activity["title"], activity["startTime"], activity["endTime"], activity["date"], user_id))
    
    # Commit to database
    con.commit()
    con.close()

    return True

def remove_scheduled_activity_from_database(scheduled_activity, user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Remove the scheduled activity from the database
    res = cur.execute("DELETE FROM ScheduledActivity WHERE Title = ? AND StartTime = ? AND EndTime = ? AND Date = ? AND UserID = ?;", (scheduled_activity["title"], scheduled_activity["startTime"], scheduled_activity["endTime"], scheduled_activity["date"], user_id))
    print("DELETED SCHEDULED ACTIVITY: ", scheduled_activity["title"], scheduled_activity["startTime"], scheduled_activity["endTime"], scheduled_activity["date"], user_id)

    # Commit to database
    con.commit()
    con.close()

    return True

def remove_running_activity_from_database(user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Remove the currently running activity from the database
    res = cur.execute("DELETE FROM Activity WHERE UserID = ? AND Running = 1;", (user_id,))
    
    # Commit to database
    con.commit()
    con.close()

    return True

def update_activity_in_database(activity, activity_id, user_id):
    # Connect to the database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get the category id from the category
    res = cur.execute("SELECT CategoryID FROM Category WHERE Name = ?", (activity["category"],))
    category_id = res.fetchone()[0]
    con.commit()

    # Get the goal id from the goal
    goal_id = None
    if ("goalName" in activity and activity["goalName"] != "None"):
        res = cur.execute("SELECT GoalID FROM Goal WHERE Title = ?", (activity["goalName"],))
        goal_id = res.fetchone()[0]
        con.commit()

    # Update the activity in the database
    res = cur.execute("UPDATE Activity SET Title = ?, CategoryID = ?, StartTime = ?, EndTime = ?, Date = ?, GoalID = ? WHERE ActivityID = ? AND UserID = ?", (activity["title"], category_id, activity["startTime"], activity["endTime"], activity["date"], goal_id, activity_id, user_id))
    con.commit()

    # Get number of changed rows
    changed_rows = cur.rowcount

    if (changed_rows == 1):
        return True
    else:
        return False
    
def get_activity_id_from_database(activity, user_id):
    # Connect to database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get the activity id from the database
    res = cur.execute("SELECT ActivityID FROM Activity WHERE Title = ? AND StartTime = ? AND EndTime = ? AND Date = ? AND UserID = ?", (activity["title"], activity["startTime"], activity["endTime"], activity["date"], user_id))
    activity_id_tuple = res.fetchone()

    if (activity_id_tuple == None):
        return -1
    else:
        return activity_id_tuple[0]


def get_currently_running_activity(user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get the currently running activity
    res = cur.execute("SELECT * FROM Activity WHERE UserID = ? AND Running = 1;", (user_id,))
    activity = res.fetchone()
    
    con.commit()

    if (activity == None):
        con.close()
        return None
    else:
        # Get the category name
        category_name = cur.execute("SELECT Name FROM Category WHERE CategoryID = ?;", (activity[2],)).fetchone()[0]
        
        # Get the goal name
        goal_name_tuple = cur.execute("SELECT Title FROM Goal WHERE GoalID = ?", (activity[6],)).fetchone()
        if (goal_name_tuple == None):
            goal_name = "None"
        else:
            goal_name = goal_name_tuple[0]

        con.close()

        # Create a dict of the activity
        activity_dict = {"title": activity[1], "category": category_name, "startTime": activity[3], "endTime": activity[4], "date": activity[5], "goalName": goal_name}

        return activity_dict

def get_activities_from_database_as_dicts(user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get all the activities associated with that user
    res = cur.execute("SELECT * FROM Activity WHERE UserID = ? AND Running = 0;", (user_id,))

    activities = res.fetchall()
    if (len(activities) == 0):
        return []
    else:
        # Activities need to be returned as a list of dicts in order to be sent as JSON
        activity_dict_list = []
        for activity in activities:
            category_name = cur.execute("SELECT Name FROM Category WHERE CategoryID = ?;", (activity[2],)).fetchone()[0]
            goal_name_tuple = cur.execute("SELECT Title FROM Goal WHERE GoalID = ?", (activity[6],)).fetchone()
            if (goal_name_tuple == None):
                goal_name = "None"
                # Set the ID to none (cleanup)
                cur.execute("UPDATE Activity SET GoalID = NULL WHERE ActivityID = ?;", (activity[0],))
            else:
                goal_name = goal_name_tuple[0]

            new_activity = {"title": activity[1], "category": category_name, "startTime": activity[3], "endTime": activity[4], "date": activity[5], "goalName": goal_name}

            # Add to the list
            activity_dict_list.append(new_activity)

        con.commit()
        con.close()

        
        return activity_dict_list

def get_activities_from_database_as_tuples(user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get all the activities associated with that user
    res = cur.execute("SELECT * FROM Activity WHERE UserID = ? AND Running = 0;", (user_id,))

    activities = res.fetchall()
    con.commit()
    con.close()

    if (len(activities) == 0):
        return []
    else:
        return activities
    
def get_scheduled_activities_from_database_as_dicts(user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get all the scheduled activities associated with that user
    res = cur.execute("SELECT * FROM ScheduledActivity WHERE UserID = ?;", (user_id,))

    scheduled_activities = res.fetchall()
    if (len(scheduled_activities) == 0):
        return []
    else:
        # Scheduled activities need to be returned as a list of dicts in order to be sent as JSON
        scheduled_activity_dict_list = []
        for activity in scheduled_activities:
            # Get the category name
            category_name = cur.execute("SELECT Name FROM Category WHERE CategoryID = ?;", (activity[2],)).fetchone()[0]

            new_activity = {"title": activity[1], "category": category_name, "startTime": activity[3], "endTime": activity[4], "date": activity[5]}

            # Add to the list
            scheduled_activity_dict_list.append(new_activity)

        con.commit()
        con.close()

        return scheduled_activity_dict_list
    
def get_scheduled_activities_from_database_as_tuples(user_id):
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get all the scheduled activities associated with that user
    res = cur.execute("SELECT * FROM ScheduledActivity WHERE UserID = ?;", (user_id,))

    scheduled_activities = res.fetchall()
    con.commit()
    con.close()

    if (len(scheduled_activities) == 0):
        return []
    else:
        return scheduled_activities


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

        print(f"Adding activity: {activity_title}, {activity_category}, {activity_start_time}, {activity_end_time}, {activity_date}")



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
        if ("goalName" in activity and activity["goalName"] != "None"):
            # Get the goal name
            activity_goal_name = activity["goalName"]
            print(f"Activity goal name: {activity_goal_name}")

            # Get the GoalID of the goal associated with that activity (if there is one)
            res = cur.execute("SELECT * FROM Goal WHERE Title = ? AND DateCompleted = ? AND UserID = ? ORDER BY Date DESC", (activity_goal_name, "", user_id))
            one_item_tuple = res.fetchone()
            if (one_item_tuple == None):
                # Get a completed goal instead
                res = cur.execute("SELECT * FROM Goal WHERE Title = ? AND UserID = ? ORDER BY Date DESC", (activity_goal_name, user_id))
                one_item_tuple = res.fetchone()
                if (one_item_tuple == None):
                    print("Error: No such goal exists.")
                    return False
            goal_id = one_item_tuple[0]

        # Insert activity into db
        res = cur.execute("INSERT INTO Activity (Title, CategoryID, StartTime, EndTime, Date, GoalID, UserID, Running) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (activity_title, activity_category_id, activity_start_time, activity_end_time, activity_date, goal_id, user_id, False))
    # Commit if no errors
    con.commit()
    con.close()
    return True

def add_scheduled_activities_to_database(scheduled_activities, user_id):
    # Connect to the database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Scheduled activities will be JSON (i.e. a dict of dicts)
    for activity in scheduled_activities:
        activity_title = activity["title"]
        activity_category = activity["category"]
        activity_start_time = activity["startTime"]
        activity_end_time = activity["endTime"]
        activity_date = activity["date"]

        print(f"Adding scheduled activity: {activity_title}, {activity_category}, {activity_start_time}, {activity_end_time}, {activity_date}")

        # Get the correct CategoryID from the category table
        res = cur.execute("SELECT CategoryID FROM Category WHERE Name = ?;", (activity_category,))
        one_item_tuple = res.fetchone()
        if one_item_tuple == None:
            print("Error: No such category exists")
            return False
        activity_category_id = one_item_tuple[0]

        # Insert the scheduled activity into the database
        res = cur.execute("INSERT INTO ScheduledActivity (Title, CategoryID, StartTime, EndTime, Date, UserID) VALUES (?, ?, ?, ?, ?, ?)", (activity_title, activity_category_id, activity_start_time, activity_end_time, activity_date, user_id))

    con.commit()
    con.close()
    return True

def add_activity_to_database(activity, user_id, running=False):
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
    activity_goal_name = "None"
    if ("goalName" in activity):
        # Get the goal name
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
    res = cur.execute("INSERT INTO Activity (Title, CategoryID, StartTime, EndTime, Date, GoalID, UserID, Running) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (activity_title, activity_category_id, activity_start_time, activity_end_time, activity_date, goal_id, user_id, running))

    con.commit()
    con.close()
    return True

def add_scheduled_activity_to_database(scheduled_activity, user_id):
    # Connect to the database
    con = sqlite3.connect("timeaudit.db")
    cur = con.cursor()

    # Get scheduled activity data
    activity_title = scheduled_activity["title"]
    activity_category = scheduled_activity["category"]
    activity_start_time = scheduled_activity["startTime"]
    activity_end_time = scheduled_activity["endTime"]
    activity_date = scheduled_activity["date"]

    # Get the correct CategoryID from the category table
    res = cur.execute("SELECT CategoryID FROM Category WHERE Name = ?;", (activity_category,))
    one_item_tuple = res.fetchone()
    if one_item_tuple == None:
        print("Error: No such category exists.")
        return False
    activity_category_id = one_item_tuple[0]

    # Add the scheduled activity to the database
    res = cur.execute("INSERT INTO ScheduledActivity (Title, CategoryID, StartTime, EndTime, Date, UserID) VALUES (?, ?, ?, ?, ?, ?)", (activity_title, activity_category_id, activity_start_time, activity_end_time, activity_date, user_id))

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

    cur.execute("INSERT INTO User (Email, PasswordHash, Streak) VALUES (?, ?, ?)", (email_address, hashed_password, 0))
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

    res = cur.execute("INSERT INTO Activity (Title, CategoryID, StartTime, EndTime, Date, GoalID, UserID, Running) VALUES (?, ?, ?, ?, ?, ?, ?, ?);", (title, category_id, start_time, end_time, date, goal_id, user_id, False))
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
                PasswordHash TEXT,
                Streak INTEGER        
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
                Running INTEGER,
                FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID),
                FOREIGN KEY (GoalID) REFERENCES Goal(GoalID),
                FOREIGN KEY (UserID) REFERENCES User(UserID)
                )""")
    
    cur.execute("""CREATE TABLE IF NOT EXISTS ScheduledActivity(
                ScheduledActivityID INTEGER PRIMARY KEY AUTOINCREMENT,
                Title TEXT,
                CategoryID INTEGER,
                StartTime INTEGER,
                EndTime INTEGER,
                Date TEXT,
                UserID INTEGER,
                FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID),
                FOREIGN KEY (UserID) REFERENCES User(UserID)
                )""")

    cur.execute("""CREATE TABLE IF NOT EXISTS Goal(
                GoalID INTEGER PRIMARY KEY AUTOINCREMENT,
                Title TEXT,
                Duration INTEGER,
                TimeDone INTEGER,
                Date TEXT,
                DateCompleted TEXT,
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
    #print(generate_user_schedule(16, "2025-08-01"))
    app.run(debug=True, host="0.0.0.0", port=5000)
    #app.run(debug=True, port=5000)