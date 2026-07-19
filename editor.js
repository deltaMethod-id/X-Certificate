// =========================
// X-Certificate
// editor.js
// =========================

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("certificateForm");

    if (!form) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        // Ambil data dari form
        const certificateData = {
            recipientName: document.getElementById("recipientName").value.trim(),
            certificateTitle: document.getElementById("certificateTitle").value.trim(),
            description: document.getElementById("description").value.trim(),
            issuer: document.getElementById("issuer").value.trim(),
            date: document.getElementById("date").value,
            certificateId: document.getElementById("certificateId").value.trim()
        };

        // Jika Certificate ID kosong, buat otomatis
        if (!certificateData.certificateId) {
            const random = Math.floor(100000 + Math.random() * 900000);

            certificateData.certificateId =
                `XC-${new Date().getFullYear()}-${random}`;
        }

        // Simpan data sementara
        localStorage.setItem(
            "xcertificate",
            JSON.stringify(certificateData)
        );

        // Buka halaman preview
        window.location.href = "preview.html";
    });

});
