let map = L.map('map').setView([20, 0], 2);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

// Icons
const defaultIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

const highlightIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

let markers = [];

function addMarker(entry, highlight = false) {
    const icon = highlight ? highlightIcon : defaultIcon;
    const marker = L.marker([entry.lat, entry.lon], { icon }).addTo(map);
    marker.bindPopup(
        `<b>${entry.job}</b><br>${entry.exp} years<br><a href="${entry.url}" target="_blank">Profile</a>`
    );
    markers.push({ marker, entry });
}

// Fetch existing pins
fetch('/data')
    .then(res => res.json())
    .then(data => {
        data.forEach(entry => addMarker(entry));
    });

// Add marker on click
map.on('click', function (e) {
    const job = prompt("Enter Job Title:");
    if (!job) return;

    const exp = prompt("Enter Years of Experience:");
    if (!exp || isNaN(exp)) {
        alert("Please enter a valid number.");
        return;
    }

    const url = prompt("Enter Resume or Profile URL:");
    if (!url) return;

    const newEntry = {
        lat: e.latlng.lat,
        lon: e.latlng.lng,
        job: job,
        exp: parseInt(exp),
        url: url
    };

    fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            addMarker(newEntry);
            alert("Profile saved!");
        }
    });
});

// 🔍 Filter logic
document.getElementById('searchBtn').addEventListener('click', function () {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const minExp = parseInt(document.getElementById('minExp').value);
    const maxExp = parseInt(document.getElementById('maxExp').value);

    markers.forEach(({ marker, entry }) => {
        const matchesKeyword = entry.job.toLowerCase().includes(keyword);
        const withinExp = entry.exp >= minExp && entry.exp <= maxExp;

        if (matchesKeyword && withinExp) {
            marker.setIcon(highlightIcon);
        } else {
            marker.setIcon(defaultIcon);
        }
    });
});

// 📍 Location-aware search (100km radius from center)
document.getElementById('nearbyBtn').addEventListener('click', function () {
    const center = map.getCenter();

    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in km
        const toRad = angle => angle * (Math.PI / 180);
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    markers.forEach(({ marker, entry }) => {
        const distance = haversineDistance(center.lat, center.lng, entry.lat, entry.lon);
        if (distance <= 100) {
            marker.setIcon(highlightIcon);
        } else {
            marker.setIcon(defaultIcon);
        }
    });
});
