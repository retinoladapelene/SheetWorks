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
// ---------------------------------------------------------
// UI HELPER FUNCTIONS (MODALS & NOTIFICATIONS)
// ---------------------------------------------------------

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        // Animation reset
        const card = modal.querySelector('.modal-card');
        if (card) {
            card.style.animation = 'none';
            card.offsetHeight; /* trigger reflow */
            card.style.animation = 'slideUp 0.3s ease forwards';
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// Global Notification (Replaces alert)
function showNotification(title, message, type = 'success') {
    const modal = document.getElementById('notification-modal');
    const icon = document.getElementById('notif-icon');
    const tEl = document.getElementById('notif-title');
    const mEl = document.getElementById('notif-message');

    if (!modal) return;

    tEl.textContent = title;
    mEl.textContent = message;

    if (type === 'error') {
        icon.textContent = '❌';
        tEl.style.color = '#ff4757';
    } else {
        icon.textContent = '✨';
        tEl.style.color = '#dfff00'; // Neon Yellow
    }

    showModal('notification-modal');

    // Auto close after 3 seconds
    setTimeout(() => {
        closeModal('notification-modal');
    }, 3000);
}

// Global Confirmation (Replaces confirm)
let confirmCallback = null;
function showConfirm(message, callback) {
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-message');
    const btnParams = document.getElementById('btn-confirm-act');

    if (!modal) return;

    msgEl.textContent = message;
    confirmCallback = callback;

    // Reset button listener
    const newBtn = btnParams.cloneNode(true);
    btnParams.parentNode.replaceChild(newBtn, btnParams);

    newBtn.addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        closeModal('confirm-modal');
    });

    showModal('confirm-modal');
}

// ---------------------------------------------------------
// AUTHENTICATION LOGIC
// ---------------------------------------------------------

function loginGoogle() {
    if (typeof firebase === 'undefined') {
        showNotification("Error", "Firebase SDK belum dimuat.", 'error');
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("User logged in:", result.user.displayName);
            toggleLoginModal();
            showNotification("Berhasil Login", `Selamat datang, ${result.user.displayName}!`);
        })
        .catch((error) => {
            console.error("Login Error:", error);
            showNotification("Gagal Login", error.message, 'error');
        });
}

function logout() {
    showModal('logout-modal');
}

function closeLogoutModal() {
    closeModal('logout-modal');
}

function confirmLogout() {
    firebase.auth().signOut().then(() => {
        sessionStorage.removeItem('userProfile');
        closeLogoutModal();
        location.reload();
    }).catch((error) => {
        showNotification("Error", "Gagal Logout.", 'error');
    });
}

function toggleLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        if (modal.classList.contains('active')) {
            modal.classList.remove('active');
        } else {
            modal.classList.add('active');
        }
    }
}

function handleWriteReviewClick(e) {
    e.preventDefault();
    const user = firebase.auth().currentUser;
    if (user) {
        window.location.href = 'review.html';
    } else {
        toggleLoginModal();
    }
}

// ---------------------------------------------------------
// PRODUCT MANAGEMENT SYSTEM (ADMIN)
// ---------------------------------------------------------
// ... (Data & Load logic same as before, see next block for changes)

// Cached Data (Synced with Firestore)
let cachedCategories = [];
let cachedProducts = [];

function getCategories() {
    return cachedCategories;
}

function getProducts() {
    return cachedProducts;
}

// NOTE: saveCategories and saveProducts are removed as we now write directly to Firestore

function initFirestoreListeners() {
    // 1. Categories Listener
    firebase.firestore().collection('categories').onSnapshot((snapshot) => {
        cachedCategories = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id; // Use Firestore ID
            cachedCategories.push(data);
        });
        renderCategories();
        // Re-render products if category names changed
        renderProducts(document.querySelector('.filter-btn.active')?.dataset?.cat || 'all');
    }, (error) => {
        console.error("Error getting categories:", error);
    });

    // 2. Products Listener
    firebase.firestore().collection('products').onSnapshot((snapshot) => {
        cachedProducts = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id; // Use Firestore ID
            cachedProducts.push(data);
        });

        // Render with current filter
        const currentFilter = document.querySelector('.filter-btn.active')?.dataset?.cat || 'all';
        renderProducts(currentFilter);
    }, (error) => {
        console.error("Error getting products:", error);
    });
}

