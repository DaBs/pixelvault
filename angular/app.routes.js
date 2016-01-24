var appRoutes = angular.module('appRoutes', []).config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider, $location) {


  var accessResolve = function($http, $route) {
    return $http.get('/api/loggedin').then(function(response) {
      if (response.data !== "0") {
        console.log('logged in!');
        return true;
      } else {
        console.log('no login');
        return false;
      }
    });
  };

  $routeProvider

    .when('/', {
      templateUrl: 'views/subviews/home.html',
      controller: 'MainController'
    })

    .when('/users', {
      templateUrl: 'views/subviews/users.html',
      controller: 'UsersController'
    })

    .when('/vault', {
      templateUrl: 'views/subviews/vault-main.html',
      controller: 'MainVaultController'
    })

    .when('/account', {
      templateUrl: 'views/subviews/account-main.html',
      controller: 'MainAccountController'
    })

    .when('/account/history', {
      templateUrl: 'views/subviews/account-history.html',
      controller: 'HistoryAccountController'
    })

    .when('/account/settings', {
      templateUrl: 'views/subviews/account-settings.html',
      controller: 'SettingsAccountController'
    })

    .when('/deposit', {
      templateUrl: 'views/subviews/deposit-main.html',
      controller: 'MainDepositController'
    })

    .otherwise({
      templateUrl: 'views/subviews/home.html',
      controller: 'MainController'
    })

  $locationProvider.html5Mode(true);

}]);
