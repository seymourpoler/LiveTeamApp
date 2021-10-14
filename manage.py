# file copied from flaskbars: https://github.com/jamesward/flaskbars/blob/master/manage.py

from flaskext.script import Manager
from server import db, app

manager = Manager(app)

@manager.command
def createDbSchema():
    db.create_all()

@manager.command
def dropDbSchema():
    db.drop_all()


if __name__ == "__main__":
    manager.run()
