// /* eslint-disable */
 export const displayMap = locations => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiZGVlcGFrOTgyNzkiLCJhIjoiY200dGkxNzY0MGJwOTJrcXg0ZGdram8yaSJ9.n3Hby5pusJIv4thJ6cCYnA';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/deepak98279/cm4tj0h5m001e01qv1mtkda3e',  
    zoom: 10,
    center: [-118.113491, 34.111745], 
    scrollZoom: false
  });
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
 
    const el = document.createElement('div');
    el.className = 'marker';


    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);


    new mapboxgl.Popup({
      offset: 30
    }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);


    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    },
    maxZoom: 15,
    duration: 2000 
  });
};

