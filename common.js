const STORAGE_KEY = 'hotelBooking.hotels.v1';
const FLASH_KEY = 'hotelBooking.flash';
const TAB_PREFIX = 'hotelBooking:';

const STORAGE_NOTICE =
  'Your browser is not saving changes permanently (storage is blocked or full), so they only last ' +
  'while this tab stays open. Open the site with VS Code Live Server (or http://localhost) to keep them.';

const SAVE_FAILED_MESSAGE = 'Could not save that change - browser storage is blocked or full.';

let storageNotice = '';

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E" +
  "%3Crect width='800' height='600' fill='%23eeeeee'/%3E" +
  "%3Ctext x='400' y='305' text-anchor='middle' font-family='Arial,sans-serif' font-size='28' fill='%23666666'%3ENo image%3C/text%3E%3C/svg%3E";


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


function readLocal() {
  try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
}

function writeLocal(raw) {
  try {
    localStorage.setItem(STORAGE_KEY, raw);
    return localStorage.getItem(STORAGE_KEY) === raw;
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
    if (window.name && window.name.indexOf(TAB_PREFIX) !== 0) return false;
    return true;
  } catch (e) {
    return false;
  }
}

function parseStored(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return { savedAt: 0, hotels: data };
    if (data && Array.isArray(data.hotels)) {
      return { savedAt: Number(data.savedAt) || 0, hotels: data.hotels };
    }
  } catch (e) {  }
  return null;
}

function loadHotels() {
  const tabRaw = readTab();
  const local = parseStored(readLocal());
  const tab = parseStored(tabRaw);


  if (tab && (!local || tab.savedAt > local.savedAt)) {
    storageNotice = STORAGE_NOTICE;
    writeLocal(tabRaw);
    return tab.hotels;
  }
  if (local) return local.hotels;

  const seeded = SEED_HOTELS.map(function (h) { return Object.assign({}, h); });
  saveHotels(seeded);
  return seeded;
}


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

function restoreHotel(hotel, index) {
  const list = loadHotels();
  if (list.some(function (h) { return h.id === hotel.id; })) return true;
  list.splice(Math.min(Math.max(index, 0), list.length), 0, hotel);
  return saveHotels(list);
}


let footerTimer = null;

function hideFooterMessage() {
  const bar = document.getElementById('footer-msg');
  if (bar) bar.hidden = true;
  clearTimeout(footerTimer);
}

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
  bar.className = 'footer-msg' + (opts.type === 'error' || !text ? ' error' : '');
  bar.replaceChildren();

  const row = el('div', 'footer-row');
  row.appendChild(el('span', 'footer-text', message));

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


function checkStorage() {
  loadHotels();   // loading is what detects the problem
  if (storageNotice) showFooterMessage('');
}

function setFlash(flash) {
  try {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify(flash));
  } catch (e) {
    try { sessionStorage.setItem(FLASH_KEY, JSON.stringify({ text: flash.text })); } catch (e2) {}
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

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setImage(img, src) {
  img.onerror = function () {
    img.onerror = null;
    img.src = PLACEHOLDER_IMG;
  };
  img.src = src || PLACEHOLDER_IMG;
}
