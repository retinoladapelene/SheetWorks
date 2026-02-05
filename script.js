document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // Common: FAQ Accordion (Runs on pages with .faq-question)
    // ---------------------------------------------------------
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length > 0) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                // Close other items
                document.querySelectorAll('.faq-item').forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                // Toggle current item
                item.classList.toggle('active');
            });
        });
    }

    // smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ---------------------------------------------------------
    // PAGE SPECIFIC LOGIC
    // ---------------------------------------------------------

    // Check which page we are on
    const reviewForm = document.getElementById('review-page-form');
    const testimonialGrid = document.getElementById('testimonial-grid');

    // === Logic for REVIEW.HTML ===
    if (reviewForm) {
        const ratingInput = document.getElementById('review-rating');
        const starContainer = document.getElementById('star-container');
        const stars = starContainer.querySelectorAll('.star-rating');

        // Star Rating Click Logic
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = star.getAttribute('data-value');
                ratingInput.value = value;
                updateStars(stars, value);
            });
        });

        // Form Submission
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('review-name').value;
            const club = document.getElementById('review-club').value || "Pengguna Baru";
            const rating = ratingInput.value;
            const message = document.getElementById('review-message').value;
            const helpful = document.getElementById('review-helpful').value;

            // 1. Save to LocalStorage
            const newReview = {
                name,
                club,
                rating,
                message,
                helpful,
                date: new Date().toISOString()
            };

            const existingReviews = JSON.parse(localStorage.getItem('badmintonReviews') || '[]');
            existingReviews.unshift(newReview); // Add to top
            localStorage.setItem('badmintonReviews', JSON.stringify(existingReviews));

            // 2. WhatsApp Persistence (Optional)
            let waMessage = `Halo Admin, review baru via web:%0A%0ANama: ${name}%0AKlub: ${club}%0ARating: ${rating} Bintang%0APesan: ${message}`;
            if (helpful) {
                waMessage += `%0AHal Paling Membantu: ${helpful}`;
            }
            const waUrl = `https://wa.me/?text=${waMessage}`;

            if (confirm("Review Tersimpan! Kirim juga ke WhatsApp Admin?")) {
                window.open(waUrl, '_blank');
            }

            // 3. Redirect back to Main Page
            window.location.href = 'badminton.html';
        });
    }

    // === Logic for BADMINTON.HTML ===
    if (testimonialGrid) {
        // Load reviews from LocalStorage
        const storedReviews = JSON.parse(localStorage.getItem('badmintonReviews') || '[]');

        storedReviews.forEach(review => {
            const card = document.createElement('div');
            card.className = 'testimonial-card';
            card.style.position = 'relative'; // For absolute positioning of delete button
            card.innerHTML = `
                <div class="stars">${'⭐'.repeat(review.rating)}</div>
                <p class="quote">"${review.message}"</p>
                ${review.image ? `<img src="${review.image}" style="width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin:10px 0; border:1px solid #334155;" alt="Review Image">` : ''}
                <div class="user-info">
                    <div class="user-avatar" style="background:var(--neon-yellow); color:var(--primary-blue); font-weight:bold;">
                        ${review.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <strong>${review.name}</strong><br>
                        <small>${review.club}</small>
                    </div>
                </div>
                <!-- Delete Button (Only for LocalStorage reviews) -->
                <button class="delete-review-btn" style="position:absolute; top:10px; right:10px; background:none; border:none; color:#ff4757; cursor:pointer;" title="Hapus Review Ini">🗑️</button>
            `;

            // Delete Logic
            card.querySelector('.delete-review-btn').addEventListener('click', () => {
                if (confirm('Yakin ingin menghapus review ini?')) {
                    // Remove from DOM
                    card.remove();

                    // Remove from LocalStorage
                    const currentReviews = JSON.parse(localStorage.getItem('badmintonReviews') || '[]');
                    const updatedReviews = currentReviews.filter(r => r.date !== review.date); // Filter by unique date
                    localStorage.setItem('badmintonReviews', JSON.stringify(updatedReviews));
                }
            });

            testimonialGrid.prepend(card);
        });
    }

    // Helper: Update Star Visuals
    function updateStars(starsNodeList, value) {
        starsNodeList.forEach(star => {
            if (parseInt(star.getAttribute('data-value')) <= parseInt(value)) {
                star.classList.add('selected');
                star.textContent = '★';
            } else {
                star.classList.remove('selected');
            }
        });
    }
});
