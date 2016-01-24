var HisAccCtrl = angular.module('HisAccCtrl', []).controller('HistoryAccountController', function($scope, $rootScope, $http, $location) {

  $scope.trades = [];

  $http.get('/api/account/history')
  .then(function(response){
    $scope.trades = response.data;
    console.log(response.data);
  }, function(response) {
    if (response.status === 401) {
      $location.path('/');
    }
  });

});
