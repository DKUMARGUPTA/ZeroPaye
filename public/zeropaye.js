/*!
 * ZeroPaye Checkout SDK v4.0.0
 * https://github.com/DKUMARGUPTA/ZeroPaye
 *
 * Zero • Empowering • Reliable • Open • Payé
 * Bharat ka apna 100% open-source, zero-fee UPI payment gateway.
 *
 * Usage (declarative — zero JS required):
 *   <script src="https://pay.yourdomain.com/zeropaye.js"
 *           data-zeropaye-key="zp_your_public_api_key"
 *           data-currency="INR"></script>
 *   <button data-zeropaye-pay data-order-id="ORDER-1001" data-amount="499.00">
 *     Buy Now with ZeroPaye
 *   </button>
 *
 * Usage (programmatic — React/Vue/Next.js):
 *   window.ZeroPaye.pay({
 *     order_id: 'ORDER-1001', amount: 499.00, currency: 'INR',
 *     name: 'Acme Store', description: 'Pro plan',
 *     handler: (res) => console.log('UTR:', res.utr),
 *     onClose: () => console.log('closed')
 *   });
 *
 * License: AGPL-3.0-or-later
 */
(function () {
  "use strict";

  if (window.ZeroPaye && window.ZeroPaye._loaded) return;

  // --- Config from script tag attributes ---
  var SDK_SCRIPT =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();
  var DEFAULT_PUBLIC_KEY = SDK_SCRIPT.getAttribute("data-zeropaye-key") || "";
  var DEFAULT_CURRENCY = (SDK_SCRIPT.getAttribute("data-currency") || "INR").toUpperCase();
  // API base URL = origin of the SDK script (e.g. https://pay.yourdomain.com)
  var API_BASE = (function () {
    if (SDK_SCRIPT.src) {
      try {
        return new URL(SDK_SCRIPT.src).origin;
      } catch (e) {}
    }
    // Fallback: same origin
    return window.location.origin;
  })();

  // --- Utilities ---
  function setEl(el, attrs) {
    for (var k in attrs) {
      if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
    }
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function validateAmount(amount) {
    var a = parseFloat(amount);
    if (!isFinite(a) || a < 1) throw new Error("amount must be a valid number >= 1");
    return a;
  }
  function validateOrderId(id) {
    var s = String(id || "");
    if (!s) throw new Error("order_id is required");
    if (!/^[a-zA-Z0-9_-]{1,35}$/.test(s)) throw new Error("order_id must be 1-35 chars alnum/dash/underscore");
    return s;
  }

  // --- Modal styling (scoped, doesn't leak to host page) ---
  var MODAL_STYLES = [
    "#zp-modal-overlay {",
    "  position: fixed; inset: 0; z-index: 2147483647;",
    "  background: rgba(15, 23, 42, 0.75);",
    "  display: flex; align-items: center; justify-content: center;",
    "  padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;",
    "  animation: zp-fade-in 0.2s ease-out;",
    "}",
    "#zp-modal {",
    "  background: #ffffff; border-radius: 20px; width: 100%; max-width: 420px;",
    "  max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;",
    "  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);",
    "  animation: zp-slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);",
    "}",
    "#zp-modal-header {",
    "  display: flex; align-items: center; justify-content: space-between;",
    "  padding: 16px 20px; border-bottom: 1px solid #e2e8f0;",
    "}",
    "#zp-modal-title { font-size: 16px; font-weight: 700; color: #0f172a; }",
    "#zp-modal-close {",
    "  background: transparent; border: 0; cursor: pointer; padding: 4px;",
    "  color: #64748b; font-size: 24px; line-height: 1;",
    "}",
    "#zp-modal-close:hover { color: #0f172a; }",
    "#zp-modal-body {",
    "  flex: 1; overflow-y: auto; padding: 20px;",
    "}",
    "#zp-modal-iframe { width: 100%; height: 100%; border: 0; min-height: 480px; }",
    "#zp-loading {",
    "  display: flex; align-items: center; justify-content: center; min-height: 200px;",
    "  color: #64748b; font-size: 14px;",
    "}",
    "#zp-spinner {",
    "  width: 32px; height: 32px; border: 3px solid #e2e8f0;",
    "  border-top-color: #0d9488; border-radius: 50%;",
    "  animation: zp-spin 0.8s linear infinite; margin-right: 12px;",
    "}",
    "@keyframes zp-fade-in { from { opacity: 0 } to { opacity: 1 } }",
    "@keyframes zp-slide-up { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }",
    "@keyframes zp-slide-up { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }",
    "@keyframes zp-spin { to { transform: rotate(360deg) } }",
    "@media (max-width: 640px) {",
    "  #zp-modal { max-width: 100%; max-height: 100vh; border-radius: 16px 16px 0 0; align-self: flex-end; }",
    "  #zp-modal-overlay { align-items: flex-end; padding: 0; }",
    "}",
  ].join("\n");

  function injectStyles() {
    if (document.getElementById("zp-styles")) return;
    var style = document.createElement("style");
    style.id = "zp-styles";
    style.textContent = MODAL_STYLES;
    document.head.appendChild(style);
  }

  // --- Modal lifecycle ---
  var currentModal = null;

  function closeModal(result) {
    if (!currentModal) return;
    // v3.0 fix: save refs before nulling (was: onClose/handler never fired)
    var overlay = currentModal.overlay;
    var iframe = currentModal.iframe;
    var savedOnClose = currentModal.onClose;
    var savedHandler = currentModal.handler;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage({ event: "zeropaye.request_cancel" }, "*");
      } catch (e) {}
    }
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    currentModal = null;
    document.body.style.overflow = "";
    if (savedOnClose) savedOnClose();
    if (result && savedHandler) savedHandler(result);
  }

  function openModal(opts) {
    injectStyles();
    closeModal(); // close any existing

    var overlay = document.createElement("div");
    overlay.id = "zp-modal-overlay";

    var modal = document.createElement("div");
    modal.id = "zp-modal";

    var header = document.createElement("div");
    header.id = "zp-modal-header";
    var title = document.createElement("div");
    title.id = "zp-modal-title";
    title.textContent = opts.name || "ZeroPaye Checkout";
    var closeBtn = document.createElement("button");
    closeBtn.id = "zp-modal-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = function () { closeModal(); };
    header.appendChild(title);
    header.appendChild(closeBtn);

    var body = document.createElement("div");
    body.id = "zp-modal-body";
    var loading = document.createElement("div");
    loading.id = "zp-loading";
    loading.innerHTML = '<div id="zp-spinner"></div>Loading checkout...';
    body.appendChild(loading);

    var iframe = document.createElement("iframe");
    iframe.id = "zp-modal-iframe";
    iframe.setAttribute("aria-label", "ZeroPaye checkout");
    iframe.style.display = "none";
    iframe.onload = function () {
      loading.style.display = "none";
      iframe.style.display = "block";
    };
    body.appendChild(iframe);

    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    currentModal = {
      overlay: overlay,
      iframe: iframe,
      handler: opts.handler,
      onClose: opts.onClose,
    };

    // Create checkout session then load iframe
    createSession(opts, function (session) {
      if (!session) {
        loading.innerHTML = '<div style="color:#dc2626;font-size:14px;text-align:center;padding:20px">Failed to create checkout session. Please try again.</div>';
        return;
      }
      // Load the hosted checkout page inside iframe
      iframe.src = API_BASE + "/checkout/" + session.id;
    });

    // Close on backdrop click (but not on modal content click)
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });

    // Close on Escape key
    document.addEventListener("keydown", function escHandler(e) {
      if (e.key === "Escape" && currentModal) {
        closeModal();
        document.removeEventListener("keydown", escHandler);
      }
    });
  }

  function createSession(opts, callback) {
    var orderId, amount;
    try {
      orderId = validateOrderId(opts.order_id || opts.orderId);
      amount = validateAmount(opts.amount);
    } catch (e) {
      console.error("[ZeroPaye]", e.message);
      callback(null);
      return;
    }
    var body = JSON.stringify({
      orderId: orderId,
      amount: amount,
      currency: opts.currency || DEFAULT_CURRENCY,
      description: opts.description || "",
      customerName: opts.customerName || opts.name || "",
      publicApiKey: opts.key || DEFAULT_PUBLIC_KEY,
    });
    var xhr = new XMLHttpRequest();
    xhr.open("POST", API_BASE + "/api/zeropaye/session", true);
    xhr.setRequestHeader("content-type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      try {
        var data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.session) {
          callback(data.session);
        } else {
          console.error("[ZeroPaye] session create failed:", data.error || xhr.statusText);
          callback(null);
        }
      } catch (e) {
        console.error("[ZeroPaye] parse error:", e);
        callback(null);
      }
    };
    xhr.send(body);
  }

  // --- PostMessage handler (receive events from iframe) ---
  window.addEventListener("message", function (e) {
    if (!e.data || typeof e.data !== "object") return;
    if (!e.data.event || e.data.event.indexOf("zeropaye:") !== 0) return;
    // v3.0 C7 fix: validate e.origin against API_BASE (was "*", anyone could fake success)
    if (e.origin !== API_BASE && e.origin !== new URL(API_BASE).origin) return;
    var ev = e.data.event;
    var detail = e.data.detail || {};
    if (!currentModal) return;
    switch (ev) {
      case "zeropaye:payment:success":
        if (currentModal.handler) currentModal.handler(detail);
        closeModal(detail);
        break;
      case "zeropaye:payment:failed":
      case "zeropaye:payment:expired":
      case "zeropaye:payment:cancelled":
      case "zeropaye:payment:suspicious":
        if (currentModal.handler) currentModal.handler({ status: ev.split(":")[2], ...detail });
        closeModal(detail);
        break;
      case "zeropaye:modal:close":
        closeModal();
        break;
    }
  });

  // --- Public API ---
  window.ZeroPaye = {
    _loaded: true,
    version: "3.0.0",
    API_BASE: API_BASE,
    DEFAULT_CURRENCY: DEFAULT_CURRENCY,

    /**
     * Open a checkout modal.
     * @param {Object} opts
     *   - order_id (required, 1-35 chars alnum/dash/underscore)
     *   - amount (required, number >= 1, in rupees)
     *   - currency (default INR)
     *   - name (merchant name, shown in modal header)
     *   - description (optional)
     *   - customerName (optional)
     *   - key (public API key, overrides data-zeropaye-key)
     *   - handler (callback on payment result: { status, utr, order_id, amount_received, verificationTier })
     *   - onClose (callback when modal closes without payment)
     */
    pay: function (opts) {
      opts = opts || {};
      opts.key = opts.key || DEFAULT_PUBLIC_KEY;
      opts.currency = opts.currency || DEFAULT_CURRENCY;
      if (!opts.key) {
        console.error("[ZeroPaye] No public API key. Set data-zeropaye-key on the script tag or pass opts.key.");
        return;
      }
      openModal(opts);
    },

    /**
     * Close any open ZeroPaye modal.
     */
    close: function () {
      closeModal();
    },
  };

  // --- Declarative binding: auto-bind to [data-zeropaye-pay] buttons ---
  function bindDeclarativeButtons() {
    var buttons = document.querySelectorAll("[data-zeropaye-pay]");
    for (var i = 0; i < buttons.length; i++) {
      (function (btn) {
        if (btn._zeropayeBound) return;
        btn._zeropayeBound = true;
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          var opts = {
            order_id: btn.getAttribute("data-order-id"),
            amount: btn.getAttribute("data-amount"),
            currency: btn.getAttribute("data-currency") || DEFAULT_CURRENCY,
            name: btn.getAttribute("data-name") || "",
            description: btn.getAttribute("data-description") || "",
            customerName: btn.getAttribute("data-customer-name") || "",
            key: btn.getAttribute("data-zeropaye-key") || DEFAULT_PUBLIC_KEY,
            handler: function (res) {
              // Dispatch DOM CustomEvent for reactive UIs
              try {
                window.dispatchEvent(
                  new CustomEvent("zeropaye:payment:success", { detail: res })
                );
              } catch (e) {}
              // Fallback: redirect to data-success-url if provided
              var successUrl = btn.getAttribute("data-success-url");
              if (successUrl && res.status === "SUCCESS") {
                var url = successUrl
                  .replace("{order_id}", encodeURIComponent(res.order_id || ""))
                  .replace("{utr}", encodeURIComponent(res.utr || ""))
                  .replace("{amount}", encodeURIComponent(res.amount_received || ""));
                window.location.href = url;
              }
            },
            onClose: function () {
              try {
                window.dispatchEvent(new CustomEvent("zeropaye:payment:cancelled"));
              } catch (e) {}
            },
          };
          window.ZeroPaye.pay(opts);
        });
      })(buttons[i]);
    }
  }

  // Bind on DOMContentLoaded (or immediately if already loaded)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindDeclarativeButtons);
  } else {
    bindDeclarativeButtons();
  }

  // v4.0 fix: event delegation instead of polling (was setInterval every 2s)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-zeropaye-pay]');
    if (!btn || btn._zeropayeBound) return;
    btn._zeropayeBound = true;
    e.preventDefault();
    var opts = {
      order_id: btn.getAttribute('data-order-id'),
      amount: btn.getAttribute('data-amount'),
      currency: btn.getAttribute('data-currency') || DEFAULT_CURRENCY,
      name: btn.getAttribute('data-name') || '',
      description: btn.getAttribute('data-description') || '',
      customerName: btn.getAttribute('data-customer-name') || '',
      key: btn.getAttribute('data-zeropaye-key') || DEFAULT_PUBLIC_KEY,
      handler: function (res) {
        try { window.dispatchEvent(new CustomEvent('zeropaye:payment:success', { detail: res })); } catch (e) {}
        var successUrl = btn.getAttribute('data-success-url');
        if (successUrl && res.status === 'SUCCESS') {
          window.location.href = successUrl.replace('{order_id}', encodeURIComponent(res.order_id || '')).replace('{utr}', encodeURIComponent(res.utr || '')).replace('{amount}', encodeURIComponent(res.amount_received || ''));
        }
      },
      onClose: function () {
        try { window.dispatchEvent(new CustomEvent('zeropaye:payment:cancelled')); } catch (e) {}
      },
    };
    window.ZeroPaye.pay(opts);
  });

  console.log("[ZeroPaye] SDK v4.0.0 loaded. API_BASE:", API_BASE);
})();
