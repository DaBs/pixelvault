pixelvaultApp.filter('rarityFilter', function() {
  return function(items, rangeInfo) {
    var filtered = [];
    var rarities = {
      "b0c3d9": 7,
      "5e98d9": 6,
      "4b69ff": 5,
      "8847ff": 4,
      "d32ce6": 3,
      "eb4b4b": 2
    }
    var min = parseInt(rangeInfo.min);
    var max = parseInt(rangeInfo.max);
    // If time is with the range
    angular.forEach(items, function(item) {
        if( rarities[item.softData.rarity_color] <= min && rarities[item.softData.rarity_color] >= max ) {
            filtered.push(item);
        }
    });
    return filtered;
  };
});

pixelvaultApp.filter('rangeFilter', function() {
  return function( items, rangeInfo ) {
    var filtered = [];
    var min = parseInt(rangeInfo.min);
    var max = parseInt(rangeInfo.max);
    // If time is with the range
    angular.forEach(items, function(item) {
        if( item.hardData.price.median_price >= min && item.hardData.price.median_price <= max ) {
            filtered.push(item);
        }
    });
    return filtered;
  };
});
