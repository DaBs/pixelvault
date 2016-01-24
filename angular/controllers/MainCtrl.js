var MainCtrl = angular.module('MainCtrl', []).controller('MainController', function($scope, $rootScope, $http, $location) {

  $rootScope.$on('$routeChangeStart', function(event, next) {
    $http.get('/api/loggedin').then(function(response) {
      if (response.data !== "0") {
        $scope.loggedIn = true;
        $scope.user = response.data[0];
      } else {
        $scope.loggedIn = false;
        $scope.user = {};
        $location.path('/');
      }
    });
  })
});
