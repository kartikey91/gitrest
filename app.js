(function(){
  'use strict';
  
  angular.module('gitrestApp', [])
  .controller('mainController', ['$http', '$q', mainController]);
  
  function mainController($http, $q){
    var self = this;
    
    var owner = "";
    var repository = "";
    
    var state ="open";
    
    var perPage = 30;
    
    var githubApiUrl ='';
    
    self.githubUrl = '';
    
    var openIssuesHeadUrl = '';
    
    self.loadGithubUrl = function($event){
      console.log(self.githubUrl);
      var keyCode = $event.which || $event.keyCode;
      if (keyCode === 13) {
        if(self.githubUrl){
          var str1 = self.githubUrl; // "https://github.com/Shippable/support";
          owner = str1.split('/')[3];
          repository = str1.split('/')[4];
          githubApiUrl = "https://api.github.com/repos/" + owner + "/"+ repository;
          openIssuesHeadUrl = githubApiUrl + "/issues?q=state:" + state;
        }
        $http.head(openIssuesHeadUrl)
          .then(function(response) {
            var str = response.headers().link;
            var totalPages = parseInt(str.split(';')[1].split(',')[1].split('&')[1].split('=')[1].split('>')[0]);
            var openIssuesUrl = githubApiUrl + "/issues?page=" + totalPages + "&per_page="+ perPage + "&q=state:" + state;
            $http.get(openIssuesUrl)
            .then(function(response) {
                var tempIssues = response.data.length;
                self.totalOpenIssues = tempIssues + (totalPages-1)*perPage;
            });
            var last24HoursOpenIssues = 0;
            var last247OpenIssues = 0;
            var moreThan7daysOpenIssues = 0;
            var promises = [];
            for(var i = 1; i<=totalPages; i++){
              var openIssuesUrl1 = githubApiUrl+"/issues?page="+i+"&per_page=30&q=state:open";
              var promise = $http({
                  url   : openIssuesUrl1,
                  method: 'GET'
              });
              promises.push(promise);
            }
            $q.all(promises)
            .then(function(values){
              angular.forEach(values, function(value){
                var issues = value.data;
                angular.forEach(issues, function(issue){
                  if(Math.abs((new Date() - new Date(issue.created_at))/3600000)<=24){
                    last24HoursOpenIssues++;
                  }
                  if(Math.abs((new Date() - new Date(issue.created_at))/3600000)>24 && Math.abs((new Date() - new Date(issue.created_at))/3600000)<24*7){
                    last247OpenIssues++;
                  }
                  if(Math.abs((new Date() - new Date(issue.created_at))/3600000)>24*7){
                    moreThan7daysOpenIssues++; 
                  }
                });
              });
              self.last24HoursOpenIssues = last24HoursOpenIssues;
              self.last247OpenIssues = last247OpenIssues;
              self.moreThan7daysOpenIssues = moreThan7daysOpenIssues;
              
            });
          }); 
      }
    };
  }
})();