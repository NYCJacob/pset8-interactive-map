/**
 * service.js
 *
 * Computer Science 50
 * Problem Set 8
 *
 * Implements a shuttle service.
 */

// default height
var HEIGHT = 0.8;

// default latitude
var LATITUDE = 42.3745615030193;

// default longitude
var LONGITUDE = -71.11803936751632;

// default heading
var HEADING = 1.757197490907891;

// default number of seats
var SEATS = 10;

// default velocity
var VELOCITY = 50;

// global reference to shuttle's marker on 2D map
var bus = null;

// global reference to 3D Earth
var earth = null;

// global reference to 2D map
var map = null;

// global reference to shuttle
var shuttle = null;


// fuel capacity for fuel guage display calculations
var fuelCAPACITY = 25.00;

// global gallons of fuel at start/max
var fuel = fuelCAPACITY;

///  variable for fuel gauge
// global mpg
var mpg = 15;

// global mileage counter and trip counter
var mileage = 0;
var trip = 0;

// array of positions for time distance fuel calculations
var positions = []; 

// mileage counter
var travel= 0;

// global counter for shuttle distance and time measurements
var track = 0; 

// loadp version 1 of the Google Earth API
google.load("earth", "1");

// load version 3 of the Google Maps API
google.load("maps", "3", {other_params: "sensor=false"});

// once the window has loaded
$(window).load(function() {

    // listen for keydown anywhere in body
    $(document.body).keydown(function(event) {
        return keystroke(event, true);
    });

    // listen for keyup anywhere in body
    $(document.body).keyup(function(event) {
        return keystroke(event, false);
    });

    // listen for click on Drop Off button
    $("#dropoff").click(function(event) {
        dropoff();
    });

    // listen for click on Pick Up button
    $("#pickup").click(function(event) {
        pickup();
    });
    
    // listen for click on Get Gas button
    $("#fillerUp").click(function(event) {
        fillerup();
        });
    

    // load application
    load();
    
    // set first positions as config start point
    positions[0] = [LATITUDE, LONGITUDE];
    console.log("Starting position: " + positions[0]);
});

// unload application
$(window).unload(function() {
    unload();
});

/**
 * Renders seating chart.
 */
function chart()
{
    var html = "<ol start='0'>";
    for (var i = 0; i < shuttle.seats.length; i++)
    {
        if (shuttle.seats[i] == null)
        {
            html += "<li>Empty Seat</li>";
        }
        else
        {
            html += "<li>" + shuttle.seats[i].name + "::" + shuttle.seats[i].house + "</li>";
        }
    }
    html += "</ol>";
    $("#chart").html(html);
}

/** records position reading for time distance calcuations to display on dashboard
*
*/
function odometer()
{
    track++;
   // console.log("tracking: " + track + "position =" + shuttle.position.latitude + "--" +  shuttle.position.longitude);
    positions[track] = [shuttle.position.latitude, shuttle.position.longitude];
   // console.log(positions[track][0] + " by " + positions[track][1]);
    travel += shuttle.distance(positions[track-1][0], positions[track-1][1]);
    console.log("meters traveled: " + travel);
    trip += (travel * 0.000621371192);
    console.log("trip distance is: " + trip);
    $("#trip").html(trip.toFixed(4));
    mileage += (travel * 0.000621371192);
   // console.log("Mileage is: " + mileage);
    $("#mileage").html(mileage.toFixed(4));
    fuel = fuelCAPACITY - (trip / mpg);
  //  console.log("Fuel is: " + fuel);
    return true;
}

