mapboxgl.accessToken = mapToken;
var map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/streets-v11', // style URL
  center: listing.geometry.coordinates, // starting position [lng, lat]
  zoom: 13 // starting zoom
});

new mapboxgl.Marker()
  .setLngLat(listing.geometry.coordinates)
  .addTo(map);