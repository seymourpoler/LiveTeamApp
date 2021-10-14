import os
import sys
import simplejson
from flask import Flask, render_template, redirect, url_for, request, make_response
from flask.ext.sqlalchemy import SQLAlchemy
from threading import Thread, Lock
import pylibmc
import datetime

#///////////// CONFIG ////////////////////////////////////
APP_CONTEXT = { 'APP_NAME': 'LiveTeamApp', \
                'version': ".",
                'apphost': "www.liveteamapp.com"
              }
UI_TEXT = {'TASKS_MONITOR_TITLE' : "Current Task"}

def template_vars():
  return dict(APP_CONTEXT.items() + UI_TEXT.items())

# Connect to memcache with config from environment variables.
memcache = None
if os.environ.get('MEMCACHE_SERVERS') is None:
  memcache = pylibmc.Client(servers=['127.0.0.1'])
else:
  memcache = pylibmc.Client(
  servers=[os.environ.get('MEMCACHE_SERVERS')],
  username=os.environ.get('MEMCACHE_USERNAME'),
  password=os.environ.get('MEMCACHE_PASSWORD'),
  binary=True
)


app = Flask(__name__)

# to run locally do not forget this:
# export DATABASE_URL=postgres://username:pwd@localhost/databasename
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')

if not os.environ.get('PROD'):
    app.config['SQLALCHEMY_ECHO'] = True
    app.debug = True

db = SQLAlchemy(app)

#///////////// MODELS /////////////////////////////
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=False)
    team = db.Column(db.String(80), unique=False)
    sessionId = db.Column(db.String(200), unique=False)
    serializedData = db.Column(db.Text())

    def __init__(self, username):
        self.username = username

    def __repr__(self):
        return '<User %r>' % self.username

class Stats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=False)
    team = db.Column(db.String(80), unique=False)
    lastAccess = db.Column(db.String(80), unique=False)
    moreInfo = db.Column(db.String(200), unique=False)
    
    def __repr__(self):
        return '<User %r>' % self.username        

#////////////// CONTROLLER ///////////////////////////

def sanitized_team(team):
    return sanitized_username(team)

def sanitized_username(username):
    return username.strip().lower().replace('%', '');

def full_username(team, username):
    return sanitized_team(team) + '_' + sanitized_username(username)

def user_by_name(team, username):
    return User.query.filter_by(username= full_username(team, username)).first()

def team_exists(team):
    return User.query.filter_by(team= sanitized_team(team)).first() is not None

def stats_by_name(team, username):
    return Stats.query.filter_by(username= full_username(team, username)).first()

def try_to_register_user(team, username):
    try:
       user = user_by_name(team, username)
       if (user is None):
          user = User(full_username(team, username))
          user.team = sanitized_team(team)
          db.session.add(user)
          db.session.commit()
    except:
        print "Unexpected error:", sys.exc_info()

def try_to_register_stats(team, username, remote_addr):
  try:
      stats = Stats()
      stats.username = full_username(team, username)
      stats.team = sanitized_team(team)
      stats.lastAccess = datetime.datetime.now().isoformat()
      stats.moreInfo = remote_addr
      db.session.add(stats)
      db.session.commit()
  except:
      print "Unexpected error:", sys.exc_info() 

@app.route("/")
def landing_page():
    return render_template("landing.html", 
      **template_vars())

@app.route("/faq")
def faq():
    try_to_register_stats("FAQ", "FAQ", request.remote_addr)      
    return render_template("faq.html", 
      **template_vars())    

@app.route("/goPremium")
def premium():
    try_to_register_stats("PREMIUM", "PREMIUM", request.remote_addr)    
    return render_template("goPremium.html", 
      **template_vars())        

@app.route("/<team>/<username>")
def index(team, username):
    isCreatingTeam = False
    if not team_exists(team):
       isCreatingTeam = True
    try_to_register_user(team, username)
    try_to_register_stats(team, username, request.remote_addr)
    return render_template("index.html", 
      team=sanitized_team(team), 
      username=sanitized_username(username), 
      isCreatingTeam=isCreatingTeam,
      **template_vars())


