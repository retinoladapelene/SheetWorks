// ---------------------------------------------------------
// FIREBASE CONFIGURATION & INITIALIZATION
// ---------------------------------------------------------
// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyCiN8dKgWs2swvOlGCNZMHhC8jshGF1O2M",
    authDomain: "sheetworks-2ca89.firebaseapp.com",
    projectId: "sheetworks-2ca89",
    storageBucket: "sheetworks-2ca89.firebasestorage.app",
    messagingSenderId: "199974847465",
    appId: "1:199974847465:web:8c522c4c50fe3bb186c178"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// ---------------------------------------------------------
// CONSTANTS & STATE
// ---------------------------------------------------------
// Admin Emails (Role Management)
const ADMIN_EMAILS = ['pbsn290704@gmail.com']; // Ganti dengan email admin sebenarnya

// ---------------------------------------------------------
// AUTHENTICATION LOGIC
// ---------------------------------------------------------

// ---------------------------------------------------------
// AUTHENTICATION LOGIC
// ---------------------------------------------------------

/**
 * Trigger Google Login Popup
 */
function loginGoogle() {
    if (typeof firebase === 'undefined') {
        alert("Firebase SDK belum dimuat. Cek koneksi internet atau konfigurasi.");
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            // Login Success
            console.log("User logged in:", result.user.displayName);
            toggleLoginModal(); // Close modal if open
        })
        .catch((error) => {
            console.error("Login Error:", error);
            alert("Gagal login: " + error.message);
        });
}

/**
 * Custom Logout Flow
 */
function logout() {
    // Open the custom logout modal
    const modal = document.getElementById('logout-modal');
    if (modal) modal.classList.add('active');
}

function closeLogoutModal() {
    const modal = document.getElementById('logout-modal');
    if (modal) modal.classList.remove('active');
}

function confirmLogout() {
    firebase.auth().signOut().then(() => {
        console.log("User signed out");
        sessionStorage.removeItem('userProfile');
        closeLogoutModal();
        // UI update will be handled by onAuthStateChanged
        // Reloading might be needed if we want to clear all state cleanly
        location.reload();
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
}

/**
 * Toggle Login Modal Visibility
 */
function toggleLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.toggle('active');
    }
}

/**
 * Handle "Write Review" Click
 * Checks if user is logged in before showing form
 */
