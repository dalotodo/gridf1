(function (angular,underscore, undefined) {
    if(underscore==undefined) throw 'Underscore not loaded';
    
    var app = angular.module("underscore",[]);
    
    function UnderscoreFactory() { return underscore; }
    
    app.provider("underscore", function() {
        this.$get = [UnderscoreFactory];
    });
    
})(window.angular,window._);