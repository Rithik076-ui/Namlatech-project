/* edithotel.js - one page for both "Add Hotel" and "Edit Hotel".
   edithotel.html            -> add mode
   edithotel.html?id=<id>    -> edit mode (fields are pre-filled) */

const form = document.getElementById('hotel-form');
const heading = document.getElementById('page-heading');
const notFound = document.getElementById('not-found');
const previewImg = document.getElementById('preview-img');
const imageInput = document.getElementById('image');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('description');
const latInput = document.getElementById('latitude');
const lonInput = document.getElementById('longitude');
const priceInput = document.getElementById('price');

const editId = getIdFromUrl();
let editing = null;      // the hotel being edited (null in add mode)
let currentImage = '';   // image path or data URL that will be saved

/* problems are shown in the footer, where they are always in view */
function showError(message) {
  showFooterMessage(message, { type: 'error', duration: 8000 });
}

/* Shrink the chosen picture so several hotels fit in browser storage */
function resizeImage(file, maxSize, quality) {
  return new Promise(function (resolve, reject) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';              // PNGs with transparency become white, not black
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error('Unreadable image'));
    };
    img.src = url;
  });
}

function init() {
  if (editId) {
    editing = getHotelById(editId);
    if (!editing) {
      form.hidden = true;
      heading.hidden = true;
      notFound.hidden = false;
      document.title = 'Hotel not found';
      return;
    }
    heading.textContent = 'Edit Hotel';
    document.title = 'Edit Hotel';
    titleInput.value = editing.title || '';
    descInput.value = editing.description || '';
    latInput.value = hasCoords(editing) ? editing.latitude : '';
    lonInput.value = hasCoords(editing) ? editing.longitude : '';
    priceInput.value = editing.price;
    currentImage = editing.image || '';
  }
  setImage(previewImg, currentImage);
}

imageInput.addEventListener('change', function () {
  const file = imageInput.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showError('Please choose an image file (JPG, PNG, WebP...).');
    imageInput.value = '';
    return;
  }

  resizeImage(file, 1000, 0.8)
    .then(function (dataUrl) {
      currentImage = dataUrl;
      previewImg.src = dataUrl;
    })
    .catch(function () {
      showError('That image could not be read. Please try a different file.');
      imageInput.value = '';
    });
});

form.addEventListener('submit', function (event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (!title) {
    showError('Please enter a title.');
    titleInput.focus();
    return;
  }

  const latRaw = latInput.value.trim();
  const lonRaw = lonInput.value.trim();
  if ((latRaw === '') !== (lonRaw === '')) {
    showError('Enter both latitude and longitude, or leave both empty.');
    return;
  }

  const hotel = {
    id: editing ? editing.id : newHotelId(),
    title: title,
    description: descInput.value.trim(),
    price: Number(priceInput.value),
    image: currentImage,
    latitude: latRaw === '' ? null : Number(latRaw),
    longitude: lonRaw === '' ? null : Number(lonRaw)
  };

  const list = loadHotels();
  if (editing) {
    const index = list.findIndex(function (h) { return h.id === editing.id; });
    if (index >= 0) list[index] = hotel; else list.unshift(hotel);
  } else {
    list.unshift(hotel);   // newest hotel appears first
  }

  if (!saveHotels(list)) {
    showError(SAVE_FAILED_MESSAGE + ' Try a smaller image.');
    return;
  }

  /* the home page shows this in its footer */
  setFlash({
    type: 'success',
    title: editing ? 'Updated successfully' : 'Added successfully',
    text: '“' + title + '” has been ' + (editing ? 'updated.' : 'added.')
  });
  window.location.href = 'index.html';
});

init();
checkStorage();
