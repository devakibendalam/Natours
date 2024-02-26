export const displayMap = (locations) => {
  // const locations = JSON.parse(document.getElementById('map').dataset.locations);
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZGV2YWtpYmVuZGFsYW0iLCJhIjoiY2xxamt2Z2kxMjc3dzJvbWt5MGtibjd1cSJ9.6AZEK1riAwj3rrcmqXvc3w';

  var map = new mapboxgl.Map({
    container: 'map', //HTML element ID where the map will be displayed
    //style: 'mapbox://styles/mapbox/streets-v11'
    style: 'mapbox://styles/devakibendalam/clqjlm26x00m701o90lgtercs',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false
  });

  // Create a new empty bounding box to contain all the markers
  const bounds = new mapboxgl.LngLatBounds();

  // Loop through each location in the 'locations' array
  locations.forEach((loc) => {
    // Create a marker element as a div
    const el = document.createElement('div');
    el.className = 'marker'; // Assign a CSS class 'marker' to the marker element

    // Add a marker to the map
    new mapboxgl.Marker({
      element: el, // HTML element representing the marker
      anchor: 'bottom', // Set the anchor point of the marker to the bottom
    })
      .setLngLat(loc.coordinates) // Set marker coordinates based on location
      .addTo(map); // Add the marker to the map

    // Create a popup for each location
    new mapboxgl.Popup({
      offset: 30, // Set the offset of the popup
    })
      .setLngLat(loc.coordinates) // Set popup coordinates based on location
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`) // Set popup content
      .addTo(map); // Add the popup to the map

    // Extend the map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  // Fit the map to the calculated bounds, adjusting the view with padding
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
