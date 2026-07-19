// =========================
// X-Certificate
// download.js
// =========================

document.addEventListener("DOMContentLoaded", () => {

    const data = JSON.parse(localStorage.getItem("xcertificate"));

    if (!data) {
        alert("No certificate data found.");
        window.location.href = "editor.html";
        return;
    }

    // Tampilkan data
    document.getElementById("downloadTitle").textContent =
        data.certificateTitle;

    document.getElementById("downloadName").textContent =
        data.recipientName;

    document.getElementById("downloadId").textContent =
        data.certificateId;

    document.getElementById("downloadDate").textContent =
        data.date;


    // Download PNG
    const pngButton = document.getElementById("downloadPng");

    if (pngButton) {
        pngButton.addEventListener("click", () => {

            alert("PNG export feature will be added soon.");

        });
    }


    // Download PDF
    const pdfButton = document.getElementById("downloadPdf");

    if (pdfButton) {
        pdfButton.addEventListener("click", () => {

            alert("PDF export feature will be added soon.");

        });
    }

});
