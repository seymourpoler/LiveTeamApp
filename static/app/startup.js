var AppRouter = Backbone.Router.extend({
    routes:{          
        "dashboard" : "index",
        "team": "index",
        "pomodoro": "pomodoro",
        "tasks" : "tasks",
        "history" : "history",
        "full": "full",
        "settings": "settings"
    },
    index: function() {
      $('#tabs').show();
      window.menu.activate('dashboard');
      this.tasks();
    },
    team: function(){
      $('#tabs').hide();
      window.panels.show('team');
      window.menu.activate('team');
    },
    pomodoro: function(){
      window.dashboardTabs.activate('pomodoro');
      window.panels.show('pomodoro');
    },
    tasks: function(){
      window.dashboardTabs.activate('tasks');
      window.panels.show('tasks');
    },
    history: function(){
      window.dashboardTabs.activate('history');
      window.panels.show('finishedTasks');
    },
    full : function(){
      window.dashboardTabs.activate('full');
      window.panels.showAllBut('team');
      window.panels.hide('settings');
    },
    settings: function(){
      window.dashboardTabs.activate('settings');
      window.panels.show('settings');
    }
 });

window.startPage = function (){
   xplive.App = xplive.Factory.CreateApp({
      tasksPlaceholder: null,
      tasksBinderId: "tasks",
      finishedTasksBinderId: "finishedTasks",
      pomodorosPlaceholder: null
   });
   xplive.App.initialize();
   window.dashboardTabs = new xplive.Widgets.ExclusiveButtonToolbar();
   window.dashboardTabs.addButtons({
      tasks: 'tasksTab',
      pomodoro: 'pomodoroTab',
      history: 'historyTab',
      full: 'fullTab',
      settings: 'settingsTab'
   });
   window.menu = new xplive.Widgets.ExclusiveButtonToolbar();
   window.menu.addButtons({
      dashboard: 'dashboardMenu',
      team: 'teamMenu'
   });
   window.panels = new xplive.Widgets.ExclusivePanelList();
   window.panels.addPanels({
      pomodoro: 'pomodorosPage',
      tasks: 'tasksPanel',
      finishedTasks: 'finishedTasksPanel',
      team: 'teamPage',
      settings: 'settingsPage'
   });

   xplive.UItext.TASKS_MONITOR_TITLE = '{{TASKS_MONITOR_TITLE}}';

   // SPIKE!!!
   try{
     var check = new sOn.Widgets.Checkbox("confChatPopUpAlert");
     check.initialize();
     check.onChange = function(){
        window.webkitNotifications.requestPermission(function(){});
     };
   }
   catch(e){}
   // SPIKE END!!!
   
   window.readyForTestRunner = true;

};

$(document).ready(function () {
   if (startPage)
      startPage();
   var router = new AppRouter();
   Backbone.history.start();
});