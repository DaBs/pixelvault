var SetAccCtrl= angular.module('SetAccCtrl', []).controller('SettingsAccountController', function($scope, $rootScope, $http, $location) {

  /*$http.get('/api/account/settings')
  .then(function(response) {

  });*/

  $scope.saveText = 'Save changes';

  $scope.updateProfile = function() {
    var thisUser = $scope.user;
    console.log(thisUser);
    $scope.saveText = 'Updating...';
    $http({
      method: 'POST',
      url: '/api/account/settings',
      data: {user: JSON.stringify(thisUser)}
    })
    .then(function (response) {
      if(response.data.success === true) {
        $scope.saveText = 'Successfully updated your setting!';
      }
    }, function(response) {
      console.log('err was ',response);
    });
  }

});
