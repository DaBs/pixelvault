var MainVaultCtrl = angular.module('MainVaultCtrl', []).controller('MainVaultController', function($scope, $http, $location) {
  $scope.items = [];

  $scope.advSearch = false;

  $scope.sorting = "";

  $scope.priceRange = {
    min: 0,
    max: 360
  };

  $scope.rarityRange = {
    min: 7,
    max: 2
  };

  /*$scope.raritySort = {
    "eb4b4b": 2,
    "d32ce6": 3,
    "8847ff": 4,
    "4b69ff": 5,
    "5e98d9": 6,
    "b0c3d9": 7
  };*/

  $scope.rarities = {
    2: {
      name:'Ancient',
      color:'eb4b4b'
    },
    3: {
      name:'Legendary',
      color:'d32ce6'
    },
    4: {
      name: 'Mythical',
      color: '8847ff'
    },
    5: {
      name: 'Rare',
      color: '4b69ff'
    },
    6: {
      name: 'Uncommon',
      color: '5e98d9'
    },
    7: {
      name: "Common",
      color: 'b0c3d9'
    }
  }

  /*

    var rarities = {
      "b0c3d9": "uncommon",
      "5e98d9":
      "4b69ff": "rare",
      "8847ff": "mythical",
      "d32ce6": "legendary",
      "eb4b4b": "ancient"
    }
  }

  function compareRarity(a, b) {
    if ($scope.raritySort[a] < $scope.raritySort[b]) {
      return -1;
    }
    if ($scope.raritySort[a] > $scope.raritySort[b]) {
      return 1;
    }
    return 0;
  }*/

  $scope.getClass = function(path) {
    if ($location.path().substr(0, path.length) === path) {
      return 'active';
    } else {
      return ''
    };
  }

  $scope.searchFilter = function(obj) {
    var re = new RegExp($scope.searchText, 'i');
    return !$scope.searchText || re.test(obj.softData.name) || re.test(obj.hardData.price.median_price);
  }

  $scope.boolToStr = function(arg) {return arg ? 'DESC' : 'ASC'};

  $http.get('/api/vault')
  .then(function(response) {
    console.log(response.status);
    if (response.status === 200) {
      $scope.items = response.data;
    }
  }, function(response) {
    if (response.status === 401) {
      $location.path('/');
    }
  });
});
