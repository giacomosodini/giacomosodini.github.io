/* Builds the Talks-page map from the already-rendered list of talks:
   groups entries by the city the entry text ends with (matched against
   TALK_MAP_LOCATIONS) so the talks list itself stays the single source
   of truth; only new locations require an addition to _data/map_locations.yml */
window.addEventListener("load", function () {
  var mapDiv = document.getElementById("talks-map");
  if (!mapDiv || typeof L === "undefined" || typeof TALK_MAP_LOCATIONS === "undefined") {
    return;
  }

  var categoryColors = {
    "Invited Seminars": "#1f77b4",
    "Invited Conference Talks": "#d62728",
    "Contributed Talks": "#2ca02c",
  };

  var sortedCities = Object.keys(TALK_MAP_LOCATIONS).sort(function (a, b) {
    return b.length - a.length;
  });

  function findCity(text) {
    for (var i = 0; i < sortedCities.length; i++) {
      if (text.endsWith(sortedCities[i])) {
        return sortedCities[i];
      }
    }
    return null;
  }

  function parseDateKey(text) {
    var match = text.match(/^(\d{2})\.(\d{4})/);
    if (!match) return 0;
    return parseInt(match[2], 10) * 100 + parseInt(match[1], 10);
  }

  var article = mapDiv.closest("article") || document.querySelector("article");
  if (!article) return;

  var currentCategory = null;
  var byCity = {};

  Array.prototype.forEach.call(article.children, function (el) {
    if (/^H[1-6]$/.test(el.tagName)) {
      currentCategory = el.textContent.trim();
    } else if (el.tagName === "UL" && currentCategory && categoryColors[currentCategory]) {
      Array.prototype.forEach.call(el.querySelectorAll(":scope > li"), function (li) {
        var text = li.textContent.replace(/\s+/g, " ").trim();
        var city = findCity(text);
        if (!city) return;
        if (!byCity[city]) byCity[city] = [];
        byCity[city].push({ text: text, category: currentCategory, dateKey: parseDateKey(text) });
      });
    }
  });

  var cityKeys = Object.keys(byCity);
  if (cityKeys.length === 0) return;

  cityKeys.forEach(function (city) {
    byCity[city].sort(function (a, b) {
      return b.dateKey - a.dateKey;
    });
  });

  var minZoom = Math.ceil(Math.log2(mapDiv.clientWidth / 256));

  var map = L.map(mapDiv, {
    scrollWheelZoom: true,
    worldCopyJump: false,
    minZoom: minZoom,
    maxBounds: [
      [-85, -180],
      [85, 180],
    ],
    maxBoundsViscosity: 1.0,
  });
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 19,
    noWrap: true,
  }).addTo(map);

  var markers = [];
  cityKeys.forEach(function (city) {
    var coords = TALK_MAP_LOCATIONS[city];
    var entries = byCity[city];
    var color = categoryColors[entries[0].category];
    var popupHtml =
      "<strong>" +
      city +
      "</strong><ul style='padding-left:16px;margin:4px 0 0 0;'>" +
      entries
        .map(function (e) {
          return "<li>" + e.text + "</li>";
        })
        .join("") +
      "</ul>";
    var marker = L.circleMarker([coords[0], coords[1]], {
      radius: 6 + Math.min(entries.length, 6),
      fillColor: color,
      color: "#fff",
      weight: 1.5,
      fillOpacity: 0.85,
    })
      .addTo(map)
      .bindPopup(popupHtml, { maxWidth: 280 });
    markers.push(marker);
  });

  map.invalidateSize();
  var group = L.featureGroup(markers);
  map.fitBounds(group.getBounds().pad(0.2));
});
