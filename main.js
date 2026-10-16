$(document).ready(function () {
  
//center Leaflet map on San Diego's coordinates
  const map = L.map("map").setView([32.7157, -117.1611], 11);

//load map image tiles from OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

//measure curved distance over the surface of the Earth
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRadians = function (degrees) {
      return (degrees * Math.PI) / 180;
    };

    const earthRadiusMiles = 3958.8; // Approximate radius of Earth in miles
    const latDifference = toRadians(lat2 - lat1);
    const lonDifference = toRadians(lon2 - lon1);
//spherical distance formula
    const a =
      Math.sin(latDifference / 2) * Math.sin(latDifference / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(lonDifference / 2) *
        Math.sin(lonDifference / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//multiply the angle by Earth's radius to get miles
    return earthRadiusMiles * c;
  }
  function renderSpots(spots, userLocation) {
    $("#top-spots-table").empty();

//loop through every single spot in the list
    spots.forEach(function (spot) {
      const spotLat = spot.location[0];
      const spotLon = spot.location[1];

//drop a pin on the map for eaach location
      const marker = L.marker([spotLat, spotLon]).addTo(map);

//show spot name and description when hovering over the pin
      marker.bindTooltip(
        `<strong>${spot.name}</strong><br>${spot.description}`
      );

//default settings if user coordinates are disabled
      let mapUrl = `https://www.google.com/maps?q=${spotLat},${spotLon}`;
      let distanceText = "N/A";
      let buttonText = "Open in Google Maps";

//calculate directions and mileage if user's location enabled
      if (userLocation) {
//Google Maps directions link build: from user position to the spot
        mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lon}&destination=${spotLat},${spotLon}`;
        distanceText = `${spot.distance.toFixed(1)} mi`;
        buttonText = "Get Directions";
      }

//build the table row with data variables
      const row = `
        <tr>
          <td>${spot.name}</td>
          <td>${spot.description}</td>
          <td><strong>${distanceText}</strong></td>
          <td>
            <a href="${mapUrl}" target="_blank" class="btn btn-primary btn-sm">
              ${buttonText}
            </a>
          </td>
        </tr>
      `;

//add new row to the end of the table
      $("#top-spots-table").append(row);
    });
  }

  $.getJSON("data.json", function (data) {
    
//check if the user's browser supports location tracking
    if (navigator.geolocation) {
//ask the user for permission to get their current coordinates
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
//calculate and store the distance on each spot object
          data.forEach(function (spot) {
            spot.distance = calculateDistance(
              userLocation.lat,
              userLocation.lon,
              spot.location[0],
              spot.location[1]
            );
          });

//sort the array from shortest distance to longest distance
          data.sort(function (a, b) {
            return a.distance - b.distance;
          });

//draw the sorted table and map pins with directions
          renderSpots(data, userLocation);
        },
//user clicked "Don't Allow" or location failed
        function () {
//still show the table and pins, but without distance calculations
          renderSpots(data, null);
        }
      );
    } else {
//browser doesn't support geolocation at all
      renderSpots(data, null);
    }
  });
});