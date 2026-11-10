/* common.js - data layer + small helpers shared by every page.
   Hotels are saved in the browser's localStorage, so add / edit / delete
   survive a page refresh. Load this file BEFORE the page's own script. */

const STORAGE_KEY = 'hotelBooking.hotels.v1';   // same key as before, so saved hotels are kept
const FLASH_KEY = 'hotelBooking.flash';         // one-time footer message passed to the next page
const TAB_PREFIX = 'hotelBooking:';             // marks our data inside window.name (see below)

const STORAGE_NOTICE =
  'Your browser is not saving changes permanently (storage is blocked or full), so they only last ' +
  'while this tab stays open. Open the site with VS Code Live Server (or http://localhost) to keep them.';

const SAVE_FAILED_MESSAGE = 'Could not save that change - browser storage is blocked or full.';

let storageNotice = '';   // set when the browser is not keeping localStorage

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E" +
  "%3Crect width='800' height='600' fill='%23eeeeee'/%3E" +
  "%3Ctext x='400' y='305' text-anchor='middle' font-family='Arial,sans-serif' font-size='28' fill='%23666666'%3ENo image%3C/text%3E%3C/svg%3E";

/* The hotels that were hard-coded in the old index.html.
   They are copied into storage the first time the site is opened. */
const SEED_HOTELS = [
  {
    id: 'seed-1',
    title: 'CJ Pallazzio Hotel',
    price: 4000,
    description: 'A family-friendly hotel that brings the best of Salem to your doorstep.',
    image: 'images/caption.jpg',
    latitude: null,
    longitude: null
  },
  {
    id: 'seed-2',
    title: 'Radisson Hotel',
    price: 20000,
    description: 'Radisson Salem is a stylish, upscale hotel with a socially conscious attitude and outstanding services.',
    image: 'images/radisson-salem.jpg',
    latitude: null,
    longitude: null
  },
  {
    id: 'seed-3',
    title: 'Grand Estancia',
    price: 10000,
    description: 'A family-friendly hotel that brings the best of Salem to your doorstep.',
    image: 'images/grand-estancia.jpg',
    latitude: null,
    longitude: null
  },
  {
    id: 'seed-4',
    title: 'Sivaraj Inn',
    price: 7000,
    description: 'Sivaraj Inn welcomes you to a world of hospitality filled with grand tradition.',
    image: 'images/sivaraj-holiday-inn.jpg',
    latitude: null,
    longitude: null
  },
  {
    id: 'seed-5',
    title: 'ZIBE Salem by GRT Hotels',
    price: 7000,
    description: 'A family-friendly hotel that brings the best of Salem to your doorstep.',
    image: 'images/superior-rooms.jpg',
    latitude: null,
    longitude: null
  },
  {
    id: 'seed-6',
    title: 'Hotel Windsor Castle',
    price: 8000,
    description: 'Hotel Windsor Castle is the finest heritage hotel in Salem.',
    image: 'images/facade-parking.jpg',
    latitude: null,
    longitude: null
  },
  {
    id: 'seed-7',
    title: 'Hotel Windsor Castle',
    price: 8000,
    description: 'Hotel Windsor Castle is the finest heritage hotel in Salem.',
    image: 'images/hotel elspano.jpg',
    latitude: null,
    longitude: null
  },
  {
    id: 'seed-8',
    title: 'Hotel Windsor Castle',
    price: 8000,
    description: 'Hotel Windsor Castle is the finest heritage hotel in Salem.',
    image: 'images/getlstd-property-photo.jpg',
    latitude: null,
    longitude: null
  }
];

/* ---------- storage ----------
   Every save goes to localStorage AND is mirrored into window.name.
   localStorage is the real storage. window.name only matters when the browser
   blocks localStorage or throws it away on refresh (some file:// pages and
   embedded previews do): it survives a refresh in the same tab, so a deleted
   hotel stays deleted, and the footer tells the person what is going on.
   Each save carries a timestamp, and the newest copy wins when the two differ. */

function readLocal() {
  try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
}

function writeLocal(raw) {
  try {
    localStorage.setItem(STORAGE_KEY, raw);
    return localStorage.getItem(STORAGE_KEY) === raw;   // make sure it really stuck
  } catch (e) {
    return false;
  }
}

function readTab() {
  try {
    const name = window.name || '';
    return name.indexOf(TAB_PREFIX) === 0 ? name.slice(TAB_PREFIX.length) : null;
  } catch (e) {
    return null;
  }
}

function writeTab(raw) {
  try {
    if (window.name && window.name.indexOf(TAB_PREFIX) !== 0) return false;   // belongs to something else
    window.name = TAB_PREFIX + raw;
    return true;
  } catch (e) {
    return false;
  }
}

/* accepts the current format {savedAt, hotels} and the older plain array */
function parseStored(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return { savedAt: 0, hotels: data };
    if (data && Array.isArray(data.hotels)) {
      return { savedAt: Number(data.savedAt) || 0, hotels: data.hotels };
    }
  } catch (e) { /* unreadable: treated as nothing saved */ }
  return null;
}

function loadHotels() {
  const tabRaw = readTab();
  const local = parseStored(readLocal());
  const tab = parseStored(tabRaw);

  /* the tab holds a newer copy than localStorage: the browser did not keep our last save */
  if (tab && (!local || tab.savedAt > local.savedAt)) {
    storageNotice = STORAGE_NOTICE;
    writeLocal(tabRaw);   // try to put the copy back
    return tab.hotels;
  }
  if (local) return local.hotels;

  /* nothing saved yet: first visit, copy the sample hotels in */
  const seeded = SEED_HOTELS.map(function (h) { return Object.assign({}, h); });
  saveHotels(seeded);
  return seeded;
}

