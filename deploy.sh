#!/bin/bash

old_version=v_28
new_version=v_29

# Generate files:
cd static/app
grunt
cd ../../
git rm -rf static/$old_version
cp -r static/ $new_version
mv $new_version static/$new_version
git add static/$new_version
subs="12s/\"\.\"/\"$new_version\"/g"
sed -i $subs server.py

# Start sever:
export DATABASE_URL=postgres://carlos:carlos@localhost/xplive
python server.py 2>/dev/null 1>&2 &
sleep 3

# Run tests:
cd static/test/spec/
./casperTests.sh
cd ../../../

# End:
echo "Now type this:"
echo "> git commit -a -m \"new release\""
echo "> git push heroku master"
echo "Once deployed clean the server:"
echo "http://liveteamapp.com/clean_team_activities/all_teams/password"

