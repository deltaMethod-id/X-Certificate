// =========================
// X-Certificate
// index.js
// =========================

// Wait until page is fully loaded
document.addEventListener("DOMContentLoaded", () => {

    // Create Certificate Button
    const startButton = document.querySelector(".start-btn");

    if (startButton) {
        startButton.addEventListener("click", (event) => {
            event.preventDefault();

            startButton.textContent = "Opening Editor...";
            startButton.style.pointerEvents = "none";

            setTimeout(() => {
                window.location.href = "editor.html";
            }, 500);
        });
    }

    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();

            const target = document.querySelector(link.getAttribute("href"));

            if (target) {
                target.scrollIntoView({
                    behavior: "smooth"
                });
            }
        });
    });

    // Update footer year automatically
    const footer = document.querySelector("footer p");

    if (footer) {
        footer.innerHTML = `© ${new Date().getFullYear()} X-Certificate. All rights reserved.`;
    }

});
