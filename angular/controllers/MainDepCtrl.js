var MainDepCtrl = angular.module('MainDepCtrl', []).controller('MainDepositController', function($scope, $http) {

  $scope.msg = '';
  $scope.inventory = [];
  $scope.selectedItems = {};
  $scope.step1 = false;
  $scope.step2 = false;
  $scope.step3 = false;
  $scope.totalValue = 0;
  $scope.currentStep = 1;
  $scope.uid = "";
  $scope.currentStatus = "not_started";
  $scope.finalMsg = {
    heading: 'Trade offer sent!',
    text: 'Your unique ID is: ',
    redirUrl: $scope.tradeOfferUrl,
    redirText: 'Click here to accept the tradeoffer'
  };
  var date = new Date();
  $scope.botMessages = [{
    time: ("0" + date.getHours()).slice(-2) + ':' + ("0" + date.getMinutes()).slice(-2) + ':' + ("0" + date.getSeconds()).slice(-2),
    message:'I am sleeping.... zZz',
    side: 'left',
    img: '/img/tinyrobo.png'
  }];

  $scope.changeStatus = function(newStatus) {
    $scope.currentStatus = newStatus;
    if (newStatus === 'started') {
      $scope.botMessages.push({
        time: ("0" + date.getHours()).slice(-2) + ':' + ("0" + date.getMinutes()).slice(-2) + ':' + ("0" + date.getSeconds()).slice(-2),
        message:'Send me a tradeoffer!',
        side: 'right',
        img: $scope.user.avatar
      });
      var items_to_receive = [];
      for (var k in $scope.selectedItems) {
        var newItem = {
          appid: $scope.selectedItems[k].tradeofferData.appid,
          contextid: $scope.selectedItems[k].tradeofferData.contextid,
          amount: 1,
          assetid: $scope.selectedItems[k].tradeofferData.assetid
        }
        items_to_receive.push(newItem);
      }
      var socket = io('http://localhost:3000');
      socket.on('connected' ,function(data) {
        socket.emit('startTradeOffer', {steamId: $scope.user.steamId, items_to_receive: items_to_receive});
      });
      socket.on('msg', function(data) {
        $scope.$apply(function() {
          $scope.botMessages.push(data);
        });
        $('.botChat__window').scrollTop($('.botChat__window__msgs').height());
      });
      socket.on('done', function(data) {
        $scope.$apply(function() {
          if (!data.success) {
            $scope.currentStatus = 'error';
            $scope.finalMsg = {
              heading: 'There was an error with your traderequest',
              text: 'The error was: ' + data.res,
              redirUrl: '/vault',
              redirText: 'Click to go back to vault'
            }
          } else {
            $scope.finalMsg.text = 'Your safety ID is: ' + data.uid;
            $scope.finalMsg.redirUrl = 'https://steamcommunity.com/tradeoffer/' + data.res.tradeofferid;
            $scope.currentStatus = 'done';
          }
        });
      });
      socket.on('acceptedOffer', function(data) {
        console.log('Accepted tradeoffer');
      });
    };
  };

  $scope.$watch('selectedItems', function() {
    if (Object.keys($scope.selectedItems).length > 0) {
      $scope.step1 = true;
    } else {
      $scope.step1 = false;
    }
    //$scope.step1 = false;
  }, true);


  $http.get('/api/account/steamInventory')
  .then(function(response) {
    if (!response.data.success) {
      $scope.msg = 'Errhh.. We had an issue looking into your inventory. Is it private? For more info, check Help/FAQ.';
    } else {
      $scope.inventory = response.data.items;
      var i = 0;
      $scope.inventory.forEach(function(item) {
        item.selected = false;
        $http({
          method: 'POST',
          url: '/api/steam/getItemPrice',
          data: {name: JSON.stringify(item.market_hash_name)}
        }).then(function(response) {
          if (response.data.success) {
            item.price.median_price = response.data.price.median_price;
          } else {
            console.log(response.err);
          }
        });

        $scope.$watch('inventory['+i+'].selected', function(newValue, oldValue) {
          var index = this.exp.replace(/\D/g, '');
          if (newValue === oldValue) {

          } else if (newValue === true) {
            $scope.selectedItems[index] = $scope.inventory[index];
            $scope.totalValue += parseFloat($scope.inventory[index].price.median_price.substr(0, $scope.inventory[index].price.median_price.length-1).replace(',', '.'))*100;
            $scope.totalValue = parseFloat($scope.totalValue.toFixed(0));
          } else if (newValue === false) {
            delete $scope.selectedItems[index];
            $scope.totalValue -= parseFloat($scope.inventory[index].price.median_price.substr(0, $scope.inventory[index].price.median_price.length-1).replace(',', '.'))*100;
            $scope.totalValue = parseFloat($scope.totalValue.toFixed(0));
          }
        });
        i++;
      });
    }
  });
});
