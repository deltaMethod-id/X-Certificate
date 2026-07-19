// =========================
// X-Certificate
// download.js
// =========================

// Production-ready download handlers for PNG and PDF exports.
// - Uses html2canvas (in the preview iframe) to render the certificate element.
// - Uses jsPDF to convert the PNG data into a PDF.
// - Dynamically loads the required libraries from CDN so no HTML changes are required.
// - Exports filename generated from recipient's name: Certificate-John-Doe.png/.pdf

(function () {
  'use strict';

  // CDN URLs (pin to specific versions for stability)
  const HTML2CANVAS_CDN = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  const JSPDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

  // Utility: load a script into the current document context
  function loadScript(src, doc = document, id) {
    return new Promise((resolve, reject) => {
      if (id && doc.getElementById(id)) {
        // already loaded in this document
        return resolve();
      }
      const s = doc.createElement('script');
      s.src = src;
      if (id) s.id = id;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(new Error('Failed to load script: ' + src));
      doc.head.appendChild(s);
    });
  }

  // Sanitize and build filename from recipient name
  function makeFilename(name, ext) {
    const fallback = 'Unknown';
    const base = (name || fallback).trim();
    // Replace spaces and underscores with hyphens, remove unsafe chars
    const safe = base
      .replace(/\s+/g, '-')
      .replace(/_+/g, '-')
      .replace(/[^A-Za-z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$|^$/, fallback);
    return `Certificate-${safe}.${ext}`;
  }

  // Clean up iframe after use
  function removeIframe(iframe) {
    try {
      if (!iframe) return;
      // revoke contentWindow references to avoid leaks
      iframe.src = 'about:blank';
      iframe.remove();
    } catch (e) {
      // ignore
    }
  }

  // Download helper for data URLs
  function downloadDataUrl(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    // Firefox requires a DOM insertion for click to work in some contexts
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Convert a dataURL to Image element (returns Promise)
  function dataUrlToImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Allow CORS in case resources were tainted; should be same-origin in this project
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error('Failed to create image from data URL'));
      img.src = dataUrl;
    });
  }

  // Main export routine: creates an off-screen iframe with preview.html, renders the .certificate element
  // and returns a PNG dataURL. The work of html2canvas runs inside the iframe so preview styles apply.
  function captureCertificateFromPreview(timeoutMs = 15000) {
    return new Promise(async (resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.width = '1200px'; // reasonable width for rendering
      iframe.style.height = '900px';
      iframe.style.visibility = 'hidden';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.src = 'preview.html';

      let timer = null;
      let handled = false;

      function cleanup(err) {
        if (handled) return;
        handled = true;
        if (timer) clearTimeout(timer);
        removeIframe(iframe);
        if (err) return reject(err);
      }

      // Message listener to receive exported PNG from iframe
      function onMessage(e) {
        try {
          const msg = e.data;
          if (!msg || msg.type !== 'xcapture') return;
          // expected shape: { type: 'xcapture', token, png }
          window.removeEventListener('message', onMessage);
          cleanup();
          if (!msg.png) return reject(new Error('No PNG data received from preview.'));
          resolve(msg.png);
        } catch (err) {
          window.removeEventListener('message', onMessage);
          cleanup(err);
        }
      }

      window.addEventListener('message', onMessage);

      // Append iframe and wait for load
      document.body.appendChild(iframe);

      iframe.onload = async () => {
        try {
          const ifDoc = iframe.contentDocument;
          const ifWin = iframe.contentWindow;
          if (!ifDoc || !ifWin) throw new Error('Could not access preview iframe document.');

          // Load html2canvas into the iframe (so computed styles/fonts from preview.css apply)
          await loadScript(HTML2CANVAS_CDN, ifDoc, 'xc-html2canvas');

          // Insert a small inline script into the iframe to perform capture and postMessage the PNG
          const inline = ifDoc.createElement('script');
          inline.type = 'text/javascript';
          inline.text = `\n            (function(){\n              try {\n                // Wait for html2canvas to be available\n                if (typeof html2canvas !== 'function') {\n                  // Sometimes html2canvas is exported as default on window.html2canvas\n                  if (window.html2canvas && typeof window.html2canvas === 'function') {\n                    // ok\n                  } else {\n                    throw new Error('html2canvas not found in iframe.');\n                  }\n                }\n\n                const el = document.querySelector('.certificate');\n                if (!el) {\n                  parent.postMessage({ type: 'xcapture', png: null }, '*');\n                  return;\n                }\n\n                // Increase scale for better quality (cap to avoid OOM)\n                var scale = Math.min(2, window.devicePixelRatio || 1);\n\n                html2canvas(el, {\n                  scale: scale,\n                  useCORS: true,\n                  allowTaint: true,\n                  backgroundColor: null,\n                }).then(function(canvas){\n                  try {\n                    var png = canvas.toDataURL('image/png');\n                    parent.postMessage({ type: 'xcapture', png: png }, '*');\n                  } catch (err) {\n                    parent.postMessage({ type: 'xcapture', png: null }, '*');\n                  }\n                }).catch(function(err){\n                  parent.postMessage({ type: 'xcapture', png: null }, '*');\n                });\n              } catch (err) {\n                parent.postMessage({ type: 'xcapture', png: null }, '*');\n              }\n            })();\n          `;

          ifDoc.head.appendChild(inline);

          // Setup a timeout
          timer = setTimeout(() => {
            window.removeEventListener('message', onMessage);
            cleanup(new Error('Timed out while capturing certificate from preview.'));
          }, timeoutMs);
        } catch (err) {
          window.removeEventListener('message', onMessage);
          cleanup(err || new Error('Failed to initialize capture in iframe.'));
        }
      };

      iframe.onerror = () => {
        window.removeEventListener('message', onMessage);
        cleanup(new Error('Failed to load preview.html in iframe.'));
      };
    });
  }

  // Public export entry: type 'png' or 'pdf'
  async function exportCertificate(type) {
    try {
      const data = JSON.parse(localStorage.getItem('xcertificate'));
      if (!data) {
        alert('No certificate data found.');
        window.location.href = 'editor.html';
        return;
      }

      const recipient = data.recipientName || '';
      if (type === 'pdf') {
        // Ensure jsPDF is available in parent
        if (!window.jspdf) {
          await loadScript(JSPDF_CDN, document, 'xc-jspdf');
        }
        // Some UMD bundles attach jsPDF as { jsPDF } to window.jspdf
        if (!window.jspdf && !window.jsPDF) {
          console.warn('jsPDF not found after loading CDN. Attempting to continue.');
        }
      }

      // Disable buttons to avoid duplicate clicks
      setButtonsDisabled(true);

      // Capture PNG from preview (iframe). This returns a dataURL.
      const pngDataUrl = await captureCertificateFromPreview();
      if (!pngDataUrl) throw new Error('Failed to render certificate PNG.');

      if (type === 'png') {
        const filename = makeFilename(recipient || data.certificateTitle, 'png');
        downloadDataUrl(pngDataUrl, filename);
      } else if (type === 'pdf') {
        // Convert PNG to PDF using jsPDF in parent
        const filename = makeFilename(recipient || data.certificateTitle, 'pdf');
        const { jsPDF } = window.jspdf || window.jspdf || window.jspdf || window.jspdf || window.jspdf || window.jspdf || window.jspdf || window.jspdf || window;
        // Fallbacks for many UMD shapes
        let PDFConstructor = null;
        if (window.jspdf && window.jspdf.jsPDF) PDFConstructor = window.jspdf.jsPDF;
        else if (window.jspdf && window.jspdf.default && window.jspdf.default.jsPDF) PDFConstructor = window.jspdf.default.jsPDF;
        else if (window.jsPDF) PDFConstructor = window.jsPDF;
        else if (window.jspdf) PDFConstructor = window.jspdf; // last resort

        if (!PDFConstructor) {
          // Try loading again and then fallback to offering PNG download
          try {
            await loadScript(JSPDF_CDN, document, 'xc-jspdf');
            if (window.jspdf && window.jspdf.jsPDF) PDFConstructor = window.jspdf.jsPDF;
            else if (window.jsPDF) PDFConstructor = window.jsPDF;
          } catch (e) {
            console.warn('Failed to load jsPDF, falling back to PNG download.');
          }
        }

        if (!PDFConstructor) {
          // Fallback: download PNG instead and inform user
          downloadDataUrl(pngDataUrl, filename.replace(/\.pdf$/, '.png'));
          alert('jsPDF could not be loaded; downloaded PNG instead.');
          setButtonsDisabled(false);
          return;
        }

        // Create Image object from dataURL to get natural size
        const img = await dataUrlToImage(pngDataUrl);
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        // Create PDF with px units so we can use image pixel size directly
        const pdf = new PDFConstructor({ orientation: width >= height ? 'landscape' : 'portrait', unit: 'px', format: [width, height] });
        // Add the image at full size
        pdf.addImage(pngDataUrl, 'PNG', 0, 0, width, height);
        // Save
        pdf.save(filename);
      }

      setButtonsDisabled(false);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export certificate. ' + (err && err.message ? err.message : ''));
      setButtonsDisabled(false);
    }
  }

  // Convenience: enable/disable download buttons while processing
  function setButtonsDisabled(disabled) {
    const pngButton = document.getElementById('downloadPng');
    const pdfButton = document.getElementById('downloadPdf');
    if (pngButton) pngButton.disabled = !!disabled;
    if (pdfButton) pdfButton.disabled = !!disabled;
  }

  // Initialize: wire up UI and populate fields
  document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(localStorage.getItem('xcertificate'));

    if (!data) {
      alert('No certificate data found.');
      window.location.href = 'editor.html';
      return;
    }

    // Populate UI
    const elTitle = document.getElementById('downloadTitle');
    const elName = document.getElementById('downloadName');
    const elId = document.getElementById('downloadId');
    const elDate = document.getElementById('downloadDate');

    if (elTitle) elTitle.textContent = data.certificateTitle || elTitle.textContent;
    if (elName) elName.textContent = data.recipientName || elName.textContent;
    if (elId) elId.textContent = data.certificateId || elId.textContent;
    if (elDate) elDate.textContent = data.date || elDate.textContent;

    // Wire buttons
    const pngButton = document.getElementById('downloadPng');
    const pdfButton = document.getElementById('downloadPdf');

    if (pngButton) {
      pngButton.addEventListener('click', (ev) => {
        ev.preventDefault();
        exportCertificate('png');
      });
    }

    if (pdfButton) {
      pdfButton.addEventListener('click', (ev) => {
        ev.preventDefault();
        exportCertificate('pdf');
      });
    }
  });

})();
