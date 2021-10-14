function isSerializedDate(date) {
	return date && typeof(date) != 'object';
};

xplive.Tasks.TheBeginning = new Date(1981, 5, 15);

xplive.Tasks.PlanifiedTask = function(fields) {
    this.status = xplive.Status.RUNNING;
    this.shortDescription = "  ";
    this.longDescription = "  ";
    this.ticketId = "   ";
    this.enabledAction = xplive.Actions.STOP;
    this.interruptionsCount = 0;
    this.interruptionsCountToday = 0;
    this.pomodoros = 0;
    this.kind = xplive.Kinds.PLANIFIED;
    this.startTime = new Date();
    this.elapsedTime = new xplive.Common.Duration();
    this.elapsedTimeToday = new xplive.Common.Duration();
    sOn.Models.sOnDTO.call(this, fields);

    var self = this;

    var recalculateElapsedTime = function(currentTime){
        var lastDelta = currentTime - self.startTime;   
        increaseElapsedTime(lastDelta);
    };

    var addInterruption = function(){
      self.interruptionsCount++;
      self.interruptionsCountToday ++;
    };

    this.finish = function(currentTime){
      if (this.status == xplive.Status.RUNNING)
            recalculateElapsedTime(currentTime);
      this.status = xplive.Status.FINISHED;
    };

    this.stop = function(currentTime){
      if (this.status == xplive.Status.RUNNING) {
            recalculateElapsedTime(currentTime);
            addInterruption();
      }
      this.status = xplive.Status.STOPPED;
      this.enabledAction = xplive.Actions.RESUME;
    };

    this.isEquivalent = function(other){
        if (!other)
          return false;
        return this.id == other.id &&
              this.shortDescription == other.shortDescription &&
              this.longDescription == other.longDescription &&
              this.ticketId == other.ticketId;
    };

    this.toCSV = function(){
      var text = "";
      text += this.id.toString() + ",";
      text += this.status + ",";
      text += this.kind.toString() + ",";
      text += this.interruptionsCount + ",";
      text += this.interruptionsCountToday + ",";
      text += this.title + ",";
      text += this.ticketId + ",";
      text += this.shortDescription + ",";
      text += this.longDescription + ",";
      text += this.startTime.toISOString() + ",";
      text += this.elapsedTime.delta + ",";
      text += this.pomodoros + ",";
      text += this.elapsedTime.toString();
      return text;
    };

    var setLatestStartTime = function(startTime){
      if (!self.hasBeenStartedToday()){
          self.elapsedTimeToday.delta = 0;
          self.interruptionsCountToday = 0;
      }
      self.startTime = startTime;
    };

    this.resume = function(currentTime){
      this.status = xplive.Status.RUNNING;
      this.enabledAction = xplive.Actions.STOP;
      setLatestStartTime(currentTime);
    };

    var increaseElapsedTime = function(delta){
      self.elapsedTimeToday.increase(delta);
      self.elapsedTime.increase(delta);
    };

    this.hasBeenStartedToday = function(){
        var today = new Date();
        return this.startTime.getDate() == today.getDate() &&
               this.startTime.getMonth() == today.getMonth() &&
               this.startTime.getFullYear() == today.getFullYear();
    };

    this.toJSON = function(){
        var clon = this.clone();
        clon.startTime = clon.startTime.valueOf() - xplive.Tasks.TheBeginning.valueOf();
        return clon;
    };
};

xplive.Tasks.PlanifiedTask.prototype = new sOn.Models.sOnDTO();
xplive.Tasks.PlanifiedTask.constructor = xplive.Tasks.PlanifiedTask;

xplive.Tasks.UnexpectedTask = function(fields) {
	xplive.Tasks.PlanifiedTask.call(this, fields);
    this.kind = xplive.Kinds.UNEXPECTED;
};

xplive.Tasks.UnexpectedTask.prototype = new xplive.Tasks.PlanifiedTask();
xplive.Tasks.UnexpectedTask.constructor = xplive.Tasks.UnexpectedTask;

xplive.Tasks.FromRawObject = function(rawTask) {
  var task = new xplive.Tasks.PlanifiedTask(rawTask);
   if (rawTask.kind != xplive.Kinds.PLANIFIED)
       task = new xplive.Tasks.UnexpectedTask(rawTask);
   if (isSerializedDate(rawTask.startTime))
       task.startTime = new Date(parseInt(rawTask.startTime) + 
                                  xplive.Tasks.TheBeginning.valueOf());
   if (rawTask.elapsedTime)
       task.elapsedTime = new xplive.Common.Duration(rawTask.elapsedTime.delta);
   if (rawTask.elapsedTimeToday)
      task.elapsedTimeToday = new xplive.Common.Duration(rawTask.elapsedTimeToday.delta);
   return task;
};



