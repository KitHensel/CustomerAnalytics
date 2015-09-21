var reportingApp = angular.module('reportingApp', ["chart.js"]);

reportingApp.controller('CardCtrl', function ($scope, $http) {

	var userData = 'https://s3-us-west-2.amazonaws.com/jschallenge/users.json';
	var logData = 'https://s3-us-west-2.amazonaws.com/jschallenge/logs.json';
  var batch = 12;

	//load all users
  $http.get(userData).success(function(users){
  	$scope.users = [];

    users = users.slice(0, batch);

  	//load all logs
    $http.get(logData).success(function(logs){
      logs = $scope.findLogBatch(users, logs);

    	$scope.users = users.map(function(user){
				return $scope.processUser(user, logs)
    	});

			$scope.done();
    });
  });

  $scope.processUser = function(user, allLogs){
  	var results = $scope.findUserLogs(user, allLogs);

  	user.logs = results[0];
  	allLogs = results[1];

  	user.revenue = $scope.calculateRevenue(user.logs);

    //load data for chart
    user.chartData = $scope.getChartDates(user.logs);
    user.labels = $scope.getLabels(user.chartData[0]);
    user.series = ["Days"];

  	user.logs = $scope.groupLogs(user.logs);

    if(user.avatar == ""){
      user.firstLetter = user.name.charAt(0);
    };

    return user;
  };

  $scope.findLogBatch = function(users, logs){
    var userIds = users.map(function(user){
      return user.id;
    }).join(",");

    return logs.filter(function(log, index){
      if(userIds.match(log.user_id)){
        return true;
      };
    });
  };

  //connect users and their logs...
  $scope.findUserLogs = function(user, logs){
		var userLogs = logs.filter(function(log, index){
  		if(log.user_id == user.id){
  			logs.splice(index, 1); //remove log once it's attached to user.
  			return true;
  		};
  	});

  	return [userLogs, logs];
  };

  //get all unique log dates for line graph
  $scope.getChartDates = function(logs){
    var dates = logs.map(function(log){
      var day = parseInt(log.time.match(/-\d{2}-\d{2}/).toString().slice(-2));

      if(day < 5){
        return 5;
      };

      return 5*(Math.round(parseInt(day)/5));
    });

    return [dates];
  };

  $scope.getLabels = function(dates){
    return dates.unique().sort(function(a,b){return a - b});
  };

  //group logs by all types, ensure to handle future types
  $scope.groupLogs = function(logs){
  	var types = {};

  	logs.forEach(function(log, index){
  		var type = log.type + "s";

  		if(types[type]){
  			types[type] += 1;
  		}else{
				types[type] = 1;
  		};
  	});

  	return types;
  };

  //calculate total revenue from all logs for user
  $scope.calculateRevenue = function(logs){
		return logs.reduce(function(total, log){
	   	return (total + parseFloat(log.revenue));
	  }, 0).toFixed(2);
  };

  $scope.done = function(){
		$("#loading").hide();
  };
});

Array.prototype.unique = function() {
  var unique = [];
  for(var i = 0; i < this.length; i++){
    if(unique.indexOf(this[i]) == -1){
      unique.push(this[i]);
    };
  };

  return unique;
};