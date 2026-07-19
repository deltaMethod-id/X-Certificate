// =========================
// X-Certificate
// preview.js
// =========================

document.addEventListener("DOMContentLoaded", () => {

    // Ambil data sertifikat
    const data = JSON.parse(localStorage.getItem("xcertificate"));

    // Jika tidak ada data, kembali ke editor
    if (!data) {
        alert("No certificate data found.");
        window.location.href = "editor.html";
        return;
    }

    // Tampilkan data
    document.getElementById("previewTitle").textContent =
        data.certificateTitle;

    document.getElementById("previewName").textContent =
        data.recipientName;

    document.getElementById("previewDescription").textContent =
        data.description;

    document.getElementById("previewIssuer").textContent =
        data.issuer;

    document.getElementById("previewDate").textContent =
        data.date;

    document.getElementById("previewId").textContent =
        data.certificateId;

    // Tombol Edit
    const editBtn = document.getElementById("editBtn");

    if (editBtn) {
        editBtn.addEventListener("click", () => {
            window.location.href = "editor.html";
        });
    }

    // Tombol Download
    const downloadBtn = document.getElementById("downloadBtn");

    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            window.location.href = "download.html";
        });
    }

});
