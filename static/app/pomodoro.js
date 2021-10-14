xplive.Pomodoro = function() {
    var self = this;
    var startTime = new Date();
    this.sizeInMinutes = 30;
    this.refreshEveryMilliseconds = 1000;

    this.start = function() {
        startTime = new Date();
        this.clock.start(this.refreshEveryMilliseconds);
        listenTicks();
    };

    this.finish = function() {
        this.clock.stop();
        forgetTicks();
    };

    var forgetTicks = function() {
        self.clock.onTick = function() {};
    };

    function calculateMinutesDelta(from, to){
    	var delta = to - from;
        return self.sizeInMinutes - (Math.floor(delta/1000/60 * 10) / 10);
    };

	function calculatePercent(remainingMinutes) {
		return Math.ceil((100 - (remainingMinutes * 100 / self.sizeInMinutes)) * 10) / 10;
	};
	
	function roundMinutes(minutes) {
		return Math.floor(minutes) + 1;
	};
	
    var listenTicks = function() {
        self.clock.onTick = function(now) {
            var remainingMinutes = calculateMinutesDelta(startTime, now);
            if (remainingMinutes > 0)
                self.onStatusChanged({
                    status: xplive.Status.RUNNING,
                    sizeInMinutes: self.sizeInMinutes,
                    remainingMinutes: roundMinutes(remainingMinutes),
                	percent: calculatePercent(remainingMinutes)
                });
            else{
                self.finish();
                self.onTimeOver();
            }
        };
    };

    this.onStatusChanged = function(change) {};
    this.onTimeOver = function() {};
};