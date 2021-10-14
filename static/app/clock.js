xplive.Clock = function() {
    var self = this;

    this.giveMeTheTime = function(){
        return new Date();
    };

    this.start = function(milliSecondsInterval) {
        setInterval(function() {
            self.onTick(new Date());
        }, milliSecondsInterval);
    };

    this.currentTime = function(){
        return new Date();
    };

    this.stop = function() {
        clearInterval(); // this is not working
    };

    this.onTick = function(date) {};
};
