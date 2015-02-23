$(function() {
    var assetsToLoad = [
        '//code.jquery.com/jquery-migrate-1.2.1.min.js',
        './js/jquery.crypt.min.js',
        '//maxcdn.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js',
        '//ajax.googleapis.com/ajax/libs/angularjs/1.2.0/angular.min.js',
        '//ajax.googleapis.com/ajax/libs/angularjs/1.2.0/angular-cookies.js',
        '//ajax.googleapis.com/ajax/libs/angularjs/1.2.0/angular-resource.js',
        '//ajax.googleapis.com/ajax/libs/angularjs/1.2.0/angular-route.js',
        '//ajax.googleapis.com/ajax/libs/angularjs/1.2.0/angular-sanitize.js',
        './js/utilities.min.js',
        //'./js/model.js', //UNCOMMENT THIS LINE IF YOU WANT TO GRAB MODEL LOCALLY
        './js/app.min.js'
    ];
    var loadAsset = function(nextAsset) {
        var newScript = document.createElement("script");
        newScript.setAttribute("src", nextAsset);
        document.getElementById("app-body").appendChild(newScript);
        $(newScript).load(function() {
            checkForAssetCompletion();
        });
    }
    var checkForAssetCompletion = function() {
        if (assetsToLoad.length > 0) {
            loadAsset(assetsToLoad.shift());
        } else {
            angular.bootstrap(document, ['site']);
        }
    };
    checkForAssetCompletion();
});