/** fuel guage subroutine
*
*/
function fuelAmt()
{
   var fuelLevel = fuel/fuelCAPACITY;
   console.log("fuel is at: " + fuel + ' / ' + fuelCAPACITY + 'level is' + fuelLevel);
   
   if ((fuelLevel < .91)  && (fuelLevel > .81))
   {
       //console.log("fuel at 90 percent-------------------");
       $("#fuel10").css({'background-color':'red'});
   }
   else if ((fuelLevel < .81)  && (fuelLevel > .71))
   {
       console.log("fuel at 80 percent-------------------");
       $("#fuel10, #fuel9").css({'background-color':'red'});
   }
   else if ((fuelLevel < .71)  && (fuelLevel > .61))
   {
       $("#fuel8, #fuel9").css({'background-color':'red'});
   }
   else if ((fuelLevel < .61)  && (fuelLevel > .51))
   {
       $("#fuel7, #fuel8").css({'background-color':'red'});
   }
   else if ((fuelLevel < .51)  && (fuelLevel > .41))
   {
       $("#fuel6, #fuel7").css({'background-color':'red'});
   }
   else if ((fuelLevel < .41)  && (fuelLevel > .31))
   {
       $("#fuel5, #fuel6").css({'background-color':'red'});
   }
   else if ((fuelLevel < .31)  && (fuelLevel > .21))
   {
       $("#fuel4, #fuel5").css({'background-color':'red'});
   }
   else if ((fuelLevel < .21)  && (fuelLevel > .11))
   {
       $("#fuel3, #fuel4").css({'background-color':'red'});
   }
   else if ((fuelLevel < .11)  && (fuelLevel > .01))
   {
       $("#fuel2, #fuel3").css({'background-color':'red'});
   }
   else if (fuelLevel < .01)
   {
       $("#fuel1, #fuel2").css({'background-color':'red'});
   }
}
setInterval(fuelAmt, 1000);

/**
 * Drops up passengers if their stop is nearby.
 */
function dropoff()
{
    var toDropOff = false;
    console.log("toDropOff = " + toDropOff);
    for (var people = 0; people < shuttle.seats.length; people++)
   {
     if (shuttle.seats[people] == null) // needed because null on before document ready
     {
        continue;
     }
     //console.log("Latitude is:  " + HOUSES[shuttle.seats[0].house].lat);
     var dist = shuttle.distance(HOUSES[shuttle.seats[people].house].lat, HOUSES[shuttle.seats[people].house].lng);
     console.log("Distance= " + dist);

     if(dist <= 30.0)
     {
        console.log("toDropOff = " + toDropOff);
        toDropOff = true;
        console.log("pickup in range");
        $("#announcements").html("Stopping for passenger");
        shuttle.seats[people] = null;
     }

    }
    console.log("toDropOff = " + toDropOff);
    if (toDropOff == false)
    {
        console.log("pickup out of range");
        $("#announcements").html("Drop off location out of range- sorry.");
    }    
    chart();
}


/**
 * filler up function when at gas station
 */
 function fillerup()
 {
    // calculate distance to gas station
    var gasDist = shuttle.distance(gasStation[0], gasStation[1]);
    if (gasDist <= 10.0)
    {
        $("#announcements").html("Stopping for gas.");
        fuel = fuelCAPACITY;
        trip = 0;
        travel = 0;
        //  reset fuel guage colors
        $("#fuel1, #fuel2, #fuel3, #fuel4, #fuel5, #fuel6, #fuel7, #fuel8, #fuel9, #fuel10").css({'background-color':'green'});
    }
    else
    {
        $("#announcements").html("Station out of range.");
    }
 
 }



/**
 * Called if Google Earth fails to load.
 */
function failureCB(errorCode) 
{
    // report error unless plugin simply isn't installed
    if (errorCode != ERR_CREATE_PLUGIN)
    {
        alert(errorCode);
    }
}

/**
 * Handler for Earth's frameend event.
 */
function frameend() 
{
    shuttle.update();
}

/**
 * Called once Google Earth has loaded.
 */
function initCB(instance) 
{
    // retain reference to GEPlugin instance
    earth = instance;

    // specify the speed at which the camera moves
    earth.getOptions().setFlyToSpeed(100);

    // show buildings
    earth.getLayerRoot().enableLayerById(earth.LAYER_BUILDINGS, true);

    // disable terrain (so that Earth is flat)
    earth.getLayerRoot().enableLayerById(earth.LAYER_TERRAIN, false);

    // prevent mouse navigation in the plugin
    earth.getOptions().setMouseNavigationEnabled(false);

    // instantiate shuttle
    shuttle = new Shuttle({
        heading: HEADING,
        height: HEIGHT,
        latitude: LATITUDE,
        longitude: LONGITUDE,
        planet: earth,
        seats: SEATS,
        velocity: VELOCITY
    });

    // synchronize camera with Earth
    google.earth.addEventListener(earth, "frameend", frameend);

    // synchronize map with Earth
    google.earth.addEventListener(earth.getView(), "viewchange", viewchange);

    // update shuttle's camera
    shuttle.updateCamera();

    // show Earth
    earth.getWindow().setVisibility(true);

    // render seating chart
    chart();

    // populate Earth with passengers and houses
    populate();
}

