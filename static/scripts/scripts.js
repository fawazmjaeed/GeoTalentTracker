// Initialize map
const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let markers = [];
let allData = [];

// Fetch data from server and render markers
fetch('/data')
  .then(res => res.json())
  .then(data => {
    allData = data;
    console.log("Loaded data:", allData);
    renderMarkers(allData);
    populateJobDropdown(allData);
  });

// Function to render markers
function renderMarkers(data) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const keyword = document.getElementById('searchInput').value.toLowerCase();
  const jobFilter = document.getElementById('jobFilter').value;

  data.forEach(item => {
    const matchesKeyword = item.job.toLowerCase().includes(keyword);
    const matchesJob = !jobFilter || item.job === jobFilter;

    if (matchesKeyword && matchesJob) {
      const marker = L.marker([item.lat, item.lon], {
  	icon: L.icon({
    	iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
    	iconSize: [32, 32]
  	})
	}).addTo(map);

// Tooltip showing job title (always visible)
marker.bindTooltip(item.job, { permanent: true, direction: 'right', offset: [10, 0] });

// Optional: Keep the full popup on click
marker.bindPopup(`
  <b>${item.job}</b><br>
  ${item.exp} years<br>
  <a href="${item.url}" target="_blank">Profile</a>
`);


      markers.push(marker);
    }
  });
}


// Dropdown population
function populateJobDropdown(data) {
  const jobSet = new Set(data.map(d => d.job));
  const jobFilter = document.getElementById('jobFilter');
  jobFilter.innerHTML = '<option value="">All Job Titles</option>';
  jobSet.forEach(job => {
    const option = document.createElement('option');
    option.value = job;
    option.text = job;
    jobFilter.add(option);
  });
}


// UI events
document.getElementById('searchInput').addEventListener('input', () => renderMarkers(allData));
document.getElementById('jobFilter').addEventListener('change', () => renderMarkers(allData));
document.getElementById('expSlider').addEventListener('input', () => {
  document.getElementById('expValue').textContent = document.getElementById('expSlider').value + "+";
  renderMarkers(allData);
});
document.getElementById('radiusInput').addEventListener('input', () => renderMarkers(allData));
map.on('moveend', () => renderMarkers(allData));

// Click map to open form
map.on('click', function (e) {
  const popup = L.popup()
    .setLatLng(e.latlng)
    .setContent(`
      <b>Add Profile</b><br>
      <input type="text" id="jobTitle" placeholder="Job Title"><br>
      <input type="number" id="yearsExp" placeholder="Years of Experience"><br>
      <input type="text" id="profileLink" placeholder="Profile URL"><br>
      <button onclick="submitData(${e.latlng.lat}, ${e.latlng.lng})">Submit</button>
    `)
    .openOn(map);
});

// Submit pin data
function submitData(lat, lon) {
  const job = document.getElementById('jobTitle').value;
  const exp = parseInt(document.getElementById('yearsExp').value);
  const url = document.getElementById('profileLink').value;

  if (!job || isNaN(exp) || !url) {
    alert("Please fill all fields correctly.");
    return;
  }

  fetch('/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon, job, exp, url })
  }).then(() => location.reload());
}

// Distance formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    0.5 - Math.cos(dLat)/2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    (1 - Math.cos(dLon)) / 2;

  return R * 2 * Math.asin(Math.sqrt(a));
}

// Locate Me functionality
document.getElementById('locateMe').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Center the map and place a temporary marker
    map.setView([lat, lon], 12);
    const marker = L.circleMarker([lat, lon], {
      radius: 8,
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5
    }).addTo(map).bindPopup("You're here! Click on the map to drop a pin.").openPopup();

    // Optional: remove the marker after a few seconds
    setTimeout(() => map.removeLayer(marker), 5000);
  }, () => {
    alert("Unable to retrieve your location.");
  });
});
