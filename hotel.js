const main = document.getElementById('details');
const hotel = getHotelById(getIdFromUrl());

function showNotFound() {
  document.title = 'Hotel not found';
  const back = el('a', 'back-link', '← Back to all hotels');
  back.href = 'index.html';
  main.append(el('p', 'empty-msg', 'Hotel not found. It may have been deleted.'), back);
}

function buildMap(h) {
  const lat = Number(h.latitude);
  const lon = Number(h.longitude);
  const box = [lon - 0.01, lat - 0.006, lon + 0.01, lat + 0.006]
    .map(function (n) { return n.toFixed(6); })
    .join('%2C');

  const section = el('section', 'details-location');
  section.appendChild(el('h2', 'details-section-title', 'Location'));
  section.appendChild(el('p', 'details-coords', 'Latitude ' + lat + ', Longitude ' + lon));

  const map = el('iframe', 'details-map');
  map.title = 'Map showing ' + h.title;
  map.loading = 'lazy';
  map.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + box +
            '&layer=mapnik&marker=' + lat.toFixed(6) + '%2C' + lon.toFixed(6);
  section.appendChild(map);

  const link = el('a', 'map-link', 'Open in Google Maps');
  link.href = 'https://www.google.com/maps?q=' + lat + ',' + lon;
  link.target = '_blank';
  link.rel = 'noopener';
  section.appendChild(link);

  return section;
}

function render(h) {
  document.title = h.title + ' - Hotel Booking';

  const card = el('article', 'details-card');

  const img = el('img', 'details-img');
  img.alt = h.title;
  setImage(img, h.image);

  const body = el('div', 'details-body');
  body.appendChild(el('h1', 'details-title', h.title));

  const price = el('p', 'details-price');
  price.appendChild(el('strong', '', formatPrice(h.price)));
  price.appendChild(document.createTextNode(' per night'));
  body.appendChild(price);

  body.appendChild(el('p', 'details-descr', h.description || 'No description added yet.'));

  if (hasCoords(h)) body.appendChild(buildMap(h));

  const actions = el('div', 'details-actions');
  const edit = el('a', 'edit', 'Edit');
  edit.href = 'edithotel.html?id=' + encodeURIComponent(h.id);
  const del = el('button', 'delete', 'Delete');
  del.type = 'button';
  del.addEventListener('click', function () {
    const removed = removeHotel(h.id);
    if (!removed) return;
    setFlash({ type: 'success', title: 'Deleted successfully', text: '“' + h.title + '” has been removed.', undo: removed });
    window.location.href = 'index.html';
  });
  actions.append(edit, del);
  body.appendChild(actions);

  card.append(img, body);
  main.appendChild(card);
}

if (hotel) render(hotel); else showNotFound();
checkStorage();