/**
 * Handles keystrokes.
 */
function keystroke(event, state)
{
    // ensure we have event
    if (!event)
    {
        event = window.event;
    }
    
    if (fuel  <= 0.0)
    {
        shuttle.states.movingForward = false;
        shuttle.states.movingBackward = false;
        
        // annouce out of gas
        $("#announcements").html("Bus is out of gas");
        return false;
    }
        
    // annouce bus is moving
    $("#announcements").html("Please sit bus is moving");

    // left arrow
    if (event.keyCode == 37)
    {
        shuttle.states.turningLeftward = state;
        return false;
    }

    // up arrow
    else if (event.keyCode == 38)
    {
        shuttle.states.tiltingUpward = state;
        return false;
    }

    // right arrow
    else if (event.keyCode == 39)
    {
        shuttle.states.turningRightward = state;
        return false;
    }

    // down arrow
    else if (event.keyCode == 40)
    {
        shuttle.states.tiltingDownward = state;
        return false;
    }

    // A, a
    else if (event.keyCode == 65 || event.keyCode == 97)
    {
        shuttle.states.slidingLeftward = state;
        odometer();
        return false;
    }

    // D, d
    else if (event.keyCode == 68 || event.keyCode == 100)
    {
        shuttle.states.slidingRightward = state;
        odometer();
        return false;
    }
  
    // S, s
    else if (event.keyCode == 83 || event.keyCode == 115)
    {
        shuttle.states.movingBackward = state; 
        odometer();    
        return false;
    }

    // W, w
    else if (event.keyCode == 87 || event.keyCode == 119)
    {
        shuttle.states.movingForward = state;
        odometer();    
        return false;
    }
  
    return true;
}

/**
 * Loads application.
 */
function load()
{
    // embed 2D map in DOM
    var latlng = new google.maps.LatLng(LATITUDE, LONGITUDE);
    map = new google.maps.Map($("#map").get(0), {
        center: latlng,
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: false,
        zoom: 17,
        zoomControl: true
    });

    // prepare shuttle's icon for map
    bus = new google.maps.Marker({
        icon: "https://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/bus.png",
        map: map,
        title: "you are here"
    });

    // embed 3D Earth in DOM
    google.earth.createInstance("earth", initCB, failureCB);
}

/**
 * Picks up nearby passengers.
 */
function pickup()
{
  //  var d;
   // console.log("pickup called");
    var toPickup = 0;
    var emptySeats = 0;
    var seat = 0;
    var houseMember = false;
    var features = earth.getFeatures();    // to remove placemark
    for (var c = 0; c < PASSENGERS.length; c++)
    {
        // check if passenger in a member house
    for (var house in HOUSES)
        {
            if (PASSENGERS[c].house == house)
            {
                houseMember = true;
            }
        }
        
        // check for passengers within pickup distance of 15 meters
        pickupDistance = shuttle.distance(PASSENGERS[c].lat, PASSENGERS[c].long);
        if (pickupDistance <= 15.00 && PASSENGERS[c].seated !== true && houseMember == true)
        {
            //  check available seats
            for (var seat = 0; seat < shuttle.seats.length; seat++)
            {
                if (shuttle.seats[seat] == null)
                {
                    // make announcements
                    $("#announcements").html("Bus stopping for passenger!");
                    
                    // put passenger in bus
                    shuttle.seats[seat] = {name : PASSENGERS[c].name, house : PASSENGERS[c].house};
                    
                    // update seating chart
                    chart();
                    
                    // remove placemark
                    features.removeChild(PASSENGERS[c].placemark);
                    
                    // remove marker
                    PASSENGERS[c].marker.setMap(null);
                    
                    // designate as seated passenger in PASSENGERS array
                    PASSENGERS[c].seated = true;
                    // once seated continue looking
                    break;
                }
                else
                {
                    // make announcements no seating no stopping
                    $("#announcements").html("Bus full not stopping!");  
                }
            }
        }
        else if (pickupDistance >= 15.00)
        {
                // make announcements passenger in range
                $("#announcements").html("No passenger in pickup range.");    
        }
    }
}  // end pickup function

/**
 * Populates Earth with passengers and houses.
 */
