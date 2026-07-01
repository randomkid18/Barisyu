/* ============================================
   BARISYU - DIGITAL MENU APPLICATION
   Enhanced: GAS Integration | Admin Dashboard | QR Invoice
   ============================================ */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwAHYaiFRXECRM7Y7tg1UoA02koV_KzDtrAe7PphkQJEWTSldCYic-4XhoxOItjwQ0r/exec";

    // ============================================
    // DATA: Menu Items (Default Fallback)
    // [PRESERVED] Original static dataset
    // ============================================
    const defaultMenuData = {
        beverages: [
            { id: 'bev-1', name: 'Espresso', description: 'Rich and bold single shot of premium arabica coffee', price: 18000, image: 'img/menu-1.png', category: 'beverages', discount: 0, isPromo: false },
            { id: 'bev-2', name: 'Cappuccino', description: 'Perfect balance of espresso, steamed milk, and foam', price: 28000, image: 'img/menu-2.png', category: 'beverages', discount: 0, isPromo: false },
            { id: 'bev-3', name: 'Caramel Latte', description: 'Smooth espresso with caramel syrup and velvety milk', price: 32000, image: 'img/menu-3.png', category: 'beverages', discount: 0, isPromo: false },
            { id: 'bev-4', name: 'Matcha Green Tea', description: 'Premium Japanese matcha with creamy milk base', price: 30000, image: 'img/menu-4.png', category: 'beverages', discount: 0, isPromo: false },
            { id: 'bev-5', name: 'Iced Americano', description: 'Refreshing cold brew with a double shot of espresso', price: 25000, image: 'img/menu-5.png', category: 'beverages', discount: 0, isPromo: false },
            { id: 'bev-6', name: 'Mocha Frappe', description: 'Blended chocolate coffee with whipped cream topping', price: 35000, image: 'img/menu-6.png', category: 'beverages', discount: 0, isPromo: false }
        ],
        food: [
            { id: 'food-1', name: 'Nasi Goreng Special', description: 'Classic Indonesian fried rice with chicken, egg, and sambal', price: 45000, image: 'img/menu-7.png', category: 'food', discount: 0, isPromo: false },
            { id: 'food-2', name: 'Mie Goreng Jawa', description: 'Traditional Javanese stir-fried noodles with vegetables', price: 40000, image: 'img/menu-8.png', category: 'food', discount: 0, isPromo: false },
            { id: 'food-3', name: 'Ayam Penyet', description: 'Smashed fried chicken with sambal and steamed rice', price: 52000, image: 'img/menu-9.png', category: 'food', discount: 0, isPromo: false },
            { id: 'food-4', name: 'Sate Ayam', description: 'Grilled chicken skewers with peanut sauce and lontong', price: 48000, image: 'img/menu-10.png', category: 'food', discount: 0, isPromo: false },
            { id: 'food-5', name: 'Gado-Gado', description: 'Mixed vegetable salad with peanut dressing and egg', price: 38000, image: 'img/menu-11.png', category: 'food', discount: 0, isPromo: false },
            { id: 'food-6', name: 'Rendang Daging', description: 'Slow-cooked beef in rich coconut and spice gravy', price: 65000, image: 'img/menu-12.png', category: 'food', discount: 0, isPromo: false }
        ]
    };

    let menuData = JSON.parse(JSON.stringify(defaultMenuData));
    let allItems = [...menuData.beverages, ...menuData.food];

    // ============================================
    // STATE MANAGEMENT
    // [PRESERVED] Original state shape + new admin/invoice states
    // ============================================
    const state = {
        cart: {},
        activeCategory: 'all',
        checkoutData: {
            tableNumber: '',
            customerName: '',
            paymentMethod: '',
            orderNotes: ''  // [NEW FEATURE]
        },
        // NEW: Admin & Invoice state
        currentOrderId: null,
        lastOrder: null,
        adminAuthenticated: false,
        adminActiveTab: 'menu',
        ordersData: [],
        menuDataLoaded: false,
        paymentsData: []  // [NEW FEATURE]
    };

    // NEW: Secret click tracker
    const secretClick = {
        count: 0,
        lastTime: 0
    };

    // ============================================
    // UTILITY FUNCTIONS
    // [PRESERVED] Original helpers
    // ============================================
    function formatRupiah(amount) {
        return 'Rp ' + amount.toLocaleString('id-ID');
    }

    // [FIXED] Apply discount calculation
    function getItemFinalPrice(item) {
        if (item.discount > 0) {
            return Math.round(item.price * (1 - item.discount / 100));
        }
        return item.price;
    }

    // [FIXED] Discount-aware cart total
    function getCartTotal() {
        let total = 0;
        let count = 0;
        for (const itemId in state.cart) {
            const item = allItems.find(i => i.id === itemId);
            if (item) {
                const finalPrice = getItemFinalPrice(item);
                total += finalPrice * state.cart[itemId];
                count += state.cart[itemId];
            }
        }
        return { total, count };
    }

    // [FIXED] Discount-aware cart items
    function getCartItems() {
        const items = [];
        for (const itemId in state.cart) {
            const item = allItems.find(i => i.id === itemId);
            if (item) {
                const finalPrice = getItemFinalPrice(item);
                items.push({ ...item, quantity: state.cart[itemId], finalPrice: finalPrice });
            }
        }
        return items;
    }

    function padTableNumber(raw) {
        const num = parseInt(raw, 10);
        if (isNaN(num)) return raw;
        return String(num).padStart(3, '0');
    }

    // ============================================
    // DOM REFERENCES
    // [PRESERVED] All original refs + new feature refs
    // ============================================
    const DOM = {
        // [PRESERVED] Original elements
        loadingScreen: document.getElementById('loading-screen'),
        mainDashboard: document.getElementById('main-dashboard'),
        menuContainer: document.getElementById('menu-container'),
        floatingCart: document.getElementById('floating-cart'),
        cartBadge: document.getElementById('cart-badge'),
        cartCount: document.getElementById('cart-count'),
        cartTotal: document.getElementById('cart-total'),
        cartCtaBtn: document.getElementById('cart-cta-btn'),
        cartModal: document.getElementById('cart-modal'),
        cartSheet: document.getElementById('cart-sheet'),
        cartClose: document.getElementById('cart-close'),
        cartItemsList: document.getElementById('cart-items-list'),
        summarySubtotal: document.getElementById('summary-subtotal'),
        summaryTotal: document.getElementById('summary-total'),
        confirmOrderBtn: document.getElementById('confirm-order-btn'),
        checkoutView: document.getElementById('checkout-view'),
        backToMenu: document.getElementById('back-to-menu'),
        tableNumber: document.getElementById('table-number'),
        customerName: document.getElementById('customer-name'),
        orderNotes: document.getElementById('order-notes'),  // [NEW FEATURE]
        miniCartList: document.getElementById('mini-cart-list'),
        miniCartTotal: document.getElementById('mini-cart-total'),
        checkoutCtaBtn: document.getElementById('checkout-cta-btn'),
        doubleCheckModal: document.getElementById('double-check-modal'),
        reviewTable: document.getElementById('review-table'),
        reviewName: document.getElementById('review-name'),
        reviewPayment: document.getElementById('review-payment'),
        reviewDate: document.getElementById('review-date'),
        reviewItems: document.getElementById('review-items'),
        reviewTotal: document.getElementById('review-total'),
        reviewOrderBtn: document.getElementById('review-order-btn'),
        proceedOrderBtn: document.getElementById('proceed-order-btn'),
        postCheckoutModal: document.getElementById('post-checkout-modal'),
        orderAgainBtn: document.getElementById('order-again-btn'),
        // NEW: Secret Login
        secretLoginModal: document.getElementById('secret-login-modal'),
        secretLoginClose: document.getElementById('secret-login-close'),
        adminPin: document.getElementById('admin-pin'),
        pinError: document.getElementById('pin-error'),
        verifyPinBtn: document.getElementById('verify-pin-btn'),
        // NEW: Admin Dashboard
        adminDashboard: document.getElementById('admin-dashboard'),
        adminLogout: document.getElementById('admin-logout'),
        adminMenuTable: document.querySelector('#admin-menu-table tbody'),
        adminOrdersTable: document.querySelector('#admin-orders-table tbody'),
        menuForm: document.getElementById('menu-form'),
        menuEditId: document.getElementById('menu-edit-id'),
        menuCategory: document.getElementById('menu-category'),
        menuName: document.getElementById('menu-name'),
        menuDesc: document.getElementById('menu-desc'),
        menuPrice: document.getElementById('menu-price'),
        menuDiscount: document.getElementById('menu-discount'),
        menuImage: document.getElementById('menu-image'),
        menuPromo: document.getElementById('menu-promo'),
        menuResetBtn: document.getElementById('menu-reset-btn'),
        panelMenu: document.getElementById('panel-menu'),
        panelOrders: document.getElementById('panel-orders'),
        refreshOrders: document.getElementById('refresh-orders'),
        // NEW: Payment Admin
        panelPayments: document.getElementById('panel-payments'),  // [NEW FEATURE]
        paymentForm: document.getElementById('payment-form'),  // [NEW FEATURE]
        paymentEditId: document.getElementById('payment-edit-id'),  // [NEW FEATURE]
        paymentName: document.getElementById('payment-name'),  // [NEW FEATURE]
        paymentLogo: document.getElementById('payment-logo'),  // [NEW FEATURE]
        paymentQr: document.getElementById('payment-qr'),  // [NEW FEATURE]
        paymentResetBtn: document.getElementById('payment-reset-btn'),  // [NEW FEATURE]
        adminPaymentsTable: document.querySelector('#admin-payments-table tbody'),  // [NEW FEATURE]
        // NEW: QR Invoice
        qrInvoiceView: document.getElementById('qr-invoice-view'),
        backFromQr: document.getElementById('back-from-qr'),
        qrOrderId: document.getElementById('qr-order-id'),
        paymentQrImage: document.getElementById('payment-qr-image'),  // [MODIFIED]
        paymentQrInstruction: document.getElementById('payment-qr-instruction'),  // [MODIFIED]
        uploadArea: document.getElementById('upload-area'),
        proofFile: document.getElementById('proof-file'),
        uploadPlaceholder: document.getElementById('upload-placeholder'),
        uploadPreview: document.getElementById('upload-preview'),
        proofPreviewImg: document.getElementById('proof-preview-img'),
        removeProof: document.getElementById('remove-proof'),
        uploadProofBtn: document.getElementById('upload-proof-btn'),
        receiptPreview: document.getElementById('receipt-preview'),
        downloadReceiptBtn: document.getElementById('download-receipt-btn'),  // [MODIFIED]
        receiptModal: document.getElementById('receipt-modal'),
        receiptClose: document.getElementById('receipt-close'),
        receiptPrintArea: document.getElementById('receipt-print-area'),
        // [NEW FEATURE]
        syncOverlay: document.getElementById('sync-overlay'),
        paymentGrid: document.getElementById('payment-grid'),
        thermalPrintArea: document.getElementById('thermal-print-area')
    };

    // ============================================
    // BUG FIX 1: CENTRALIZED REACTIVE RENDER ENGINE
    // [PRESERVED] Original unified render cycle
    // ============================================
    function renderAll() {
        updateMenuQuantities();
        updateCartUI();
        renderCartItems();
        renderMiniCart();
    }

    // ============================================
    // RENDER FUNCTIONS
    // [PRESERVED] Original menu/cart/checkout renderers
    // ============================================
    function renderMenuItems() {
        let itemsToRender = [];
        if (state.activeCategory === 'all') {
            itemsToRender = allItems;
        } else {
            itemsToRender = menuData[state.activeCategory] || [];
        }

        if (state.activeCategory === 'all') {
            const categories = ['beverages', 'food'];
            let html = '';
            categories.forEach(cat => {
                const catItems = menuData[cat];
                if (!catItems || catItems.length === 0) return;
                const catLabel = cat === 'beverages' ? 'Barista Craft Beverages' : 'Indonesian Culinary Classics';
                html += '<div class="category-section">';
                html += '<h2 class="category-title">' + catLabel + '</h2>';
                html += '<div class="category-items">';
                catItems.forEach(item => { html += renderMenuCard(item); });
                html += '</div></div>';
            });
            DOM.menuContainer.innerHTML = html;
        } else {
            const catLabel = state.activeCategory === 'beverages' ? 'Barista Craft Beverages' : 'Indonesian Culinary Classics';
            let html = '<div class="category-section">';
            html += '<h2 class="category-title">' + catLabel + '</h2>';
            html += '<div class="category-items">';
            itemsToRender.forEach(item => { html += renderMenuCard(item); });
            html += '</div></div>';
            DOM.menuContainer.innerHTML = html;
        }
    }

    function renderMenuCard(item) {
        const qty = state.cart[item.id] || 0;
        const finalPrice = getItemFinalPrice(item);
        const promoBadge = item.isPromo ? '<span class="promo-badge">PROMO</span>' : '';
        const priceDisplay = item.discount > 0
            ? '<p class="menu-price" style="text-decoration:line-through;color:var(--text-muted);font-size:0.875rem;margin-bottom:2px;">' + formatRupiah(item.price) + '</p><p class="menu-price">' + formatRupiah(finalPrice) + '</p>'
            : '<p class="menu-price">' + formatRupiah(item.price) + '</p>';

        return `
            <div class="menu-card" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="menu-image" onerror="this.style.background='var(--light-gray)'">
                <div class="menu-info">
                    <div>
                        ${promoBadge}
                        <h3 class="menu-title">${item.name}</h3>
                        <p class="menu-description">${item.description}</p>
                        ${priceDisplay}
                    </div>
                    <div class="menu-actions">
                        <button class="qty-btn minus-btn" data-id="${item.id}" ${qty === 0 ? 'disabled' : ''}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                        <span class="qty-display" data-id="${item.id}">${qty}</span>
                        <button class="qty-btn plus-btn" data-id="${item.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function updateCartUI() {
        const { total, count } = getCartTotal();
        DOM.cartBadge.textContent = count;
        DOM.cartCount.textContent = count + (count === 1 ? ' item' : ' items');
        DOM.cartTotal.textContent = formatRupiah(total);
        if (count === 0) {
            DOM.floatingCart.classList.add('empty');
        } else {
            DOM.floatingCart.classList.remove('empty');
        }
    }

    function updateMenuQuantities() {
        for (const itemId in state.cart) {
            const qty = state.cart[itemId];
            const displayEl = document.querySelector('.qty-display[data-id="' + itemId + '"]');
            const minusBtn = document.querySelector('.minus-btn[data-id="' + itemId + '"]');
            if (displayEl) displayEl.textContent = qty;
            if (minusBtn) minusBtn.disabled = qty === 0;
        }
        document.querySelectorAll('.qty-display').forEach(el => {
            const id = el.getAttribute('data-id');
            if (!state.cart[id]) {
                el.textContent = '0';
                const minusBtn = document.querySelector('.minus-btn[data-id="' + id + '"]');
                if (minusBtn) minusBtn.disabled = true;
            }
        });
    }

    // [FIXED] Discount-aware cart items rendering
    function renderCartItems() {
        const items = getCartItems();
        if (items.length === 0) {
            DOM.cartItemsList.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px 0;">Your cart is empty</p>';
            DOM.summarySubtotal.textContent = formatRupiah(0);
            DOM.summaryTotal.textContent = formatRupiah(0);
            return;
        }
        let html = '';
        let subtotal = 0;
        items.forEach(item => {
            const itemTotal = item.finalPrice * item.quantity;
            subtotal += itemTotal;
            const priceLine = item.discount > 0
                ? '<p class="cart-item-price" style="text-decoration:line-through;color:var(--text-muted);font-size:0.75rem;">' + formatRupiah(item.price) + '</p><p class="cart-item-price">' + formatRupiah(item.finalPrice) + '</p>'
                : '<p class="cart-item-price">' + formatRupiah(item.price) + '</p>';
            html += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.style.background='var(--light-gray)'">
                    <div class="cart-item-info">
                        <p class="cart-item-title">${item.name}</p>
                        ${priceLine}
                    </div>
                    <div class="cart-item-actions">
                        <button class="cart-item-qty-btn remove-btn" data-id="${item.id}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                        <span class="cart-item-qty">${item.quantity}</span>
                        <button class="cart-item-qty-btn" data-id="${item.id}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        });
        DOM.cartItemsList.innerHTML = html;
        DOM.summarySubtotal.textContent = formatRupiah(subtotal);
        DOM.summaryTotal.textContent = formatRupiah(subtotal);
    }

    // [FIXED] Discount-aware mini cart
    function renderMiniCart() {
        const items = getCartItems();
        if (items.length === 0) {
            DOM.miniCartList.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;">No items selected</p>';
            DOM.miniCartTotal.textContent = formatRupiah(0);
            return;
        }
        let html = '';
        let total = 0;
        items.forEach(item => {
            const itemTotal = item.finalPrice * item.quantity;
            total += itemTotal;
            html += `
                <div class="mini-cart-item">
                    <span>
                        <span class="mini-cart-item-name">${item.name}</span>
                        <span class="mini-cart-item-qty">x${item.quantity}</span>
                    </span>
                    <span class="mini-cart-item-price">${formatRupiah(itemTotal)}</span>
                </div>
            `;
        });
        DOM.miniCartList.innerHTML = html;
        DOM.miniCartTotal.textContent = formatRupiah(total);
    }

    // [FIXED] Discount-aware review
    function renderReview() {
        const items = getCartItems();
        const { total } = getCartTotal();
        const now = new Date();
        const paddedTable = padTableNumber(state.checkoutData.tableNumber);
        DOM.reviewTable.textContent = paddedTable || '-';
        DOM.reviewName.textContent = state.checkoutData.customerName || '-';
        DOM.reviewPayment.textContent = state.checkoutData.paymentMethod;
        DOM.reviewDate.textContent = now.toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        DOM.reviewTotal.textContent = formatRupiah(total);
        let html = '';
        items.forEach(item => {
            const lineTotal = item.finalPrice * item.quantity;
            const priceLabel = item.discount > 0
                ? '<span style="text-decoration:line-through;color:var(--text-muted);font-size:0.75rem;">' + formatRupiah(item.price) + '</span> <span>' + formatRupiah(item.finalPrice) + '</span>'
                : formatRupiah(item.finalPrice);
            html += `
                <div class="review-item">
                    <span>
                        <span class="review-item-name">${item.name}</span>
                        <span class="review-item-qty">x${item.quantity}</span>
                    </span>
                    <span class="review-item-price">${formatRupiah(lineTotal)}</span>
                </div>
            `;
        });
        DOM.reviewItems.innerHTML = html;
    }

    // ============================================
    // CART OPERATIONS
    // [PRESERVED] Original cart mutations
    // ============================================
    function addToCart(itemId) {
        if (!state.cart[itemId]) state.cart[itemId] = 0;
        state.cart[itemId]++;
        renderAll();
    }

    function removeFromCart(itemId) {
        if (state.cart[itemId]) {
            state.cart[itemId]--;
            if (state.cart[itemId] <= 0) delete state.cart[itemId];
        }
        renderAll();
    }

    function clearCart() {
        state.cart = {};
        renderAll();
    }

    // ============================================
    // VIEW NAVIGATION
    // [PRESERVED] Original view switchers + new views
    // ============================================
    function showLoadingScreen() {
        DOM.loadingScreen.classList.remove('hidden');
        DOM.mainDashboard.classList.add('hidden');
        DOM.checkoutView.classList.add('hidden');
        DOM.adminDashboard.classList.add('hidden');
        DOM.qrInvoiceView.classList.add('hidden');
    }

    function showMainDashboard() {
        DOM.loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            DOM.loadingScreen.classList.add('hidden');
            DOM.loadingScreen.classList.remove('fade-out');
            DOM.mainDashboard.classList.remove('hidden');
            DOM.checkoutView.classList.add('hidden');
            DOM.adminDashboard.classList.add('hidden');
            DOM.qrInvoiceView.classList.add('hidden');
        }, 500);
    }

    function showCheckout() {
        DOM.mainDashboard.classList.add('hidden');
        DOM.checkoutView.classList.remove('hidden');
        DOM.adminDashboard.classList.add('hidden');
        DOM.qrInvoiceView.classList.add('hidden');
        renderMiniCart();
        renderPaymentOptions();  // [NEW FEATURE] Dynamic payment options
        DOM.tableNumber.value = state.checkoutData.tableNumber;
        DOM.customerName.value = state.checkoutData.customerName;
        if (DOM.orderNotes) DOM.orderNotes.value = state.checkoutData.orderNotes || '';
        const paymentInput = document.querySelector('input[name="payment"][value="' + state.checkoutData.paymentMethod + '"]');
        if (paymentInput) paymentInput.checked = true;
    }

    function showMainFromCheckout() {
        DOM.checkoutView.classList.add('hidden');
        DOM.qrInvoiceView.classList.add('hidden');
        DOM.adminDashboard.classList.add('hidden');
        DOM.mainDashboard.classList.remove('hidden');
    }

    // NEW: Admin Dashboard
    function showAdminDashboard() {
        DOM.loadingScreen.classList.add('hidden');
        DOM.mainDashboard.classList.add('hidden');
        DOM.checkoutView.classList.add('hidden');
        DOM.qrInvoiceView.classList.add('hidden');
        DOM.adminDashboard.classList.remove('hidden');
        renderAdminMenu();
        renderAdminOrders();
        renderAdminPayments();  // [NEW FEATURE]
        startOrderPolling();
    }

    // NEW: QR Invoice View
    function showQrInvoiceView() {
        DOM.loadingScreen.classList.add('hidden');
        DOM.mainDashboard.classList.add('hidden');
        DOM.checkoutView.classList.add('hidden');
        DOM.adminDashboard.classList.add('hidden');
        DOM.qrInvoiceView.classList.remove('hidden');
        DOM.qrOrderId.textContent = 'Order ID: ' + state.currentOrderId;
        
        // [MODIFIED] Dynamic QR based on payment method
        const paymentMethod = state.lastOrder ? state.lastOrder.checkoutData.paymentMethod : state.checkoutData.paymentMethod;
        const payment = state.paymentsData.find(p => p.Name === paymentMethod);
        if (payment && payment.QR_URL) {
            DOM.paymentQrImage.src = payment.QR_URL;
            DOM.paymentQrInstruction.textContent = 'Scan this QR using ' + payment.Name + ' to complete payment';
        } else {
            DOM.paymentQrImage.src = 'img/qris-placeholder.png';
            DOM.paymentQrInstruction.textContent = 'Show this QR to the cashier or scan with your e-wallet';
        }
        
        generateReceiptPreview();
    }

    function showMainFromQr() {
        DOM.qrInvoiceView.classList.add('hidden');
        DOM.mainDashboard.classList.remove('hidden');
        resetApplication();
    }

    // ============================================
    // MODAL OPERATIONS
    // [PRESERVED] Original modal helpers
    // ============================================
    function openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ============================================
    // [NEW FEATURE] SYNC OVERLAY
    // ============================================
    function showSyncOverlay() {
        DOM.syncOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function hideSyncOverlay() {
        DOM.syncOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // ============================================
    // NEW: DYNAMIC MENU LOADING FROM GAS
    // [MODIFIED] Added sync overlay control
    // ============================================
    async function loadMenuFromSheet() {
        if (!SCRIPT_URL || SCRIPT_URL.includes('ISI_URL')) {
            console.warn('SCRIPT_URL not configured. Using local data.');
            state.menuDataLoaded = true;
            return;
        }
        // [NEW FEATURE] Show sync overlay
        showSyncOverlay();
        try {
            const res = await fetch(SCRIPT_URL + '?action=getMenu');
            const json = await res.json();
            if (json.success && json.data && json.data.length > 0) {
                const newMenu = { beverages: [], food: [] };
                json.data.forEach(item => {
                    const cat = (item.Category || 'beverages').toLowerCase();
                    const menuItem = {
                        id: item.ID,
                        name: item.Name,
                        description: item.Description,
                        price: Number(item.Price) || 0,
                        image: item.Image_URL || 'img/menu-placeholder.png',
                        category: cat,
                        discount: Number(item.Discount) || 0,
                        isPromo: !!item.Is_Promo
                    };
                    if (newMenu[cat]) newMenu[cat].push(menuItem);
                    else newMenu['beverages'].push(menuItem);
                });
                menuData = newMenu;
                allItems = [...(menuData.beverages || []), ...(menuData.food || [])];
                state.menuDataLoaded = true;
                renderMenuItems();
                renderAll();
            }
        } catch (err) {
            console.error('Failed to load menu from sheet:', err);
        } finally {
            // [NEW FEATURE] Hide sync overlay only after promise resolves
            hideSyncOverlay();
        }
    }

    // ============================================
    // [NEW FEATURE] DYNAMIC PAYMENT LOADING
    // ============================================
    async function loadPaymentsFromSheet() {
        if (!SCRIPT_URL || SCRIPT_URL.includes('ISI_URL')) {
            // Fallback default payments
            state.paymentsData = [
                { ID: 'pay-1', Name: 'QRIS', Logo_URL: 'img/payment-qris.png', QR_URL: 'img/qris-placeholder.png' },
                { ID: 'pay-2', Name: 'GoPay', Logo_URL: 'img/payment-gopay.png', QR_URL: 'img/qris-placeholder.png' },
                { ID: 'pay-3', Name: 'OVO', Logo_URL: 'img/payment-ovo.png', QR_URL: 'img/qris-placeholder.png' },
                { ID: 'pay-4', Name: 'DANA', Logo_URL: 'img/payment-dana.png', QR_URL: 'img/qris-placeholder.png' },
                { ID: 'pay-5', Name: 'Bank Transfer', Logo_URL: 'img/payment-bank-transfer.png', QR_URL: 'img/qris-placeholder.png' }
            ];
            return;
        }
        try {
            const res = await fetch(SCRIPT_URL + '?action=getPayments');
            const json = await res.json();
            if (json.success && json.data) {
                state.paymentsData = json.data;
                if (state.paymentsData.length > 0 && !state.checkoutData.paymentMethod) {
                    state.checkoutData.paymentMethod = state.paymentsData[0].Name;
                }
            }
        } catch (err) {
            console.error('Failed to load payments:', err);
        }
    }

    // [NEW FEATURE] Render payment options dynamically in checkout
    function renderPaymentOptions() {
        if (!DOM.paymentGrid) return;
        if (state.paymentsData.length === 0) {
            DOM.paymentGrid.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;">No payment methods available</p>';
            return;
        }
        let html = '';
        state.paymentsData.forEach((payment, index) => {
            const isChecked = state.checkoutData.paymentMethod === payment.Name || index === 0;
            html += `
                <label class="payment-option">
                    <input type="radio" name="payment" value="${payment.Name}" ${isChecked ? 'checked' : ''}>
                    <div class="payment-card">
                        <div class="payment-icon-wrap">
                            <img src="${payment.Logo_URL || 'img/payment-default.png'}" alt="${payment.Name}" class="payment-logo-img" onerror="this.src='img/payment-default.png'">
                        </div>
                        <span>${payment.Name}</span>
                    </div>
                </label>
            `;
        });
        DOM.paymentGrid.innerHTML = html;
        // Re-attach listeners
        document.querySelectorAll('input[name="payment"]').forEach(input => {
            input.addEventListener('change', function() {
                state.checkoutData.paymentMethod = this.value;
            });
        });
    }

    // ============================================
    // NEW: ADMIN DASHBOARD - MENU CRUD
    // ============================================
    function renderAdminMenu() {
        const tbody = DOM.adminMenuTable;
        let html = '';
        allItems.forEach(item => {
            const promoBadge = item.isPromo ? '<span class="status-badge lunas" style="margin-left:4px;">PROMO</span>' : '';
            const finalPrice = getItemFinalPrice(item);
            const priceDisplay = item.discount > 0
                ? '<div>' + formatRupiah(finalPrice) + '</div><div style="text-decoration:line-through;color:var(--text-muted);font-size:0.75rem;">' + formatRupiah(item.price) + '</div>'
                : formatRupiah(item.price);
            html += `
                <tr>
                    <td><img src="${item.image}" class="menu-thumb" onerror="this.style.display='none'"></td>
                    <td>
                        <div style="font-weight:600;">${item.name}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:capitalize;">${item.category}</div>
                        ${promoBadge}
                    </td>
                    <td>${priceDisplay}</td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn edit" data-id="${item.id}" title="Edit">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="action-btn delete" data-id="${item.id}" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px;">No menu items</td></tr>';
    }

    async function saveMenuItem(e) {
        e.preventDefault();
        const id = DOM.menuEditId.value || 'menu-' + Date.now();
        const payload = {
            action: 'updateMenu',
            id: id,
            category: DOM.menuCategory.value,
            name: DOM.menuName.value,
            description: DOM.menuDesc.value,
            price: Number(DOM.menuPrice.value) || 0,
            imageUrl: DOM.menuImage.value,
            discount: Number(DOM.menuDiscount.value) || 0,
            isPromo: DOM.menuPromo.checked
        };
        try {
            const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
            const json = await res.json();
            if (json.success) {
                await loadMenuFromSheet();
                renderAdminMenu();
                resetMenuForm();
            } else {
                alert('Error: ' + json.error);
            }
        } catch (err) {
            alert('Save failed: ' + err.message);
        }
    }

    function resetMenuForm() {
        DOM.menuForm.reset();
        DOM.menuEditId.value = '';
    }

    function editMenuItem(id) {
        const item = allItems.find(i => i.id === id);
        if (!item) return;
        DOM.menuEditId.value = item.id;
        DOM.menuCategory.value = item.category;
        DOM.menuName.value = item.name;
        DOM.menuDesc.value = item.description || '';
        DOM.menuPrice.value = item.price;
        DOM.menuImage.value = item.image || '';
        DOM.menuDiscount.value = item.discount || 0;
        DOM.menuPromo.checked = item.isPromo || false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function deleteMenuItem(id) {
        if (!confirm('Delete this menu item?')) return;
        try {
            const res = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'deleteMenu', id: id })
            });
            const json = await res.json();
            if (json.success) {
                await loadMenuFromSheet();
                renderAdminMenu();
            } else {
                alert('Error: ' + json.error);
            }
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    }

    // ============================================
    // [NEW FEATURE] ADMIN DASHBOARD - PAYMENT CRUD
    // ============================================
    function renderAdminPayments() {
        const tbody = DOM.adminPaymentsTable;
        if (!tbody) return;
        let html = '';
        state.paymentsData.forEach(payment => {
            html += `
                <tr>
                    <td><img src="${payment.Logo_URL || ''}" class="menu-thumb" onerror="this.style.display='none'"></td>
                    <td><div style="font-weight:600;">${payment.Name}</div></td>
                    <td><img src="${payment.QR_URL || ''}" class="menu-thumb" onerror="this.style.display='none'"></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn edit" data-payment="${payment.ID}" title="Edit">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="action-btn delete" data-payment="${payment.ID}" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px;">No payment methods</td></tr>';
    }

    async function savePaymentItem(e) {
        e.preventDefault();
        const id = DOM.paymentEditId.value || 'pay-' + Date.now();
        const payload = {
            action: 'savePayment',
            id: id,
            name: DOM.paymentName.value,
            logoUrl: DOM.paymentLogo.value,
            qrUrl: DOM.paymentQr.value
        };
        try {
            const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
            const json = await res.json();
            if (json.success) {
                await loadPaymentsFromSheet();
                renderAdminPayments();
                resetPaymentForm();
                renderPaymentOptions(); // Update checkout view too
            } else {
                alert('Error: ' + json.error);
            }
        } catch (err) {
            alert('Save failed: ' + err.message);
        }
    }

    function resetPaymentForm() {
        DOM.paymentForm.reset();
        DOM.paymentEditId.value = '';
    }

    function editPaymentItem(id) {
        const payment = state.paymentsData.find(p => p.ID === id);
        if (!payment) return;
        DOM.paymentEditId.value = payment.ID;
        DOM.paymentName.value = payment.Name || '';
        DOM.paymentLogo.value = payment.Logo_URL || '';
        DOM.paymentQr.value = payment.QR_URL || '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function deletePaymentItem(id) {
        if (!confirm('Delete this payment method?')) return;
        try {
            const res = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'deletePayment', id: id })
            });
            const json = await res.json();
            if (json.success) {
                await loadPaymentsFromSheet();
                renderAdminPayments();
                renderPaymentOptions();
            } else {
                alert('Error: ' + json.error);
            }
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    }

    // ============================================
    // NEW: ADMIN DASHBOARD - ORDER MONITOR
    // ============================================
    async function renderAdminOrders() {
        if (!SCRIPT_URL || SCRIPT_URL.includes('ISI_URL')) return;
        try {
            DOM.refreshOrders.classList.add('spinning');
            const res = await fetch(SCRIPT_URL + '?action=getOrders');
            const json = await res.json();
            DOM.refreshOrders.classList.remove('spinning');
            if (!json.success) return;
            state.ordersData = json.data || [];
            const sorted = [...state.ordersData].sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
            const tbody = DOM.adminOrdersTable;
            let html = '';
            const payOptions = ['Belum Dibayar', 'Lunas'];
            const orderOptions = ['Diproses', 'Selesai', 'Dibatalkan'];

            sorted.forEach(order => {
                const date = new Date(order.Timestamp);
                const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                const total = Number(order.TotalPrice) || 0;

                const paySelect = `<select class="status-select" data-field="payment" data-order="${order.OrderID}">
                    ${payOptions.map(o => `<option value="${o}" ${order.PaymentStatus === o ? 'selected' : ''}>${o}</option>`).join('')}
                </select>`;
                const statusSelect = `<select class="status-select" data-field="status" data-order="${order.OrderID}">
                    ${orderOptions.map(o => `<option value="${o}" ${order.OrderStatus === o ? 'selected' : ''}>${o}</option>`).join('')}
                </select>`;

                // [NEW FEATURE] Cetak Struk button
                html += `
                    <tr>
                        <td><div>${timeStr}</div><div style="font-size:0.75rem;color:var(--text-muted);">${dateStr}</div></td>
                        <td>${order.TableNumber || '-'}</td>
                        <td>${order.CustomerName || '-'}</td>
                        <td style="font-weight:600;">${formatRupiah(total)}</td>
                        <td>${paySelect}</td>
                        <td>${statusSelect}</td>
                        <td>
                            <div class="action-btns">
                                <button class="action-btn edit" data-order="${order.OrderID}" data-action="print" title="Cetak Struk">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                                </button>
                                <button class="action-btn delete" data-order="${order.OrderID}" title="Delete">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px;">No orders yet</td></tr>';
        } catch (err) {
            DOM.refreshOrders.classList.remove('spinning');
            console.error('Failed to load orders:', err);
        }
    }

    async function updateOrderField(orderId, field, value) {
        const payload = { action: 'updateOrderStatus', orderId: orderId };
        if (field === 'payment') payload.paymentStatus = value;
        if (field === 'status') payload.orderStatus = value;
        try {
            const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
            const json = await res.json();
            if (!json.success) console.error(json.error);
        } catch (err) {
            console.error(err);
        }
    }

    async function deleteOrder(orderId) {
        if (!confirm('Delete this order?')) return;
        try {
            const res = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'deleteOrder', orderId: orderId })
            });
            const json = await res.json();
            if (json.success) renderAdminOrders();
            else alert('Error: ' + json.error);
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    }

    // [NEW FEATURE] Thermal receipt print for cashier
    function printThermalReceipt(orderId) {
        const order = state.ordersData.find(o => o.OrderID === orderId);
        if (!order) return;
        
        const date = new Date(order.Timestamp);
        const timeStr = date.toLocaleString('id-ID');
        const itemsStr = order.Items_Ordered || '';
        
        const html = `
            <div class="thermal-receipt">
                <div class="t-header">BARISYU</div>
                <div class="t-sub">Crafted with Passion</div>
                <div class="t-divider"></div>
                <div class="t-row"><span>Order ID</span><span>${order.OrderID}</span></div>
                <div class="t-row"><span>Date</span><span>${timeStr}</span></div>
                <div class="t-row"><span>Table</span><span>${order.TableNumber || '-'}</span></div>
                <div class="t-row"><span>Customer</span><span>${order.CustomerName || '-'}</span></div>
                <div class="t-row"><span>Payment</span><span>${order.PaymentMethod || '-'}</span></div>
                <div class="t-divider"></div>
                <div class="t-items">${itemsStr.replace(/; /g, '<br>')}</div>
                <div class="t-divider"></div>
                <div class="t-row t-total"><span>TOTAL</span><span>${formatRupiah(Number(order.TotalPrice) || 0)}</span></div>
                <div class="t-row"><span>Status</span><span>${order.OrderStatus || '-'}</span></div>
                <div class="t-row"><span>Payment</span><span>${order.PaymentStatus || '-'}</span></div>
                <div class="t-divider"></div>
                <div class="t-footer">Thank you for visiting!<br>Barisyu Digital Menu</div>
            </div>
        `;
        
        DOM.thermalPrintArea.innerHTML = html;
        setTimeout(() => { window.print(); }, 300);
    }

    let orderPollInterval = null;
    function startOrderPolling() {
        if (orderPollInterval) clearInterval(orderPollInterval);
        orderPollInterval = setInterval(() => {
            if (state.adminAuthenticated) renderAdminOrders();
        }, 10000);
    }
    function stopOrderPolling() {
        if (orderPollInterval) { clearInterval(orderPollInterval); orderPollInterval = null; }
    }

    // ============================================
    // NEW: SECRET LOGIN (EASTER EGG)
    // ============================================
    function setupSecretLogin() {
        const trigger = document.getElementById('brand-title-trigger');
        if (!trigger) return;
        trigger.addEventListener('click', function() {
            const now = Date.now();
            if (now - secretClick.lastTime < 300) {
                secretClick.count++;
            } else {
                secretClick.count = 1;
            }
            secretClick.lastTime = now;
            if (secretClick.count >= 5) {
                secretClick.count = 0;
                openModal(DOM.secretLoginModal);
            }
        });
    }

    function verifyPin() {
        const pin = DOM.adminPin.value;
        if (pin === 'baris123') {
            state.adminAuthenticated = true;
            closeModal(DOM.secretLoginModal);
            DOM.adminPin.value = '';
            DOM.pinError.classList.add('hidden');
            showAdminDashboard();
        } else {
            DOM.pinError.classList.remove('hidden');
            DOM.adminPin.value = '';
        }
    }

    function logoutAdmin() {
        state.adminAuthenticated = false;
        stopOrderPolling();
        DOM.adminDashboard.classList.add('hidden');
        DOM.mainDashboard.classList.remove('hidden');
    }

    // ============================================
    // NEW: CHECKOUT WORKFLOW (GAS Integration)
    // Replaces WhatsApp redirect
    // ============================================
    async function submitOrder() {
        const items = getCartItems();
        const { total } = getCartTotal();
        const orderId = 'BYU-' + Date.now().toString(36).toUpperCase();

        // Store for receipt generation
        state.currentOrderId = orderId;
        state.lastOrder = {
            items: items,
            total: total,
            checkoutData: { ...state.checkoutData }
        };

        const payload = {
            action: 'saveOrder',
            orderId: orderId,
            tableNumber: padTableNumber(state.checkoutData.tableNumber),
            customerName: state.checkoutData.customerName,
            paymentMethod: state.checkoutData.paymentMethod,
            items: items,
            totalPrice: total,
            paymentStatus: 'Belum Dibayar',
            orderStatus: 'Diproses',
            orderNotes: state.checkoutData.orderNotes || ''  // [NEW FEATURE]
        };

        try {
            const res = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.success) {
                state.currentOrderId = json.orderId || orderId;
                clearCart();
                closeModal(DOM.doubleCheckModal);
                showQrInvoiceView();
            } else {
                alert('Failed to place order: ' + (json.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Network error. Please check your connection and try again.');
        }
    }

    // ============================================
    // NEW: QR & INVOICE VIEW LOGIC
    // ============================================
    function generateReceiptPreview() {
        if (!state.lastOrder) return;
        const { items, total, checkoutData } = state.lastOrder;
        const orderId = state.currentOrderId;
        const now = new Date();

        let itemsHtml = items.map(item => {
            const lineTotal = item.finalPrice * item.quantity;
            const priceLabel = item.discount > 0
                ? '<span style="text-decoration:line-through;color:var(--text-muted);">' + formatRupiah(item.price) + '</span> ' + formatRupiah(item.finalPrice)
                : formatRupiah(item.finalPrice);
            return `<div class="receipt-line"><span>${item.name} x${item.quantity} @${priceLabel}</span><span>${formatRupiah(lineTotal)}</span></div>`;
        }).join('');

        const notesLine = checkoutData.orderNotes
            ? `<div class="receipt-line" style="color:var(--accent-yellow);font-weight:600;"><span>Notes: ${checkoutData.orderNotes}</span></div>`
            : '';

        const html = `
            <div class="receipt-header">
                <h4>BARISYU</h4>
                <p>Crafted with Passion</p>
            </div>
            <div class="receipt-line"><span>Order ID</span><span>${orderId}</span></div>
            <div class="receipt-line"><span>Date</span><span>${now.toLocaleString('id-ID')}</span></div>
            <div class="receipt-line"><span>Table</span><span>${padTableNumber(checkoutData.tableNumber)}</span></div>
            <div class="receipt-line"><span>Customer</span><span>${checkoutData.customerName}</span></div>
            <div class="receipt-line"><span>Payment</span><span>${checkoutData.paymentMethod}</span></div>
            <hr style="border:none;border-top:1px dashed var(--medium-gray);margin:8px 0;">
            ${itemsHtml}
            ${notesLine}
            <div class="receipt-total">
                <span>TOTAL</span>
                <span>${formatRupiah(total)}</span>
            </div>
            <p style="text-align:center;margin-top:12px;font-size:0.75rem;color:var(--text-muted);">Thank you for ordering!</p>
        `;
        DOM.receiptPreview.innerHTML = html;
    }

    function generateReceiptPrintHTML() {
        if (!state.lastOrder) return '';
        const { items, total, checkoutData } = state.lastOrder;
        const orderId = state.currentOrderId;
        const now = new Date();

        let itemsHtml = items.map(item => {
            const lineTotal = item.finalPrice * item.quantity;
            return `<div class="print-row"><span>${item.name} x${item.quantity}</span><span>${formatRupiah(lineTotal)}</span></div>`;
        }).join('');

        return `
            <div class="print-header">
                <div class="print-logo">BARISYU</div>
                <div>Crafted with Passion</div>
            </div>
            <div class="print-meta">
                ${now.toLocaleString('id-ID')}<br>
                Order: ${orderId}<br>
                Table: ${padTableNumber(checkoutData.tableNumber)} | ${checkoutData.customerName}
            </div>
            <hr class="print-divider">
            <div class="print-row"><span>Payment Method</span><span>${checkoutData.paymentMethod}</span></div>
            <hr class="print-divider">
            ${itemsHtml}
            <div class="print-total">
                <span>TOTAL</span>
                <span>${formatRupiah(total)}</span>
            </div>
            <div class="print-footer">
                Thank you for your visit!<br>
                Barisyu Digital Menu
            </div>
        `;
    }

    function openReceiptModal() {
        DOM.receiptPrintArea.innerHTML = generateReceiptPrintHTML();
        openModal(DOM.receiptModal);
    }

    // [NEW FEATURE] Download receipt as image using Canvas API
    function downloadReceiptImage() {
        if (!state.lastOrder) return;
        const { items, total, checkoutData } = state.lastOrder;
        const orderId = state.currentOrderId;
        const now = new Date();
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 400;
        const lineHeight = 22;
        const padding = 20;
        
        // Calculate height
        let height = padding * 2 + 120; // header
        height += 5 * lineHeight; // meta lines
        height += 20; // divider
        height += items.length * lineHeight;
        if (checkoutData.orderNotes) height += lineHeight;
        height += 20; // divider
        height += lineHeight + 10; // total
        height += lineHeight + padding; // footer
        
        canvas.width = width * 2; // retina
        canvas.height = height * 2;
        ctx.scale(2, 2);
        
        // Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        let y = padding;
        
        // Header
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BARISYU', width / 2, y);
        y += 20;
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#6B7280';
        ctx.fillText('Crafted with Passion', width / 2, y);
        y += 25;
        
        // Divider
        ctx.strokeStyle = '#E5E7EB';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        ctx.setLineDash([]);
        y += 15;
        
        // Meta
        ctx.textAlign = 'left';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#374151';
        const metaLines = [
            ['Order ID', orderId],
            ['Date', now.toLocaleString('id-ID')],
            ['Table', padTableNumber(checkoutData.tableNumber)],
            ['Customer', checkoutData.customerName],
            ['Payment', checkoutData.paymentMethod]
        ];
        metaLines.forEach(([label, val]) => {
            ctx.fillStyle = '#9CA3AF';
            ctx.fillText(label, padding, y);
            ctx.fillStyle = '#111827';
            ctx.textAlign = 'right';
            ctx.fillText(String(val), width - padding, y);
            ctx.textAlign = 'left';
            y += lineHeight;
        });
        
        y += 5;
        ctx.strokeStyle = '#E5E7EB';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        ctx.setLineDash([]);
        y += 15;
        
        // Items
        items.forEach(item => {
            const lineTotal = item.finalPrice * item.quantity;
            ctx.fillStyle = '#111827';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(item.name + ' x' + item.quantity, padding, y);
            ctx.textAlign = 'right';
            ctx.fillText(formatRupiah(lineTotal), width - padding, y);
            ctx.textAlign = 'left';
            y += lineHeight;
        });
        
        if (checkoutData.orderNotes) {
            ctx.fillStyle = '#F59E0B';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.fillText('Notes: ' + checkoutData.orderNotes, padding, y);
            y += lineHeight;
        }
        
        y += 5;
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        ctx.lineWidth = 1;
        y += 20;
        
        // Total
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('TOTAL', padding, y);
        ctx.textAlign = 'right';
        ctx.fillText(formatRupiah(total), width - padding, y);
        y += 25;
        
        // Footer
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Thank you for ordering!', width / 2, y);
        y += 15;
        ctx.fillText('Barisyu Digital Menu', width / 2, y);
        
        // Download
        const link = document.createElement('a');
        link.download = 'Barisyu_Receipt_' + orderId + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // ============================================
    // NEW: PROOF OF PAYMENT UPLOAD
    // ============================================
    function handleProofFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            DOM.proofPreviewImg.src = evt.target.result;
            DOM.uploadPlaceholder.classList.add('hidden');
            DOM.uploadPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    function removeProofSelection() {
        DOM.proofFile.value = '';
        DOM.proofPreviewImg.src = '';
        DOM.uploadPreview.classList.add('hidden');
        DOM.uploadPlaceholder.classList.remove('hidden');
    }

    async function uploadProof() {
        const file = DOM.proofFile.files[0];
        if (!file) {
            alert('Please select an image first.');
            return;
        }
        DOM.uploadProofBtn.textContent = 'Uploading...';
        DOM.uploadProofBtn.disabled = true;

        const reader = new FileReader();
        reader.onload = async function(evt) {
            const base64 = evt.target.result.split(',')[1];
            const payload = {
                action: 'uploadProof',
                orderId: state.currentOrderId,
                fileName: file.name,
                mimeType: file.type,
                base64Data: base64
            };
            try {
                const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
                const json = await res.json();
                if (json.success) {
                    DOM.uploadProofBtn.textContent = 'Uploaded ✓';
                    DOM.uploadProofBtn.style.background = 'var(--primary-green-dark)';
                } else {
                    alert('Upload failed: ' + json.error);
                    DOM.uploadProofBtn.textContent = 'Submit Proof';
                    DOM.uploadProofBtn.disabled = false;
                }
            } catch (err) {
                alert('Upload error: ' + err.message);
                DOM.uploadProofBtn.textContent = 'Submit Proof';
                DOM.uploadProofBtn.disabled = false;
            }
        };
        reader.readAsDataURL(file);
    }

    // ============================================
    // [PRESERVED] Original WhatsApp compiler (now unused but kept)
    // ============================================
    function compileWhatsAppMessage() {
        const items = getCartItems();
        const { total } = getCartTotal();
        const now = new Date();
        const paddedTable = padTableNumber(state.checkoutData.tableNumber);
        let message = '*BARISYU - NEW ORDER*' + '\\n';
        message += '========================' + '\\n\\n';
        message += '*Date:* ' + now.toLocaleString('id-ID') + '\\n';
        message += '*Table:* ' + paddedTable + '\\n';
        message += '*Customer:* ' + state.checkoutData.customerName + '\\n';
        message += '*Payment:* ' + state.checkoutData.paymentMethod + '\\n\\n';
        message += '*ORDER ITEMS:*' + '\\n';
        message += '------------------------' + '\\n';
        items.forEach((item, index) => {
            const lineTotal = item.finalPrice * item.quantity;
            message += (index + 1) + '. ' + item.name + '\\n';
            message += '   Qty: ' + item.quantity + ' x ' + formatRupiah(item.finalPrice) + '\\n';
            message += '   Sub: ' + formatRupiah(lineTotal) + '\\n';
        });
        message += '------------------------' + '\\n';
        message += '*TOTAL: ' + formatRupiah(total) + '*\\n\\n';
        message += 'Thank you for ordering with Barisyu!';
        return encodeURIComponent(message);
    }

    function sendToWhatsApp() {
        const message = compileWhatsAppMessage();
        const phoneNumber = '6281382057596';
        const url = 'https://wa.me/' + phoneNumber + '?text=' + message;
        sessionStorage.setItem('barisyu_checkout_redirect', 'true');
        sessionStorage.setItem('barisyu_checkout_time', Date.now().toString());
        window.location.href = url;
    }

    // ============================================
    // POST-CHECKOUT DETECTION
    // [PRESERVED] Original return detection
    // ============================================
    function checkPostCheckout() {
        const redirected = sessionStorage.getItem('barisyu_checkout_redirect');
        const checkoutTime = sessionStorage.getItem('barisyu_checkout_time');
        if (redirected === 'true' && checkoutTime) {
            const elapsed = Date.now() - parseInt(checkoutTime);
            if (elapsed < 300000) {
                openModal(DOM.postCheckoutModal);
            }
            sessionStorage.removeItem('barisyu_checkout_redirect');
            sessionStorage.removeItem('barisyu_checkout_time');
        }
    }

    function resetApplication() {
        clearCart();
        state.checkoutData = { tableNumber: '', customerName: '', paymentMethod: state.paymentsData.length > 0 ? state.paymentsData[0].Name : '', orderNotes: '' };
        state.currentOrderId = null;
        state.lastOrder = null;
        DOM.tableNumber.value = '';
        DOM.customerName.value = '';
        if (DOM.orderNotes) DOM.orderNotes.value = '';
        const firstPayment = document.querySelector('input[name="payment"]');
        if (firstPayment) firstPayment.checked = true;
        if (state.paymentsData.length > 0) state.checkoutData.paymentMethod = state.paymentsData[0].Name;
        closeModal(DOM.postCheckoutModal);
        closeModal(DOM.doubleCheckModal);
        DOM.uploadProofBtn.textContent = 'Submit Proof';
        DOM.uploadProofBtn.disabled = false;
        DOM.uploadProofBtn.style.background = '';
        removeProofSelection();
    }

    // ============================================
    // EVENT LISTENERS
    // [PRESERVED] All original listeners + new feature wiring
    // ============================================
    function setupEventListeners() {
        // [PRESERVED] Category Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                state.activeCategory = this.getAttribute('data-category');
                renderMenuItems();
            });
        });

        // [PRESERVED] Menu Item Quantity Buttons (Event Delegation)
        DOM.menuContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('.qty-btn');
            if (!btn) return;
            const itemId = btn.getAttribute('data-id');
            if (!itemId) return;
            if (btn.classList.contains('plus-btn')) {
                addToCart(itemId);
            } else if (btn.classList.contains('minus-btn') && !btn.disabled) {
                removeFromCart(itemId);
            }
        });

        // [PRESERVED] Floating Cart CTA
        DOM.cartCtaBtn.addEventListener('click', function() {
            const { count } = getCartTotal();
            if (count > 0) {
                renderCartItems();
                openModal(DOM.cartModal);
            }
        });

        // [PRESERVED] Cart Modal Close
        DOM.cartClose.addEventListener('click', function() { closeModal(DOM.cartModal); });
        DOM.cartModal.addEventListener('click', function(e) {
            if (e.target === DOM.cartModal) closeModal(DOM.cartModal);
        });

        // [PRESERVED] Cart Item Actions (Event Delegation)
        DOM.cartItemsList.addEventListener('click', function(e) {
            const btn = e.target.closest('.cart-item-qty-btn');
            if (!btn) return;
            const itemId = btn.getAttribute('data-id');
            if (!itemId) return;
            if (btn.classList.contains('remove-btn')) {
                removeFromCart(itemId);
            } else {
                addToCart(itemId);
            }
        });

        // [PRESERVED] Confirm Order (from cart modal -> checkout)
        DOM.confirmOrderBtn.addEventListener('click', function() {
            const { count } = getCartTotal();
            if (count > 0) {
                closeModal(DOM.cartModal);
                showCheckout();
            }
        });

        // [PRESERVED] Back to Menu
        DOM.backToMenu.addEventListener('click', function() { showMainFromCheckout(); });

        // [PRESERVED] Form Input Tracking
        DOM.tableNumber.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            state.checkoutData.tableNumber = this.value;
        });
        DOM.customerName.addEventListener('input', function() {
            state.checkoutData.customerName = this.value;
        });
        // [NEW FEATURE] Order notes tracking
        if (DOM.orderNotes) {
            DOM.orderNotes.addEventListener('input', function() {
                state.checkoutData.orderNotes = this.value;
            });
        }

        // [MODIFIED] Payment Method Selection is now dynamic via renderPaymentOptions

        // [PRESERVED] Checkout CTA -> Double Check
        DOM.checkoutCtaBtn.addEventListener('click', function() {
            if (!state.checkoutData.tableNumber.trim()) {
                DOM.tableNumber.focus();
                DOM.tableNumber.style.borderColor = 'var(--danger)';
                setTimeout(() => { DOM.tableNumber.style.borderColor = ''; }, 2000);
                return;
            }
            if (!state.checkoutData.customerName.trim()) {
                DOM.customerName.focus();
                DOM.customerName.style.borderColor = 'var(--danger)';
                setTimeout(() => { DOM.customerName.style.borderColor = ''; }, 2000);
                return;
            }
            renderReview();
            openModal(DOM.doubleCheckModal);
        });

        // [MODIFIED] Proceed to Order -> Submit to GAS instead of WhatsApp
        DOM.proceedOrderBtn.addEventListener('click', function() {
            submitOrder();
        });

        // [PRESERVED] Review Order (go back)
        DOM.reviewOrderBtn.addEventListener('click', function() { closeModal(DOM.doubleCheckModal); });
        DOM.doubleCheckModal.addEventListener('click', function(e) {
            if (e.target === DOM.doubleCheckModal) closeModal(DOM.doubleCheckModal);
        });

        // [PRESERVED] Post Checkout - Order Again
        DOM.orderAgainBtn.addEventListener('click', function() { resetApplication(); });
        DOM.postCheckoutModal.addEventListener('click', function(e) {
            if (e.target === DOM.postCheckoutModal) closeModal(DOM.postCheckoutModal);
        });

        // [PRESERVED] Visibility Change
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) checkPostCheckout();
        });

        // NEW: Secret Login Modal
        DOM.secretLoginClose.addEventListener('click', function() {
            closeModal(DOM.secretLoginModal);
            DOM.pinError.classList.add('hidden');
        });
        DOM.verifyPinBtn.addEventListener('click', verifyPin);
        DOM.adminPin.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') verifyPin();
        });
        DOM.secretLoginModal.addEventListener('click', function(e) {
            if (e.target === DOM.secretLoginModal) {
                closeModal(DOM.secretLoginModal);
                DOM.pinError.classList.add('hidden');
            }
        });

        // NEW: Admin Dashboard
        DOM.adminLogout.addEventListener('click', logoutAdmin);
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                const target = this.getAttribute('data-admin-tab');
                DOM.panelMenu.classList.toggle('hidden', target !== 'menu');
                DOM.panelOrders.classList.toggle('hidden', target !== 'orders');
                if (DOM.panelPayments) DOM.panelPayments.classList.toggle('hidden', target !== 'payments');
                if (target === 'orders') renderAdminOrders();
                if (target === 'payments') renderAdminPayments();
            });
        });
        DOM.menuForm.addEventListener('submit', saveMenuItem);
        DOM.menuResetBtn.addEventListener('click', resetMenuForm);
        DOM.adminMenuTable.addEventListener('click', function(e) {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;
            const id = btn.getAttribute('data-id');
            if (btn.classList.contains('edit')) editMenuItem(id);
            if (btn.classList.contains('delete')) deleteMenuItem(id);
        });
        DOM.refreshOrders.addEventListener('click', renderAdminOrders);
        DOM.adminOrdersTable.addEventListener('change', function(e) {
            const select = e.target.closest('.status-select');
            if (!select) return;
            const orderId = select.getAttribute('data-order');
            const field = select.getAttribute('data-field');
            updateOrderField(orderId, field, select.value);
        });
        DOM.adminOrdersTable.addEventListener('click', function(e) {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;
            const orderId = btn.getAttribute('data-order');
            if (btn.classList.contains('delete')) deleteOrder(orderId);
            if (btn.getAttribute('data-action') === 'print') printThermalReceipt(orderId);
        });

        // [NEW FEATURE] Payment Admin listeners
        if (DOM.paymentForm) {
            DOM.paymentForm.addEventListener('submit', savePaymentItem);
        }
        if (DOM.paymentResetBtn) {
            DOM.paymentResetBtn.addEventListener('click', resetPaymentForm);
        }
        if (DOM.adminPaymentsTable) {
            DOM.adminPaymentsTable.addEventListener('click', function(e) {
                const btn = e.target.closest('.action-btn');
                if (!btn) return;
                const id = btn.getAttribute('data-payment');
                if (btn.classList.contains('edit')) editPaymentItem(id);
                if (btn.classList.contains('delete')) deletePaymentItem(id);
            });
        }

        // NEW: QR Invoice View
        DOM.backFromQr.addEventListener('click', showMainFromQr);
        DOM.uploadArea.addEventListener('click', function() { DOM.proofFile.click(); });
        DOM.proofFile.addEventListener('change', handleProofFileSelect);
        DOM.removeProof.addEventListener('click', function(e) {
            e.stopPropagation();
            removeProofSelection();
        });
        DOM.uploadProofBtn.addEventListener('click', uploadProof);
        // [MODIFIED] Changed to download image
        DOM.downloadReceiptBtn.addEventListener('click', downloadReceiptImage);
        DOM.receiptClose.addEventListener('click', function() { closeModal(DOM.receiptModal); });
        DOM.receiptModal.addEventListener('click', function(e) {
            if (e.target === DOM.receiptModal) closeModal(DOM.receiptModal);
        });
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    async function init() {
        renderMenuItems();
        updateCartUI();
        setupEventListeners();
        setupSecretLogin();
        checkPostCheckout();
        
        // [MODIFIED] Load data first, then show dashboard
        await loadPaymentsFromSheet();
        await loadMenuFromSheet();
        
        setTimeout(function() {
            showMainDashboard();
        }, 2500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
