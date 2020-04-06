// Main file
OrbitControls = THREE.OrbitControls; // Set Orbit Controls

// Get location and timing data from:
// https://raw.githubusercontent.com/open-covid-19/data/master/output/data_minimal.csv
let cases = fetch("/data/covid-countries.json")

// LatLong countries data from:
// https://gist.githubusercontent.com/sindresorhus/1341699/raw/84704529d9ee4965df2cddc55e5f2bc3dc686950/countrycode-latlong-array.json
let countries = fetch("/data/countrycode-latlong-array.json")

Promise.all([cases, countries])
  .then( values => Promise.all([values[0].json(),values[1].json()]))
  .then( data => init(data[0], data[1]) )

const gData = [];

// Once the JSON is loaded, load the first 10,000 points
const init = function(points, countries) {
  points = points.filter(e => e.date == "2020-04-06");

  console.log('Number of points:', points.length, points) // how many are there?
  console.log('Number of countries:', countries.length, countries) // how many are there?

  points.forEach(point => {
    const geo = countries[point.key.toLowerCase()]
    if(geo) {
      point.lat = geo[0]
      point.lng = geo[1]
      point.size = 2
      point.size = point.confirmed / 100000
      // point.color = 0x992200;
      point.color = new THREE.Color("hsl("+ (80 - point.size * 20 ) +", 70%, 50%)").getHex(); // 0x662200
      gData.push(point)
    }
  })

  Globe
    .pointsData(gData)
    .pointColor('color')
    .pointResolution(8) // reduce resolution for speed
    .pointRadius(0.5) // in angular degree
    .pointAltitude('size')
    .labelColor('color')

  // Globe
  //   .labelsData(gData)
  //   .labelText(d => d.key)
  //   .labelSize(2)

}


// instanciate globe
const Globe = new ThreeGlobe()
  .globeImageUrl('/data/earth-night.jpg') // an old map of the world

// Setup renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('globe').appendChild(renderer.domElement);

// Setup scene
const scene = new THREE.Scene();
scene.add(Globe);
scene.add(new THREE.AmbientLight(0xbbbbbb));
scene.add(new THREE.DirectionalLight(0xffbbbb, 0.6));
// scene.add(new THREE.DirectionalLight(0xff0000, 0.4).position.set(0,0,-10));

// Setup camera
const camera = new THREE.PerspectiveCamera();
camera.aspect = window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();
camera.position.z = 500;

// Add camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set( 0, 2, 0 );
controls.update();

// TODO: Load HDR Map
// hdrMap = new WebGLCubeRenderTarget();
// pmremGenerator = new THREE.PMREMGenerator( renderer );

// Raycaster for object selection
const raycaster = new THREE.Raycaster(); // create once
const mouse = new THREE.Vector2(); // create once

const theater = document.getElementById('theater');
const currentObject = {};

// handle cursor movement
document.addEventListener('mousemove', handleCursor, false);
function handleCursor(event) {
  // event.preventDefault();

  mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

  raycaster.setFromCamera( mouse, camera );

  var intersects = raycaster.intersectObjects(scene.children, true); // Circle element which you want to identify

  if (intersects.length > 0 && intersects[0].object.__globeObjType === "point") {
    for(const key of ['key', 'confirmed', 'date'] ) {
      currentObject[key] = intersects[0].object.__data[key];
    }
    console.log(currentObject)
    updateCurrent()
  }
}

function updateCurrent() {
  theater.innerHTML = countryCodes.filter(e => e.code === currentObject.key)[0].name
    // + " [" + (currentObject.key) + ']' +
    + " <br> "
    + " <strong>" + currentObject.confirmed + "</strong> confirmed cases"
    + " <br> "
    + Date.parse(currentObject.date).toString("dddd d MMMM")
  ;
}

// Kick-off renderer
(function animate() { // IIFE
  // Frame cycle
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
})();