function handleWriteReviewClick(e) {
    e.preventDefault();
    const user = firebase.auth().currentUser;
    if (user) {
        // Logged in: Show form on Index page
        const formContainer = document.getElementById('form-card');
        if (formContainer) {
            formContainer.style.display = 'block';
            formContainer.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        // Not logged in: Show login modal
        toggleLoginModal();
    }
}

function closeReviewForm() {
    const formContainer = document.getElementById('form-card');
    if (formContainer) formContainer.style.display = 'none';
}

// ---------------------------------------------------------
// PRODUCT MANAGEMENT SYSTEM (ADMIN)
// ---------------------------------------------------------

// Default Data (Seed)
const DEFAULT_CATEGORIES = [
    { id: 'cat_1', name: 'Template Spreadsheet' },
    { id: 'cat_2', name: 'E-Book Panduan' }
];

const DEFAULT_PRODUCTS = [
    {
        id: 'prod_1',
        catId: 'cat_1',
        name: 'Badminton Pro V3',
        desc: 'Template lengkap untuk manajemen turnamen dan kas.',
        price: 150000,
        discount: 60, // 60% off
        image: 'dashboard_leaderboard_mockup.png'
    },
    {
        id: 'prod_2',
        catId: 'cat_1',
        name: 'Kas & Iuran Basic',
        desc: 'Fokus pada pencatatan keuangan klub sederhana.',
        price: 50000,
        discount: 0,
        image: 'https://placehold.co/600x400/112240/CCFF00?text=Kas+Basic'
    }
];

// Load Data
function getCategories() {
    const data = localStorage.getItem('sheetworks_categories');
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
}

function getProducts() {
    const data = localStorage.getItem('sheetworks_products');
    return data ? JSON.parse(data) : DEFAULT_PRODUCTS;
}

function saveCategories(cats) {
    localStorage.setItem('sheetworks_categories', JSON.stringify(cats));
    renderCategories();
}

function saveProducts(prods) {
    localStorage.setItem('sheetworks_products', JSON.stringify(prods));
    renderProducts();
}

// Render Logic
function renderCategories() {
    const cats = getCategories();
    const filterContainer = document.getElementById('category-filter');
    if (!filterContainer) return;

    // Keep "Semua" button
    let html = '<button class="filter-btn active" onclick="filterProducts(\'all\', this)">Semua</button>';

    cats.forEach(cat => {
        html += `<button class="filter-btn" onclick="filterProducts('${cat.id}', this)">${cat.name}</button>`;
    });

    filterContainer.innerHTML = html;
}

function renderProducts(filterCatId = 'all') {
    const products = getProducts();
    const cats = getCategories();
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const filtered = filterCatId === 'all'
        ? products
        : products.filter(p => p.catId === filterCatId);

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:var(--text-slate); grid-column:1/-1;">Tidak ada produk di kategori ini.</p>';
        return;
    }

    filtered.forEach(p => {
        const catName = cats.find(c => c.id === p.catId)?.name || 'Unknown';
        const finalPrice = p.price - (p.price * (p.discount / 100));

        // Check Admin for Delete Button
        const user = firebase.auth().currentUser;
        const isAdmin = user && ADMIN_EMAILS.includes(user.email);

        const deleteBtn = isAdmin ?
            `<button class="btn-delete-product" onclick="deleteProduct('${p.id}')" title="Hapus Produk">🗑️</button>` : '';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            ${p.discount > 0 ? `<div class="product-badge">Hemat ${p.discount}%</div>` : ''}
            <div class="product-image-container">
                <img src="${p.image}" alt="${p.name}">
            </div>
            <div class="product-content">
                <div style="display:flex; justify-content:space-between;">
                    <span class="product-cat">${catName}</span>
                    ${deleteBtn}
                </div>
                <h3 class="product-title">${p.name}</h3>
                <p class="product-desc">${p.desc}</p>
                <div class="price-row">
                    <span class="current-price">Rp${finalPrice.toLocaleString('id-ID')}</span>
                    ${p.discount > 0 ? `<span class="original-price">Rp${p.price.toLocaleString('id-ID')}</span>` : ''}
                </div>
                <button class="btn-buy">Beli Sekarang</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterProducts(catId, btn) {
    // UI Active State
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    renderProducts(catId);
}

// Admin Operations
function addProduct(name, desc, price, discount, catId, image) {
    const products = getProducts();
    const newProd = {
        id: 'prod_' + Date.now(),
        catId,
        name,
        desc,
        price: parseInt(price),
        discount: parseInt(discount),
        image: image || 'https://placehold.co/600x400/112240/CCFF00?text=No+Image'
    };
    products.push(newProd);
    saveProducts(products);
}

function deleteProduct(id) {
    if (!confirm('Hapus produk ini?')) return;
    const products = getProducts();
    const updated = products.filter(p => p.id !== id);
    saveProducts(updated);
}

// Modal Helpers (Mocking standard prompt/modal for speed implementation)
function openProductModal() {
    // Simple Prompt Workflow for MVP
    // In a real app, use the HTML Modal
    const cats = getCategories();
    if (cats.length === 0) { alert("Buat kategori dulu!"); return; }

    const name = prompt("Nama Produk:");
    if (!name) return;

    const desc = prompt("Deskripsi Singkat:");
    const price = prompt("Harga Asli (Angka):", "100000");
    const discount = prompt("Diskon (%):", "0");

    // Simple Category Selection
    let catMsg = "Pilih ID Kategori:\n";
    cats.forEach(c => catMsg += `${c.id}: ${c.name}\n`);
    const catId = prompt(catMsg, cats[0].id);

    const image = prompt("URL Gambar (Kosongkan untuk default):");

    addProduct(name, desc, price, discount, catId, image);
}

function openCategoryModal() {
    const action = prompt("Ketik 1 untuk Tambah Kategori, 2 untuk Hapus Kategori");
    if (action === '1') {
        const name = prompt("Nama Kategori Baru:");
        if (name) {
            const cats = getCategories();
            cats.push({ id: 'cat_' + Date.now(), name });
            saveCategories(cats);
        }
    } else if (action === '2') {
        const cats = getCategories();
        const id = prompt("Masukkan ID Kategori untuk dihapus (Cek console log data if needed, or simple implementation)");
        // Simplified for MVP
        alert("Fitur hapus kategori butuh UI lebih lengkap. Gunakan console.");
    }
}

// ---------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------



document.addEventListener('DOMContentLoaded', () => {

    // ---------------------------------------------------------
    // AUTH STATE LISTENER (Runs on all pages)
    // ---------------------------------------------------------
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            const authContainer = document.getElementById('auth-container');
            const testimonialGrid = document.getElementById('testimonial-grid');

            if (user) {
                // USER IS LOGGED IN

                // 1. Update Auth UI (Header)
                // Note: Now inside the Liquid Nav
                if (authContainer) {
                    authContainer.innerHTML = `
                        <div class="user-profile-display" onclick="logout()" title="Klik untuk Logout">
                            <img src="${user.photoURL}" alt="User">
                            <span>${user.displayName.split(' ')[0]}</span>
                            <button class="logout-btn">🚪</button>
                        </div>
                    `;
                }

                // 2. Save Profile for Review Page
                const userProfile = {
                    name: user.displayName,
                    photo: user.photoURL,
                    email: user.email,
                    isAdmin: ADMIN_EMAILS.includes(user.email)
                };
                sessionStorage.setItem('userProfile', JSON.stringify(userProfile));

                // 3. Admin: Show Delete Buttons (If on badminton.html)
                if (testimonialGrid && userProfile.isAdmin) {
                    document.querySelectorAll('.delete-review-btn').forEach(btn => {
                        btn.style.display = 'block';
                    });
                }

                // 4. Admin: Show Product Management
                if (userProfile.isAdmin) {
                    const productControls = document.getElementById('admin-product-controls');
                    if (productControls) productControls.style.display = 'block';
                    // Re-render products to show delete buttons
                    if (typeof renderProducts === 'function') renderProducts();
                }

                // 5. User UI: Pre-fill
                const reviewForm = document.getElementById('review-page-form');
                if (reviewForm) {
                    const nameInput = document.getElementById('review-name');
                    if (nameInput) nameInput.value = user.displayName;
                }

            } else {
                // USER IS LOGGED OUT

                // 1. Reset Auth UI
                if (authContainer) {
                    authContainer.innerHTML = `
                        <button onclick="toggleLoginModal()" class="btn-login">
                           Login
                        </button>
                    `;
                }

                // 2. Clear Session
                sessionStorage.removeItem('userProfile');

                // 3. Hide Admin Controls
                if (testimonialGrid) {
                    document.querySelectorAll('.delete-review-btn').forEach(btn => {
                        btn.style.display = 'none';
                    });
                }
                const productControls = document.getElementById('admin-product-controls');
                if (productControls) productControls.style.display = 'none';
                if (typeof renderProducts === 'function') renderProducts(); // Re-render to hide delete buttons

            }
        });
    }


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
        // Selectors matched to review.html: id="star-group" and class="star"
        const starContainer = document.getElementById('star-group');
        const stars = starContainer ? starContainer.querySelectorAll('.star') : [];

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

            // 1. Save to LocalStorage
            const newReview = {
                name,
                club,
                rating,
                message,
                date: new Date().toISOString()
            };

            const existingReviews = JSON.parse(localStorage.getItem('badmintonReviews') || '[]');
            existingReviews.unshift(newReview); // Add to top
            localStorage.setItem('badmintonReviews', JSON.stringify(existingReviews));

            // 2. UI Feedback & Redirect
            const formContent = document.getElementById('form-content');
            const successMsg = document.getElementById('success-msg');

            if (formContent) formContent.style.display = 'none';
            if (successMsg) successMsg.style.display = 'block';

            // 3. Reload to show new review
            setTimeout(() => {
                location.reload();
            }, 2000);
        });
    }

    // === Logic for BADMINTON.HTML (Index) ===
    if (testimonialGrid) {
        // Load reviews from LocalStorage
        const storedReviews = JSON.parse(localStorage.getItem('badmintonReviews') || '[]');

        testimonialGrid.innerHTML = ''; // Clear to prevent duplicates on reload

        if (storedReviews.length === 0) {
            testimonialGrid.innerHTML = '<p style="text-align:center; color:var(--text-slate); width:100%;">Belum ada ulasan.</p>';
        } else {
            storedReviews.forEach(review => {
                const card = document.createElement('div');
                card.className = 'testimonial-card';
                card.style.position = 'relative';

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
                    <!-- Delete Button: Only visible to Admin (Auth Listener handles toggle) -->
                    <button class="delete-review-btn" 
                        data-date="${review.date}"
                        style="position:absolute; top:10px; right:10px; background:none; border:none; cursor:pointer; display:none;" 
                        title="Hapus Review Ini">
                        🗑️
                    </button>
                `;

                // Delete Logic
                const deleteBtn = card.querySelector('.delete-review-btn');
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Yakin ingin menghapus review ini?')) {
                        // Remove from LocalStorage
                        const currentReviews = JSON.parse(localStorage.getItem('badmintonReviews') || '[]');
                        const updatedReviews = currentReviews.filter(r => r.date !== review.date);
                        localStorage.setItem('badmintonReviews', JSON.stringify(updatedReviews));

                        // Update UI
                        card.remove();
                    }
                });

                testimonialGrid.appendChild(card);
            });
        }
    }

    // Helper: Update Star Visuals (Used if we move logic here)
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

