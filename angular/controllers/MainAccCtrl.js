var MainAccCtrl = angular.module('MainAccCtrl', []).controller('MainAccountController', function($scope, $http, $location) {

  /*$http.get('/api/account/history')
  .then(function(response){
    console.log(response);
  }, function(response) {
    if (response.status === 401) {
      $location.path('/');
    }
  });*/

  $http.get('/api/account')
  .then(function(response) {
    
  });

});
