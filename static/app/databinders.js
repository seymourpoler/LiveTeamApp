(function(dataBinders) {

    var statusColumnTitle = "Status";
    var typeColumnTitle = "Type";
    var idColumnTitle = "Id";

    var taskColumns = [
        {
        "mDataProp": "id",
        "bSortable": false,
        "sTitle": idColumnTitle,
        "bVisible": false},
        {
        "mDataProp": "status",
        "bSortable": false,
        "sTitle": statusColumnTitle},
    {
        "mDataProp": "kind",
        "bSortable": false,
        "sTitle": typeColumnTitle},
    {
        "mDataProp": "shortDescription",
        "bSortable": false,
        "sTitle": "Details (estimation, ...)",
        "bEditable": true,
        "charsSize": 50},
    /*{
        "mDataProp": "longDescription",
        "bSortable": false,
        "sTitle": "Description/Estimation",
        "bEditable": true},*/
    {
        "mDataProp": "ticketId",
        "bSortable": false,
        "sTitle": "Ticket Id",
        "bEditable": true,
        "charSize": 5}
         ];

    dataBinders.Finished = sOn.DataBinders.TableDataBinder.override({
        _defineColumns: function() {
            var columns = taskColumns.slice();
            columns.push({
                "mDataProp": "startTime",
                "bSortable": false,
                "sTitle": "Start Time"
            });
            columns.push({
                "mDataProp": "elapsedTime",
                "sTitle": "Elapsed time"
            });
            columns.push({
                "mDataProp": "pomodoros",
                "sTitle": "Pomodoros"
            });
            columns.push({
                "mDataProp": "interruptionsCount",
                "sTitle": "Interruptions"
            });
        	this.widget.removeColumnTitle = "Delete";
            this.widget.setColumns(columns, false, true);
        }
    });

    dataBinders.Tasks = sOn.DataBinders.TableDataBinder.override({
        _defineColumns: function() {
            var columns = taskColumns.slice();
            var actionColumnTitle = "Action";
        	columns.splice(0, 0, {
                "mDataProp": "enabledAction",
                "bSortable": false,
                "bClickable": true,
                "sTitle": actionColumnTitle
            });
        	this.widget.removeColumnTitle = "Finish";
            this.widget.setColumns(columns, false, true);
            var renderDetails = new dataBinders.TaskRenderDetails(actionColumnTitle, this);
            this.widget.defineRowRenderDetails(renderDetails);
        }
    });

    dataBinders.TaskRenderDetails = function(actionColTitle, binder) {
        var self = this;
        this.calculateBy = function(taskId) {
            var task = binder.getBusinessCollection().get(taskId);
            var statusCss = 'statusCss';
            var statusColumn = {
                columnTitle: statusColumnTitle,
                cssClass: statusCss
            };
        	var actionToggleCss = dataBinders.TaskRenderDetails.taskOnCss;
            if (task.status.indexOf(xplive.Status.RUNNING) > -1) {
            	statusColumn.cssClass = dataBinders.TaskRenderDetails.runningStatus;
                if (task.kind == xplive.Kinds.UNEXPECTED)
                   statusColumn.cssClass = dataBinders.TaskRenderDetails.unexpectedRunningStatus;
            }
            if (task.status.indexOf(xplive.Status.STOPPED) > -1) {
            	statusColumn.cssClass = dataBinders.TaskRenderDetails.stoppedStatus;
            	actionToggleCss = dataBinders.TaskRenderDetails.taskOffCss;
            }
            return [
                { columnTitle: actionColTitle,
                  cssClass: actionToggleCss
                }, 
                { columnTitle: idColumnTitle,
                  cssClass: statusColumn.cssClass 
                },
                { columnTitle: typeColumnTitle,
                  cssClass: statusColumn.cssClass
                },
                statusColumn
            ];
        };
    };

	dataBinders.TaskRenderDetails.runningStatus = xplive.Styles.runningStatus;
	dataBinders.TaskRenderDetails.unexpectedRunningStatus = xplive.Styles.unexpectedRunningStatus;
    dataBinders.TaskRenderDetails.stoppedStatus = xplive.Styles.stoppedStatus;
    dataBinders.TaskRenderDetails.stopActionCss = xplive.Styles.stopActionCss;
	dataBinders.TaskRenderDetails.taskOnCss = xplive.Styles.taskOnCss;
	dataBinders.TaskRenderDetails.taskOffCss = xplive.Styles.taskOffCss;

}(xplive.DataBinders))
