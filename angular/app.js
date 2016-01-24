

var pixelvaultApp = angular.module('pixelvaultApp', [
  'angular-loading-bar',
  'rzModule',
  'ngAnimate',
  'ngRoute',
  'luegg.directives',
  'angularCancelOnNavigateModule',
  'appRoutes',
  'MainCtrl',
  'MainVaultCtrl',
  'UserCtrl',
  'MainAccCtrl',
  'HisAccCtrl',
  'SetAccCtrl',
  'MainDepCtrl'
]);

angular
  .module('angularCancelOnNavigateModule', [])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('HttpRequestTimeoutInterceptor');
  })
  .run(function ($rootScope, HttpPendingRequestsService) {
    $rootScope.$on('$locationChangeSuccess', function (event, newUrl, oldUrl) {
      if (newUrl != oldUrl) {
        HttpPendingRequestsService.cancelAll();
      }
    })
  });



//= include controllers/*
//= include services/*

//= include app.routes.js

//= include app.directives.js

//= include app.filters.js

//= include app.services.js

//= include app.factories.js


//= include ../public/assets/js/include.js