function renderCategories() {
    const cats = getCategories();
    const filterContainer = document.getElementById('category-filter');
    if (!filterContainer) return;

    let html = '<button class="filter-btn active" data-cat="all" onclick="filterProducts(\'all\', this)">Semua</button>';
    cachedCategories.forEach(cat => {
        html += `<button class="filter-btn" data-cat="${cat.id}" onclick="filterProducts('${cat.id}', this)">${cat.name}</button>`;
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
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(catId);
}

// --- ADMIN OPERATIONS (NEW CUSTOM MODALS) ---

// 1. Product Management
function openProductModal() {
    const cats = getCategories();
    if (cats.length === 0) {
        showNotification("Info", "Buat kategori dulu sebelum tambah produk.", "error");
        return;
    }

    // Populate Category Dropdown
    const catSelect = document.getElementById('prod-cat');
    catSelect.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    // Clear Inputs
    document.getElementById('admin-product-form').reset();

    showModal('product-form-modal');
}

function handleProductSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('prod-name').value;
    const desc = document.getElementById('prod-desc').value;
    const price = document.getElementById('prod-price').value;
    const discount = document.getElementById('prod-discount').value || 0;
    const catId = document.getElementById('prod-cat').value;
    const image = document.getElementById('prod-img').value;

    // Add to Firestore
    firebase.firestore().collection('products').add({
        catId,
        name,
        desc,
        price: parseInt(price),
        discount: parseInt(discount),
        image: image || 'https://placehold.co/600x400/112240/CCFF00?text=No+Image',
        createdAt: new Date().toISOString()
    })
        .then(() => {
            closeModal('product-form-modal');
            showNotification("Sukses", "Produk berhasil ditambahkan!");
        })
        .catch((error) => {
            console.error("Error adding product: ", error);
            showNotification("Gagal", "Gagal menambah produk: " + error.message, "error");
        });
}

function deleteProduct(id) {
    showConfirm("Yakin ingin menghapus produk ini?", () => {
        firebase.firestore().collection('products').doc(id).delete()
            .then(() => showNotification("Terhapus", "Produk telah dihapus."))
            .catch((error) => showNotification("Error", "Gagal hapus: " + error.message, "error"));
    });
}

// 2. Category Management
function openCategoryModal() {
    showModal('category-form-modal');
    renderDeleteCategoryList();
}

function handleCategorySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name-new').value;
    if (name) {
        firebase.firestore().collection('categories').add({
            name: name,
            createdAt: new Date().toISOString()
        })
            .then(() => {
                document.getElementById('cat-name-new').value = '';
                renderDeleteCategoryList(); // Update logic might need check as list updates via listener now
                showNotification("Sukses", "Kategori baru ditambahkan.");
            })
            .catch((error) => {
                showNotification("Error", "Gagal tambah kategori: " + error.message, "error");
            });
    }
}