function populate()
{
    // get current URL, sans any filename
    var url = window.location.href.substring(0, (window.location.href.lastIndexOf("/")) + 1);




//  my code:  make a gas station

        // pick station
        gasStation = [42.375184942085326, -71.11919227776893];

        // prepare placemark
        var placemark = earth.createPlacemark("");
        placemark.setName('GasStation');

        // prepare icon
        var icon = earth.createIcon("");
        icon.setHref(url + "/img/fillingstation.png");
       // icon.setHref("https://google-maps-icons.googlecode.com/files/gazstation.png");

        // prepare style
        var style = earth.createStyle("");
        style.getIconStyle().setIcon(icon);
        style.getIconStyle().setScale(4.0);

        // prepare stylemap
        var styleMap = earth.createStyleMap("");
        styleMap.setNormalStyle(style);
        styleMap.setHighlightStyle(style);

        // associate stylemap with placemark
        placemark.setStyleSelector(styleMap);

        // prepare point
        var point = earth.createPoint("");
        point.setAltitudeMode(earth.ALTITUDE_RELATIVE_TO_GROUND);
        point.setLatitude(gasStation[0]);
        point.setLongitude(gasStation[1]);
        point.setAltitude(0.0);

        // associate placemark with point
        placemark.setGeometry(point);

        // add placemark to Earth
        earth.getFeatures().appendChild(placemark);

        // add marker to map
        var marker = new google.maps.Marker({
            icon: "https://google-maps-icons.googlecode.com/files/gazstation.png",
            map: map,
            position: new google.maps.LatLng(gasStation[0], gasStation[1]),
            title: "Gas Station"
        });





    // mark houses
    for (var house in HOUSES)
    {
        // plant house on map
        new google.maps.Marker({
            icon: "https://google-maps-icons.googlecode.com/files/home.png",
            map: map,
            position: new google.maps.LatLng(HOUSES[house].lat, HOUSES[house].lng),
            title: house
        });
    }


    // scatter passengers
    for (var i = 0; i < PASSENGERS.length; i++)
    {
        // pick a random building
        var building = BUILDINGS[Math.floor(Math.random() * BUILDINGS.length)];

        // prepare placemark
        var placemark = earth.createPlacemark("");
        placemark.setName(PASSENGERS[i].name + " to " + PASSENGERS[i].house);

        // prepare icon
        var icon = earth.createIcon("");
        icon.setHref(url + "/img/" + PASSENGERS[i].username + ".jpg");

        // prepare style
        var style = earth.createStyle("");
        style.getIconStyle().setIcon(icon);
        style.getIconStyle().setScale(4.0);

        // prepare stylemap
        var styleMap = earth.createStyleMap("");
        styleMap.setNormalStyle(style);
        styleMap.setHighlightStyle(style);

        // associate stylemap with placemark
        placemark.setStyleSelector(styleMap);

        // prepare point
        var point = earth.createPoint("");
        point.setAltitudeMode(earth.ALTITUDE_RELATIVE_TO_GROUND);
        point.setLatitude(building.lat);
        point.setLongitude(building.lng);
        point.setAltitude(0.0);

        // associate placemark with point
        placemark.setGeometry(point);

        // add placemark to Earth
        earth.getFeatures().appendChild(placemark);
        
        // my code add placement to PASSENGERS object
        PASSENGERS[i].placemark = placemark;

        // add marker to map
        var marker = new google.maps.Marker({
            icon: "https://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/man.png",
            map: map,
            position: new google.maps.LatLng(building.lat, building.lng),
            title: PASSENGERS[i].name + " at " + building.name
        });

        // TODO: remember passenger's placemark and marker for pick-up's sake
        
        PASSENGERS[i].lat = placemark.getGeometry().getLatitude();
        PASSENGERS[i].long = placemark.getGeometry().getLongitude();
        PASSENGERS[i].marker = marker;
    }
}

/**
 * Handler for Earth's viewchange event.
 */
function viewchange() 
{
    // keep map centered on shuttle's marker
    var latlng = new google.maps.LatLng(shuttle.position.latitude, shuttle.position.longitude);
    map.setCenter(latlng);
    bus.setPosition(latlng);
}

/**
 * Unloads Earth.
 */
function unload()
{
    google.earth.removeEventListener(earth.getView(), "viewchange", viewchange);
    google.earth.removeEventListener(earth, "frameend", frameend);
}
