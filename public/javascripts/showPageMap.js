mapboxgl.accessToken = mapToken;
var map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/yapzongxin/ckrnfc8e7c4mr17o5c6gai2ls',
  center: listing.geometry.coordinates, // starting position [lng, lat]
  zoom: 13 // starting zoom
});

map.addControl(new mapboxgl.NavigationControl());

new mapboxgl.Marker()
  .setLngLat(listing.geometry.coordinates)
  .addTo(map);

mapboxgl.accessToken = mapToken;
var map = new mapboxgl.Map({
  container: 'map1', // container ID
  style: 'mapbox://styles/yapzongxin/ckrnfc8e7c4mr17o5c6gai2ls',
  center: listing.geometry.coordinates, // starting position [lng, lat]
  zoom: 13 // starting zoom
});

map.addControl(new mapboxgl.NavigationControl());

new mapboxgl.Marker()
  .setLngLat(listing.geometry.coordinates)
  .addTo(map);