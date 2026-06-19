const state = {
  pixelId: '',
  purchaseValue: 1,
  purchaseCurrency: 'MYR'
};

const whatsappUrl = 'https://minatmohonloan.wasap.my';
const socialProofMessages = [
  'Pinjaman peribadi RM 5,000 dari Selangor telah diluluskan sebentar tadi',
  'Pinjaman perniagaan RM 12,000 dari Kuala Lumpur sedang disemak oleh perunding kami',
  'Permohonan pinjaman RM 3,000 telah berjaya dihantar'
];

function eventId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomUUID()}`;
}

function loadPixel(pixelId) {
  if (!pixelId || pixelId === 'your_meta_pixel_id') return;
  if (window.fbq && window.fbq.loaded) return;

  window.fbq = window.fbq || function fbqProxy() {
    window.fbq.callMethod
      ? window.fbq.callMethod.apply(window.fbq, arguments)
      : window.fbq.queue.push(arguments);
  };
  if (!window._fbq) window._fbq = window.fbq;
  window.fbq.push = window.fbq;
  window.fbq.loaded = true;
  window.fbq.version = '2.0';
  window.fbq.queue = [];

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', pixelId);
}

async function sendCapi(payload) {
  return fetch('/api/meta-capi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

async function trackViewContent() {
  const id = eventId('vc');
  if (window.fbq) {
    window.fbq('track', 'ViewContent', {}, { eventID: id });
  }

  await sendCapi({
    event_name: 'ViewContent',
    event_id: id,
    event_source_url: window.location.href
  });
}

async function trackPurchase(user) {
  const id = eventId('purchase');
  const customData = {
    value: state.purchaseValue,
    currency: state.purchaseCurrency
  };

  if (window.fbq) {
    window.fbq('track', 'Purchase', customData, { eventID: id });
  }

  return sendCapi({
    event_name: 'Purchase',
    event_id: id,
    event_source_url: window.location.href,
    user,
    custom_data: customData
  });
}

async function boot() {
  const config = await fetch('/api/config').then((response) => response.json());
  Object.assign(state, config);
  loadPixel(state.pixelId);
  await trackViewContent();
}

document.getElementById('purchaseForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = document.getElementById('submitButton');
  const status = document.getElementById('status');

  if (!form.reportValidity()) return;

  const data = new FormData(form);
  button.disabled = true;
  status.textContent = 'Sedang menghantar...';

  try {
    const response = await trackPurchase({
      fullName: data.get('fullName'),
      phone: data.get('phone'),
      loanAmount: data.get('loanAmount'),
      state: data.get('state')
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok || result.skipped) {
      throw new Error(result.message || 'Submission failed.');
    }

  } catch (error) {
    console.error('Submission tracking failed:', error);
  } finally {
    status.textContent = 'Permohonan dihantar. Sedang membuka WhatsApp...';
    window.location.href = whatsappUrl;
    button.disabled = false;
  }
});

boot().catch(() => {
  document.getElementById('status').textContent = 'Konfigurasi tracking tidak dapat dimuatkan.';
});

function startSocialProof() {
  const toast = document.getElementById('socialProof');
  const text = document.getElementById('socialProofText');
  if (!toast || !text) return;

  let index = Math.floor(Math.random() * socialProofMessages.length);

  function showNext() {
    text.textContent = socialProofMessages[index];
    toast.classList.add('is-visible');
    window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 5200);
    index = (index + 1) % socialProofMessages.length;
  }

  window.setTimeout(showNext, 1800);
  window.setInterval(showNext, 7600);
}

startSocialProof();