activityId = "id"
key_prefix = "tact" # team_activity
memcache_backup = {}

@app.route("/clear_team_activities/<team>/<passwd>")
def clear_memory(team, passwd):
    team = sanitized_team(team)
    team_k = team_key(team)
    if (passwd == '123123'):
      try:
        if (team == 'all_teams'):
            memcache_backup.clear()
            memcache.flush_all()
            return "Clean all OK!"
        if memcache_backup.has_key(team_k):
           memcache_backup[team_k] = None
        memcache.delete(team_key(team))
      except pylibmc.Error, e:
        print e
    return "Cleam team OK!"


def team_key(team):
  team = sanitized_team(team)
  return "_".join([key_prefix, team]).encode('utf-8')


def get_team_activity(team):
  team = sanitized_team(team)
  team_k = team_key(team)
  team_activity = None
  try:
      team_activity = memcache.get(team_k)
  except pylibmc.Error, e:
    print e
    if memcache_backup.has_key(team_k):
      team_activity = memcache_backup[team_k]
  if team_activity is None:
      return {}
  return team_activity

def set_team_activity(team, team_activity):
  team = sanitized_team(team)
  team_k = team_key(team)
  try:
    memcache.set(team_k, team_activity)
  except pylibmc.Error, e:
    print e
    memcache_backup[team_k] = team_activity

#mutex = Lock()
def update_user_activity_safely(team_activity, username, activityDict):
    # TODO: read about this -> pydoc pylibmc.ThreadMappedPool
    # we try to avoid race conditions here but it is not enough
    #mutex.acquire() # because there are several instances of the web server
    #try:
    team_activity[sanitized_username(username)] = activityDict
    #finally:
    #  mutex.release()

def update_user_activity_(team, username, activity):
    team_activity = get_team_activity(team)  
    activityDict = simplejson.loads(activity)
    update_user_activity_safely(team_activity, username, activityDict)
    set_team_activity(team, team_activity)
    return {}

@app.route("/update_user_activity", methods=['POST'])
def update_user_activity():
    team = sanitized_team(request.form['team'])
    username = sanitized_username(request.form['username'])
    activity = request.form['activity']
    return simplejson.dumps(update_user_activity_(team, username, activity))

@app.route("/retrieve_team_activity", methods=['POST'])
def retrieve_team_activity():
    team = sanitized_team(request.form['team'])
    return simplejson.dumps(get_team_activity(team))

@app.route("/log_js_error", methods=['POST'])
def log_js_error():
    print "JS ERROR:", request.form['errorData']
    return "OK!"


@app.route("/load_user_data", methods=['POST'])
def load_user_data():
    """
    Sample usage:
    $.post('/load_user_data', { username: 'carlosble'}, function(data){ console.log(data);})
    """
    user = user_by_name(request.form['team'], request.form['username'])
    response = make_response()
    response.headers['Content-Type'] = 'application/json'
    response.data = "{}";
    if (user is not None and user.serializedData is not None):
       response.data = user.serializedData
    return response

@app.route("/save_user_data", methods=['POST'])
def save_user_data():
    """
    Sample usage: 
    $.post('/save_user_data', { username: 'carlosble', 
          userData: JSON.stringify({field: 'value'}) }, function(data){ console.log(data);})
    """
    data = request.form['userData']
    user = user_by_name(request.form['team'], request.form['username'])	
    user.serializedData = data
    db.session.add(user)
    db.session.commit()
    response = make_response()
    response.headers['Content-Type'] = 'application/json'
    response.data = "{}"
    return response


@app.route("/test/integration")
def integration_test_load():
   if os.environ.get('PROD'):
       return "cant run tests on production"
   return render_template("integrationTests.html")

@app.route("/test/integration/delete/<team>/<username>")
def integration_tests_delete(team, username):
   if os.environ.get('PROD'):
       return "cant run tests on production"
   user = user_by_name(team, username)
   db.session.delete(user)
   db.session.commit()
   return "OK! - deleted"


	
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True) 
