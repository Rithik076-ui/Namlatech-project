
const grid = document.getElementById('hotel-grid');
const emptyMsg = document.getElementById('empty-msg');
const searchInput = document.getElementById('search-bar');
const searchButton = document.getElementById('search-button');

const filterButton = document.getElementById('filter-button');
const filterPanel = document.getElementById('filter-panel');
const minInput = document.getElementById('min-price');
const maxInput = document.getElementById('max-price');
const filterHint = document.getElementById('filter-hint');
const filterClear = document.getElementById('filter-clear');
const filterSummary = document.getElementById('filter-summary');
const filterSummaryText = document.getElementById('filter-summary-text');
const filterSummaryClear = document.getElementById('filter-summary-clear');

let minPrice = null;
let maxPrice = null;

function buildCard(hotel) {
  const detailsUrl = 'hotel.html?id=' + encodeURIComponent(hotel.id);
  const editUrl = 'edithotel.html?id=' + encodeURIComponent(hotel.id);

  const card = el('div', 'hotels-preview');


  const imgLink = el('a', 'img-link');
  imgLink.href = detailsUrl;
  imgLink.setAttribute('aria-label', 'View details of ' + hotel.title);
  const img = el('img', 'hotelimg');
  img.alt = hotel.title;
  img.loading = 'lazy';
  setImage(img, hotel.image);
  imgLink.appendChild(img);

  const info = el('div', 'hotel-info');


  const title = el('a', 'hotel-title', hotel.title);
  title.href = detailsUrl;

  const stay = el('p', 'stayinfo');
  stay.appendChild(el('span', '', formatPrice(hotel.price)));
  stay.firstChild.style.fontWeight = '700';
  stay.appendChild(document.createTextNode(' per night'));

  const descr = el('p', 'hotel-descr', hotel.description || '');

  const buttons = el('div', 'buttons');
  const edit = el('a', 'edit', 'Edit');
  edit.href = editUrl;
  const del = el('button', 'delete', 'Delete');
  del.type = 'button';
  del.dataset.id = hotel.id;
  buttons.append(edit, del);

  info.append(title, stay, descr, buttons);
  card.append(imgLink, info);
  return card;
}


function priceFilterActive() {
  return minPrice !== null || maxPrice !== null;
}

function priceRangeText() {
  if (minPrice !== null && maxPrice !== null) {
    return formatPrice(minPrice) + ' – ' + formatPrice(maxPrice);
  }
  if (minPrice !== null) return formatPrice(minPrice) + ' and above';
  return 'up to ' + formatPrice(maxPrice);
}

function parsePrice(text) {
  const t = String(text).trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function noMatchText(typed) {
  if (typed && priceFilterActive()) {
    return 'No hotels match “' + typed + '” in this price range.';
  }
  if (priceFilterActive()) return 'No hotels in this price range.';
  return 'No hotels match “' + typed + '”.';
}

function renderFilterState(shownCount, totalCount) {
  const active = priceFilterActive();
  filterButton.classList.toggle('active', active);
  filterButton.setAttribute('aria-label',
    active ? 'Filter by price (on: ' + priceRangeText() + ')' : 'Filter by price');
  filterSummary.hidden = !active;
  if (active) {
    filterSummaryText.textContent = 'Price per night: ' + priceRangeText() + ' · ' +
      shownCount + ' of ' + totalCount + (totalCount === 1 ? ' hotel' : ' hotels');
  }
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const all = loadHotels();

  const shown = all.filter(function (h) {
    if (query && !String(h.title).toLowerCase().includes(query)) return false;
    if (priceFilterActive()) {
      const price = Number(h.price);
      if (!Number.isFinite(price)) return false;
      if (minPrice !== null && price < minPrice) return false;
      if (maxPrice !== null && price > maxPrice) return false;
    }
    return true;
  });

  grid.replaceChildren.apply(grid, shown.map(buildCard));

  if (all.length === 0) {
    emptyMsg.textContent = 'No hotels yet. Click “Add Hotel” to add one.';
    emptyMsg.hidden = false;
  } else if (shown.length === 0) {
    emptyMsg.textContent = noMatchText(searchInput.value.trim());
    emptyMsg.hidden = false;
  } else {
    emptyMsg.hidden = true;
  }

  renderFilterState(shown.length, all.length);
}

function openFilter() {
  minInput.value = minPrice === null ? '' : minPrice;
  maxInput.value = maxPrice === null ? '' : maxPrice;

  const prices = loadHotels()
    .map(function (h) { return Number(h.price); })
    .filter(function (n) { return Number.isFinite(n); });
  filterHint.textContent = prices.length
    ? 'Hotels here cost ' + formatPrice(Math.min.apply(null, prices)) + ' – ' +
      formatPrice(Math.max.apply(null, prices)) + ' per night.'
    : '';

  filterPanel.hidden = false;
  filterButton.setAttribute('aria-expanded', 'true');
  minInput.focus();
}

function closeFilter(returnFocus) {
  filterPanel.hidden = true;
  filterButton.setAttribute('aria-expanded', 'false');
  if (returnFocus) filterButton.focus();
}

function clearPriceFilter() {
  minPrice = null;
  maxPrice = null;
  render();
}

filterButton.addEventListener('click', function () {
  if (filterPanel.hidden) openFilter(); else closeFilter(false);
});

filterPanel.addEventListener('submit', function (event) {
  event.preventDefault();

  const min = parsePrice(minInput.value);
  const max = parsePrice(maxInput.value);
  const typedJunk = minInput.validity.badInput || maxInput.validity.badInput;

  if (typedJunk || min === undefined || max === undefined) {
    showFooterMessage('Enter prices as numbers, 0 or more.', { type: 'error' });
    return;
  }
  if (min !== null && max !== null && min > max) {
    showFooterMessage('The minimum price cannot be higher than the maximum.', { type: 'error' });
    return;
  }

  minPrice = min;
  maxPrice = max;
  closeFilter(true);
  render();
});

filterClear.addEventListener('click', function () {
  minInput.value = '';
  maxInput.value = '';
  clearPriceFilter();
  minInput.focus();
});

filterSummaryClear.addEventListener('click', clearPriceFilter);

document.addEventListener('click', function (event) {
  if (filterPanel.hidden) return;
  if (filterPanel.contains(event.target) || filterButton.contains(event.target)) return;
  closeFilter(false);
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && !filterPanel.hidden) closeFilter(true);
});

function showDeleted(removed) {
  showFooterMessage('“' + removed.hotel.title + '” has been removed.', {
    type: 'success',
    title: 'Deleted successfully',
    actionLabel: 'Undo',
    onAction: function () { undoRemove(removed); },
    duration: 8000
  });
}

function undoRemove(removed) {
  if (restoreHotel(removed.hotel, removed.index)) {
    render();
    showFooterMessage('“' + removed.hotel.title + '” is back in the list.', {
      type: 'success',
      title: 'Restored successfully'
    });
  } else {
    showFooterMessage(SAVE_FAILED_MESSAGE, { type: 'error' });
  }
}


grid.addEventListener('click', function (event) {
  const button = event.target.closest('.delete');
  if (!button) return;

  const removed = removeHotel(button.dataset.id);
  if (!removed) return;

  render();
  showDeleted(removed);
});

searchInput.addEventListener('input', render);
searchButton.addEventListener('click', render);

render();

const flash = takeFlash();
if (flash) {
  const undo = flash.undo;
  if (undo && undo.hotel && typeof undo.index === 'number') {
    showDeleted(undo);
  } else {
    showFooterMessage(flash.text, { type: flash.type, title: flash.title });
  }
} else {
  checkStorage();
}
