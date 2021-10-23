#Requirements

- Postgresql
- Python
- Memcached
- Casperjs
- pylibmc 

For developing we recomend to use
- virtualenv & [virtualenvwrapper](http://www.doughellmann.com/projects/virtualenvwrapper/)

# Installation

##Mac
We highly recomend to install using [Homebrew](http://mxcl.github.com/homebrew/)
###postgres
	brew install postgresql
###Memcached
	brew install memcached
###Casperjs (Just for BDD)
	brew install casperjs (this includes phantom)
###pylubmc
	brew install pylibmc
###python requirements
	pip install -r requirements.txt
	
##Linux (debian)
###postgresql
	apt-get install postgresql
	apt-get install postgresql-server-dev-8.4 
(postgresql-server-dev-8.4 is for be able to compile psycopg2)

###Memcached
	apt-get install memcached libmemcached-dev
###Casperjs
	apt-get install git-core #download casper
	git clone git://github.com/n1k0/casperjs.git
	cd casperjs
	git checkout tags/1.0.0-RC1
	ln -sf `pwd`/bin/casperjs /usr/local/bin/casperjs

###pylubmc
	apt-get install python-pylibmc
###python requirements
	pip install -r requirements.txt
	
	
 (if is a clean machine install pip `apt-get install python-pip`)
 	


#Starting App

##Before Start (Only once)
- Change postgres user password

	`sudo -u postgres psql postgres`

- Create database

	`echo "create database xplive" | psql -U postgres -h localhost`

- Export DATABASE_URL

	`export DATABASE_URL=postgres://postgres:pw@localhost/xplive`
	
- Create database schema

	`python manage.py createDbSchema`

	
##Start
	memcached &
	sudo /etc/init.d/postgresql start
	DATABASE_URL=postgres://postgres:pw@localhost/xplive python manage.py runserver
	
	
# Tests

## Launch BDD Tests (Casper)

- Start App
- Execute Casper

	`cd static/test/spec`

	`./casperTests.sh`
	
## Launch Unit Tests (Jasmine)

- Start App
- Open static/test/unitTests.htm 

# Authors:
- [Carlos Blé Jurado](https://github.com/carlosble)
