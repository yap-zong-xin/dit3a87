mapboxgl.accessToken = mapToken;
var map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/yapzongxin/ckqky44ku0chw18nv3buheltf',
  center: listing.geometry.coordinates, // starting position [lng, lat]
  zoom: 13 // starting zoom
});

map.addControl(new mapboxgl.NavigationControl());

new mapboxgl.Marker()
  .setLngLat(listing.geometry.coordinates)
  .addTo(map);