/* returns true when the list was kept (permanently, or at least for this tab) */
function saveHotels(list) {
  const raw = JSON.stringify({ v: 2, savedAt: Date.now(), hotels: list });
  const savedLocal = writeLocal(raw);
  const savedTab = writeTab(raw);
  if (!savedLocal) storageNotice = STORAGE_NOTICE;
  return savedLocal || savedTab;
}

function getHotelById(id) {
  if (!id) return null;
  return loadHotels().find(function (h) { return h.id === id; }) || null;
}

function newHotelId() {
  return 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* Delete a hotel. Returns {hotel, index} so the delete can be undone,
   or null when nothing was deleted (an error is shown in the footer). */
function removeHotel(id) {
  const list = loadHotels();
  const index = list.findIndex(function (h) { return h.id === id; });
  if (index < 0) return null;

  const hotel = list[index];
  list.splice(index, 1);
  if (!saveHotels(list)) {
    showFooterMessage(SAVE_FAILED_MESSAGE, { type: 'error' });
    return null;
  }
  return { hotel: hotel, index: index };
}

/* Put a deleted hotel back where it was */
function restoreHotel(hotel, index) {
  const list = loadHotels();
  if (list.some(function (h) { return h.id === hotel.id; })) return true;
  list.splice(Math.min(Math.max(index, 0), list.length), 0, hotel);
  return saveHotels(list);
}

/* ---------- footer messages (replace browser popups) ---------- */

let footerTimer = null;

function hideFooterMessage() {
  const bar = document.getElementById('footer-msg');
  if (bar) bar.hidden = true;
  clearTimeout(footerTimer);
}

/* The pop-up at the bottom of the page (it replaces the browser's own pop-up boxes).
   options:
     type         'success' (green, with a check mark) or 'error' (red, with !); leave out for a plain dark message
     title        bold first line, e.g. 'Deleted successfully'
     actionLabel + onAction   a button such as Undo
     duration     ms before it hides (default 6000)     sticky   never auto-hide
   If the browser is not saving changes, that warning is added and the pop-up stays. */
function showFooterMessage(text, options) {
  const opts = options || {};
  let bar = document.getElementById('footer-msg');
  if (!bar) {
    bar = el('footer', 'footer-msg');
    bar.id = 'footer-msg';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    document.body.appendChild(bar);
  }

  const message = text || storageNotice;
  const type = !text ? 'error' : (opts.type || '');   // '' = plain, 'success' = green, 'error' = red
  bar.className = 'footer-msg' + (type ? ' ' + type : '');
  bar.replaceChildren();

  const row = el('div', 'footer-row');

  /* round icon: a check mark for success, ! for a problem */
  if (type === 'success' || type === 'error') {
    const icon = el('span', 'footer-icon', type === 'success' ? '✓' : '!');
    icon.setAttribute('aria-hidden', 'true');
    row.appendChild(icon);
  }

  const body = el('div', 'footer-body');
  if (opts.title) body.appendChild(el('strong', 'footer-title', opts.title));
  body.appendChild(el('span', 'footer-text', message));
  row.appendChild(body);

  if (opts.actionLabel && opts.onAction) {
    const action = el('button', 'footer-action', opts.actionLabel);
    action.type = 'button';
    action.addEventListener('click', function () {
      hideFooterMessage();
      opts.onAction();
    });
    row.appendChild(action);
  }

  const close = el('button', 'footer-close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Dismiss message');
  close.addEventListener('click', hideFooterMessage);
  row.appendChild(close);
  bar.appendChild(row);

  if (text && storageNotice) bar.appendChild(el('div', 'footer-notice', storageNotice));

  bar.hidden = false;
  clearTimeout(footerTimer);
  if (!opts.sticky && !storageNotice) {
    footerTimer = setTimeout(hideFooterMessage, opts.duration || 6000);
  }
}

/* Call once when a page loads: shows the warning if the browser is not keeping saved data */
function checkStorage() {
  loadHotels();   // loading is what detects the problem
  if (storageNotice) showFooterMessage('');
}

/* A message that should appear in the footer of the NEXT page (e.g. after Save or Delete) */
function setFlash(flash) {
  try {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify(flash));
  } catch (e) {
    try { sessionStorage.setItem(FLASH_KEY, JSON.stringify({ text: flash.text })); } catch (e2) { /* skip */ }
  }
}

function takeFlash() {
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(FLASH_KEY);
    const flash = JSON.parse(raw);
    return flash && typeof flash.text === 'string' ? flash : null;
  } catch (e) {
    return null;
  }
}

/* ---------- helpers ---------- */

function getIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

function formatPrice(value) {
  return '₹ ' + Number(value).toLocaleString('en-IN');
}

function hasCoords(hotel) {
  return hotel.latitude !== null && hotel.latitude !== '' &&
         hotel.longitude !== null && hotel.longitude !== '' &&
         Number.isFinite(Number(hotel.latitude)) &&
         Number.isFinite(Number(hotel.longitude));
}

/* create an element; text is added with textContent so user input is never run as HTML */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* set an image source, falling back to a grey placeholder if the file is missing */
function setImage(img, src) {
  img.onerror = function () {
    img.onerror = null;
    img.src = PLACEHOLDER_IMG;
  };
  img.src = src || PLACEHOLDER_IMG;
}
