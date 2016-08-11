// controller.js

(function() {
    var app = angular.module('myApp', ['onsen','ngStorage']);




angular.module('myApp').service('MemoService', function() {
  var memoData = JSON.parse(localStorage.getItem('memos')) || [];

    // sample memoData
    if (!memoData.length) {
        var memoData = [
            {latlng:[35.825238,139.69122],name:"蕨 ＯＫＩシステムセンター",comment:"コメント１"},
            {latlng:[35.827921,139.69064],name:"蕨駅",comment:"コメント２"}
        ];
    }
    
    function save() {
        localStorage.setItem('memos', JSON.stringify(memoData));
    };
    
    function add() {
        var memo = { latlng:[0,0], name:'Name', comment:'Comment'};
        memoData.unshift(memo);
        return memo;
    }
    
    function remove(index) {
        memoData.splice(index, 1);
        save();
    }
    
    return {
        memoData: memoData,
        add: add,
        save: save,
        remove: remove
        };
    });

    app.config(function ($logProvider) {
        $logProvider.debugEnabled(true);
    });
    

    //Map controller
    app.controller('MapController', function($scope, $log, $timeout, MemoService){
      
        $scope.map;
        $scope.markers = [];
        $scope.markerId = 1;

        // ★start
        $scope.infoList = [
//              {"latlng":[35.825238,139.69122],name:"蕨 ＯＫＩシステムセンター",comment:"コメント１"},
//              {"latlng":[35.827921,139.69064],name:"蕨駅",comment:"コメント２"},
            ];
        $scope.markerList = [];
        $scope.delayMarkerList = [];
        $scope.clickNewMarker;
        $scope.infoWnd;
        $scope.mapCanvas;
        // ★end

        //Map initialization  
        $timeout(function(){
      
            var latlng = new google.maps.LatLng(35.7042995, 139.7597564);
            var myOptions = {
                zoom: 8,
                //showOnLoad: false,
                //googleBarOptions:gopts,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
//            $scope.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions); 
//            $scope.overlay = new google.maps.OverlayView();
//            $scope.overlay.draw = function() {}; // empty function required
//            $scope.overlay.setMap($scope.map);
//            $scope.element = document.getElementById('map_canvas');
//            $scope.hammertime = Hammer($scope.element).on("hold", function(event) {
//                $scope.addOnClick(event);
//            });

            // ★start
    		//地図を表示
//$log.error('★2');
			$scope.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

            //情報ウィンドウの作成
			$scope.infoWnd = new google.maps.InfoWindow();
			//地図上にマーカーを配置していく
			var bounds = new google.maps.LatLngBounds();
			var station, i, latlng;
    		for (i in MemoService.memoData) {
//			for (i in $scope.infoList) {
				//マーカーを作成
    			station = MemoService.memoData[i];
//				station = $scope.infoList[i];
				latlng = new google.maps.LatLng(station.latlng[0], station.latlng[1]);
				bounds.extend(latlng);
				var marker = createMarker( $scope.map, latlng, station.name, station.comment );
			}
$log.debug('aa');
            $scope.map.fitBounds(bounds);

			//マーカーを時間差で表示
			$scope.delayMarkerList = $scope.markerList.concat();
//alert('★5');
			delayMarker(200);
//alert('★6 '+$scope.delayMarkerList);

            // ★end
        },100);

		// マーカー作成
		function createMarker(map, latlng, title, comment) {
			//マーカーを作成
			var marker = new google.maps.Marker({
				position : latlng,
				map : map,
				animation: google.maps.Animation.DROP,
				visible : false,
				title : title
			});

			// マーカーリストに追加
			var markerTmp = [marker, comment];
			$scope.markerList.push( markerTmp );

			//マーカーがクリックされたら、情報ウィンドウを表示
			google.maps.event.addListener(marker, "click", function(){
				$scope.infoWnd.setContent("<strong>" + markerTmp[0].title + "</strong></br>" + markerTmp[1]);
				$scope.infoWnd.open(map, marker);
			});
			return marker;
        }

		// マーカを時間差で表示
		function delayMarker(timeout) {
			if ( $scope.delayMarkerList.length == 0 )
				return;
			$scope.delayMarkerList[0][0].setVisible (true); 
			$scope.infoWnd.setContent("<strong>" + $scope.delayMarkerList[0][0].title + "</strong></br>" + $scope.delayMarkerList[0][1]);
			$scope.infoWnd.open($scope.map, $scope.delayMarkerList[0][0]);

			$scope.delayMarkerList.shift();
			setTimeout(function() {
				delayMarker(timeout);
			}, timeout);
		}


        //Delete all Markers
        $scope.deleteAllMarkers = function(){
            
            if($scope.markers.length == 0){
                ons.notification.alert({
                    message: 'There are no markers to delete!!!'
                });
                return;
            }
            
            for (var i = 0; i < $scope.markers.length; i++) {
                            
                //Remove the marker from Map                  
                $scope.markers[i].setMap(null);
            }
            
            //Remove the marker from array.
            $scope.markers.length = 0;
            $scope.markerId = 0;
            
            ons.notification.alert({
                message: 'All Markers deleted.'
            });   
        };
    
        $scope.rad = function(x) {
            return x * Math.PI / 180;
        };
        
        //Calculate the distance between the Markers
        $scope.calculateDistance = function(){
            
            if($scope.markers.length < 2){
                ons.notification.alert({
                    message: 'Insert at least 2 markers!!!'
                });
            }
            else{
                var totalDistance = 0;
                var partialDistance = [];
                partialDistance.length = $scope.markers.length - 1;
                
                for(var i = 0; i < partialDistance.length; i++){
                    var p1 = $scope.markers[i];
                    var p2 = $scope.markers[i+1];
                    
                    var R = 6378137; // Earth’s mean radius in meter
                    var dLat = $scope.rad(p2.position.lat() - p1.position.lat());
                    var dLong = $scope.rad(p2.position.lng() - p1.position.lng());
                    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos($scope.rad(p1.position.lat())) * Math.cos($scope.rad(p2.position.lat())) *
                    Math.sin(dLong / 2) * Math.sin(dLong / 2);
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    totalDistance += R * c / 1000; //distance in Km
                    partialDistance[i] = R * c / 1000;
                }
                
                
                ons.notification.confirm({
                    message: 'Do you want to see the partial distances?',
                    callback: function(idx) {
                        
                        ons.notification.alert({
                            message: "The total distance is " + totalDistance.toFixed(1) + " km"
                        });
                        
                        switch(idx) {
                            case 0:
                                
                                break;
                            case 1:
                                for (var i = (partialDistance.length - 1); i >= 0 ; i--) {
                                    
                                    ons.notification.alert({
                                        message: "The partial distance from point " + (i+1) + " to point " + (i+2) + " is " + partialDistance[i].toFixed(1) + " km"
                                    });
                                }
                                break;
                        }
                    }
                });
            }
        };
        
        //Add single Marker
        $scope.addOnClick = function(event) {
            var x = event.gesture.center.pageX;
            var y = event.gesture.center.pageY-44;
            var point = new google.maps.Point(x, y);            
            var coordinates = $scope.overlay.getProjection().fromContainerPixelToLatLng(point);       
         
            var marker = new google.maps.Marker({
                position: coordinates,
                map: $scope.map
            });
            
            marker.id = $scope.markerId;
            $scope.markerId++;
            $scope.markers.push(marker);            


            $timeout(function(){
            //Creation of the listener associated to the Markers click

            google.maps.event.addListener(marker, "click", function (e) {
                ons.notification.confirm({
                    message: 'Do you want to delete the marker?',
                    callback: function(idx) {
                        switch(idx) {
                            case 0:
                                ons.notification.alert({
                                    message: 'You pressed "Cancel".'
                                });
                                break;
                            case 1:
                                for (var i = 0; i < $scope.markers.length; i++) {
                                    if ($scope.markers[i].id == marker.id) {
                                        //Remove the marker from Map                  
                                        $scope.markers[i].setMap(null);
                         
                                        //Remove the marker from array.
                                        $scope.markers.splice(i, 1);
                                    }
                                }
                                ons.notification.alert({
                                    message: 'Marker deleted.'
                                });
                                break;
                        }
                    }
                });
            });
            },1000);

            
        };
    });
})();