function renderDeleteCategoryList() {
    // Uses cached categories which are updated by listener
    const cats = getCategories();
    const list = document.getElementById('cat-delete-list');
    if (!list) return; // Guard clause
    list.innerHTML = cats.map(c => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px; border-radius:5px;">
            <span>${c.name}</span>
            <button onclick="deleteCategory('${c.id}')" style="background:none; border:none; cursor:pointer;">❌</button>
        </div>
    `).join('');
}

function deleteCategory(id) {
    showConfirm("Hapus kategori ini? Produk terkait mungkin akan error.", () => {
        firebase.firestore().collection('categories').doc(id).delete()
            .then(() => showNotification("Terhapus", "Kategori telah dihapus."))
            .catch((error) => showNotification("Error", "Gagal hapus: " + error.message, "error"));
    });
}

// 3. Review Management (Index)
function setupReviewDeleteListeners() {
    // This is called inside onAuthStateChanged logic or render
    // But since renderProducts manages its own delete buttons, rely on that.
    // For Reviews (which are rendered in DOMContentLoaded logic below):
}

// ---------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

    // ... (Auth Listener - same as before, see logic below for minor cleanup) ...
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            // ... (Auth UI updates) ...
            const authContainer = document.getElementById('auth-container');
            const testimonialGrid = document.getElementById('testimonial-grid');

            if (user) {
                // ... Logged In Logic ...
                if (authContainer) {
                    authContainer.innerHTML = `
                        <div class="user-profile-display" onclick="logout()" title="Klik untuk Logout">
                            <img src="${user.photoURL}" alt="User">
                            <span>${user.displayName.split(' ')[0]}</span>
                            <button class="logout-btn">🚪</button>
                        </div>
                    `;
                }

                const userProfile = {
                    name: user.displayName,
                    photo: user.photoURL,
                    email: user.email,
                    isAdmin: ADMIN_EMAILS.includes(user.email)
                };
                sessionStorage.setItem('userProfile', JSON.stringify(userProfile));

                if (testimonialGrid && userProfile.isAdmin) {
                    renderReviews(true); // Re-render reviews to show delete buttons
                }

                if (userProfile.isAdmin) {
                    const productControls = document.getElementById('admin-product-controls');
                    if (productControls) productControls.style.display = 'block';
                    if (typeof renderProducts === 'function') renderProducts();
                }

            } else {
                // ... Logged Out Logic ...
                if (authContainer) {
                    authContainer.innerHTML = `<button onclick="toggleLoginModal()" class="btn-login">Login</button>`;
                }
                sessionStorage.removeItem('userProfile');

                const productControls = document.getElementById('admin-product-controls');
                if (productControls) productControls.style.display = 'none';
                if (typeof renderProducts === 'function') renderProducts();

                if (testimonialGrid) renderReviews(false);
            }
        });
    }

    // Load initial data logic moved to Firestore listeners
    if (document.getElementById('product-grid')) {
        // Initialize Firestore Listeners
        if (typeof firebase !== 'undefined') {
            initFirestoreListeners();
        }
        // Initial empty render or loading state could be added here
    }

    if (document.getElementById('testimonial-grid')) {
        renderReviews(false);
    }

    // FAQ & Scroller logic (keep same)
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length > 0) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                document.querySelectorAll('.faq-item').forEach(otherItem => {
                    if (otherItem !== item) otherItem.classList.remove('active');
                });
                item.classList.toggle('active');
            });
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Review Page Specific
    const reviewForm = document.getElementById('review-page-form');
    if (reviewForm) {
        // ... (Star logic same as before) ...
        const ratingInput = document.getElementById('review-rating');
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = star.getAttribute('data-value');
                ratingInput.value = value;
                // updateStars helper
                stars.forEach(s => {
                    if (parseInt(s.getAttribute('data-value')) <= parseInt(value)) {
                        s.classList.add('selected');
                        s.textContent = '★';
                    } else {
                        s.classList.remove('selected');
                    }
                });
            });
        });

        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const user = firebase.auth().currentUser;
            if (!user) {
                showNotification("Akses Ditolak", "Anda harus login untuk mengirim review.", "error");
                toggleLoginModal();
                return;
            }

            const name = document.getElementById('review-name').value;
            const club = document.getElementById('review-club').value || "Pengguna Baru";
            const rating = parseInt(ratingInput.value);
            const message = document.getElementById('review-message').value;

            // Simpan ke Firestore
            const formContent = document.getElementById('form-content');
            const successMsg = document.getElementById('success-msg');

            firebase.firestore().collection('reviews').add({
                name: name,
                club: club,
                rating: rating,
                message: message,
                photo: user.photoURL || null,
                uid: user.uid,
                email: user.email,
                date: new Date().toISOString()
            })
                .then(() => {
                    if (formContent) formContent.style.display = 'none';
                    if (successMsg) successMsg.style.display = 'block';

                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                })
                .catch((error) => {
                    console.error("Error adding review: ", error);
                    showNotification("Gagal", "Terjadi kesalahan: " + error.message, "error");
                });
        });
    }

    // Helper to render reviews (Real-time from Firestore)
    let reviewUnsubscribe = null;

    function renderReviews(isAdmin) {
        const testimonialGrid = document.getElementById('testimonial-grid');
        if (!testimonialGrid) return;

        // Bersihkan listener lama jika ada
        if (reviewUnsubscribe) {
            reviewUnsubscribe();
            reviewUnsubscribe = null;
        }

        // Ambil data real-time
        reviewUnsubscribe = firebase.firestore().collection('reviews')
            .orderBy('date', 'desc')
            .onSnapshot((snapshot) => {
                testimonialGrid.innerHTML = '';

                if (snapshot.empty) {
                    testimonialGrid.innerHTML = '<p style="text-align:center; color:var(--text-slate); width:100%;">Belum ada ulasan.</p>';
                    return;
                }

                snapshot.forEach((doc) => {
                    const review = doc.data();
                    const reviewId = doc.id;

                    const card = document.createElement('div');
                    card.className = 'testimonial-card';
                    card.style.position = 'relative';

                    const deleteBtn = isAdmin ?
                        `<button class="delete-review-btn" data-id="${reviewId}" style="position:absolute; top:10px; right:10px; background:none; border:none; cursor:pointer;" title="Hapus Review Ini">🗑️</button>` : '';

                    card.innerHTML = `
                        <div class="stars">${'⭐'.repeat(review.rating)}</div>
                        <p class="quote">"${review.message}"</p>
                        <div class="user-info">
                            <div class="user-avatar" style="background:var(--neon-yellow); color:var(--primary-blue); font-weight:bold;">
                                ${review.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <strong>${review.name}</strong><br>
                                <small>${review.club}</small>
                            </div>
                        </div>
                        ${deleteBtn}
                    `;

                    if (isAdmin) {
                        const btn = card.querySelector('.delete-review-btn');
                        if (btn) {
                            btn.addEventListener('click', (e) => {
                                const id = e.target.getAttribute('data-id');
                                showConfirm("Hapus review ini?", () => {
                                    firebase.firestore().collection('reviews').doc(id).delete()
                                        .then(() => showNotification("Terhapus", "Review berhasil dihapus."))
                                        .catch((err) => showNotification("Error", "Gagal menghapus.", "error"));
                                });
                            });
                        }
                    }

                    testimonialGrid.appendChild(card);
                });
            }, (error) => {
                console.error("Error getting reviews:", error);
                testimonialGrid.innerHTML = '<p style="text-align:center; color:red;">Gagal memuat ulasan.</p>';
            });
    }
});

