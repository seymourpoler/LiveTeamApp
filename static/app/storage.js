xplive.Storage.Server = function(){
   sOn.Network.Client.call(this);
   this.urlForErrorLog = "/log_js_error";

   this.saveTasks = function(tasks, session){
       var self = this;
       this.requestData(session.host + "/save_user_data",
            {username: session.username,
             team: session.team, 
              userData: JSON.stringify(tasks)},
            function responseSuccessHandler(data){
            }
       );
   };

   this.loadTasks = function(session, callbackHandler){
      var self = this;
      this.requestData(session.host + "/load_user_data",
           {username: session.username, team: session.team},
           function responseSuccessHandler(data){
                 callbackHandler.handleLoadedTasks(data);
           }
      );
   };

   this.updateUserActivity = function(session, activity){
      var self = this;
      this.requestData(session.host + "/update_user_activity",
           {username: session.username, team: session.team,
            activity: JSON.stringify(activity)},
           function responseSuccessHandler(data){
                 
           }
      );
   };

   this.retrieveTeamActivity = function(session, successCallbak){
      var self = this;
      this.requestData(session.host + "/retrieve_team_activity",
           {team: session.team},
           function responseSuccessHandler(data){
                 successCallbak(data);
           }
      );
   };
};

xplive.Storage.Server.prototype = new sOn.Network.Client();