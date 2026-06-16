/* ============================================
   BARISYU - DIGITAL MENU APPLICATION
   Vanilla JavaScript | State Management | Cart System
   ============================================ */

(function() {
    'use strict';

    // ============================================
    // DATA: Menu Items
    // ============================================
    const menuData = {
        beverages: [
            {
                id: 'bev-1',
                name: 'Espresso',
                description: 'Rich and bold single shot of premium arabica coffee',
                price: 18000,
                image: 'img/menu-1.png',
                category: 'beverages'
            },
            {
                id: 'bev-2',
                name: 'Cappuccino',
                description: 'Perfect balance of espresso, steamed milk, and foam',
                price: 28000,
                image: 'img/menu-2.png',
                category: 'beverages'
            },
            {
                id: 'bev-3',
                name: 'Caramel Latte',
                description: 'Smooth espresso with caramel syrup and velvety milk',
                price: 32000,
                image: 'img/menu-3.png',
                category: 'beverages'
            },
            {
                id: 'bev-4',
                name: 'Matcha Green Tea',
                description: 'Premium Japanese matcha with creamy milk base',
                price: 30000,
                image: 'img/menu-4.png',
                category: 'beverages'
            },
            {
                id: 'bev-5',
                name: 'Iced Americano',
                description: 'Refreshing cold brew with a double shot of espresso',
                price: 25000,
                image: 'img/menu-5.png',
                category: 'beverages'
            },
            {
                id: 'bev-6',
                name: 'Mocha Frappe',
                description: 'Blended chocolate coffee with whipped cream topping',
                price: 35000,
                image: 'img/menu-6.png',
                category: 'beverages'
            }
        ],
        food: [
            {
                id: 'food-1',
                name: 'Nasi Goreng Special',
                description: 'Classic Indonesian fried rice with chicken, egg, and sambal',
                price: 45000,
                image: 'img/menu-7.png',
                category: 'food'
            },
            {
                id: 'food-2',
                name: 'Mie Goreng Jawa',
                description: 'Traditional Javanese stir-fried noodles with vegetables',
                price: 40000,
                image: 'img/menu-8.png',
                category: 'food'
            },
            {
                id: 'food-3',
                name: 'Ayam Penyet',
                description: 'Smashed fried chicken with sambal and steamed rice',
                price: 52000,
                image: 'img/menu-9.png',
                category: 'food'
            },
            {
                id: 'food-4',
                name: 'Sate Ayam',
                description: 'Grilled chicken skewers with peanut sauce and lontong',
                price: 48000,
                image: 'img/menu-10.png',
                category: 'food'
            },
            {
                id: 'food-5',
                name: 'Gado-Gado',
                description: 'Mixed vegetable salad with peanut dressing and egg',
                price: 38000,
                image: 'img/menu-11.png',
                category: 'food'
            },
            {
                id: 'food-6',
                name: 'Rendang Daging',
                description: 'Slow-cooked beef in rich coconut and spice gravy',
                price: 65000,
                image: 'img/menu-12.png',
                category: 'food'
            }
        ]
    };

    // Flatten all items
    const allItems = [...menuData.beverages, ...menuData.food];

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    const state = {
        cart: {},
        activeCategory: 'all',
        checkoutData: {
            tableNumber: '',
            customerName: '',
            paymentMethod: 'QRIS'
        }
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function formatRupiah(amount) {
        return 'Rp ' + amount.toLocaleString('id-ID');
    }

    function getCartTotal() {
        let total = 0;
        let count = 0;
        for (const itemId in state.cart) {
            const item = allItems.find(i => i.id === itemId);
            if (item) {
                total += item.price * state.cart[itemId];
                count += state.cart[itemId];
            }
        }
        return { total, count };
    }

    function getCartItems() {
        const items = [];
        for (const itemId in state.cart) {
            const item = allItems.find(i => i.id === itemId);
            if (item) {
                items.push({ ...item, quantity: state.cart[itemId] });
            }
        }
        return items;
    }

    // ============================================
    // DOM REFERENCES
    // ============================================
    const DOM = {
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
        orderAgainBtn: document.getElementById('order-again-btn')
    };

    // ============================================
    // RENDER FUNCTIONS
    // ============================================
    function renderMenuItems() {
        let itemsToRender = [];
        
        if (state.activeCategory === 'all') {
            itemsToRender = allItems;
        } else {
            itemsToRender = menuData[state.activeCategory] || [];
        }

        // Group by category for 'all' view
        if (state.activeCategory === 'all') {
            const categories = ['beverages', 'food'];
            let html = '';
            
            categories.forEach(cat => {
                const catItems = menuData[cat];
                const catLabel = cat === 'beverages' ? 'Barista Craft Beverages' : 'Indonesian Culinary Classics';
                
                html += '<div class="category-section">';
                html += '<h2 class="category-title">' + catLabel + '</h2>';
                html += '<div class="category-items">';
                
                catItems.forEach(item => {
                    html += renderMenuCard(item);
                });
                
                html += '</div></div>';
            });
            
            DOM.menuContainer.innerHTML = html;
        } else {
            const catLabel = state.activeCategory === 'beverages' ? 'Barista Craft Beverages' : 'Indonesian Culinary Classics';
            let html = '<div class="category-section">';
            html += '<h2 class="category-title">' + catLabel + '</h2>';
            html += '<div class="category-items">';
            
            itemsToRender.forEach(item => {
                html += renderMenuCard(item);
            });
            
            html += '</div></div>';
            DOM.menuContainer.innerHTML = html;
        }
    }

    function renderMenuCard(item) {
        const qty = state.cart[item.id] || 0;
        return `
            <div class="menu-card" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="menu-image" onerror="this.style.background='var(--light-gray)'">
                <div class="menu-info">
                    <div>
                        <h3 class="menu-title">${item.name}</h3>
                        <p class="menu-description">${item.description}</p>
                        <p class="menu-price">${formatRupiah(item.price)}</p>
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
            
            if (displayEl) {
                displayEl.textContent = qty;
            }
            if (minusBtn) {
                minusBtn.disabled = qty === 0;
            }
        }
        
        // Also update items that were removed (set to 0)
        document.querySelectorAll('.qty-display').forEach(el => {
            const id = el.getAttribute('data-id');
            if (!state.cart[id]) {
                el.textContent = '0';
                const minusBtn = document.querySelector('.minus-btn[data-id="' + id + '"]');
                if (minusBtn) minusBtn.disabled = true;
            }
        });
    }

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
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            html += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.style.background='var(--light-gray)'">
                    <div class="cart-item-info">
                        <p class="cart-item-title">${item.name}</p>
                        <p class="cart-item-price">${formatRupiah(item.price)}</p>
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
            const itemTotal = item.price * item.quantity;
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

    function renderReview() {
        const items = getCartItems();
        const { total } = getCartTotal();
        const now = new Date();
        
        DOM.reviewTable.textContent = state.checkoutData.tableNumber || '-';
        DOM.reviewName.textContent = state.checkoutData.customerName || '-';
        DOM.reviewPayment.textContent = state.checkoutData.paymentMethod;
        DOM.reviewDate.textContent = now.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        DOM.reviewTotal.textContent = formatRupiah(total);
        
        let html = '';
        items.forEach(item => {
            html += `
                <div class="review-item">
                    <span>
                        <span class="review-item-name">${item.name}</span>
                        <span class="review-item-qty">x${item.quantity}</span>
                    </span>
                    <span class="review-item-price">${formatRupiah(item.price * item.quantity)}</span>
                </div>
            `;
        });
        
        DOM.reviewItems.innerHTML = html;
    }

    // ============================================
    // CART OPERATIONS
    // ============================================
    function addToCart(itemId) {
        if (!state.cart[itemId]) {
            state.cart[itemId] = 0;
        }
        state.cart[itemId]++;
        updateCartUI();
        updateMenuQuantities();
    }

    function removeFromCart(itemId) {
        if (state.cart[itemId]) {
            state.cart[itemId]--;
            if (state.cart[itemId] <= 0) {
                delete state.cart[itemId];
            }
        }
        updateCartUI();
        updateMenuQuantities();
        renderCartItems();
    }

    function clearCart() {
        state.cart = {};
        updateCartUI();
        updateMenuQuantities();
        renderCartItems();
    }

    // ============================================
    // VIEW NAVIGATION
    // ============================================
    function showLoadingScreen() {
        DOM.loadingScreen.classList.remove('hidden');
        DOM.mainDashboard.classList.add('hidden');
        DOM.checkoutView.classList.add('hidden');
    }

    function showMainDashboard() {
        DOM.loadingScreen.classList.add('fade-out');
        
        setTimeout(() => {
            DOM.loadingScreen.classList.add('hidden');
            DOM.loadingScreen.classList.remove('fade-out');
            DOM.mainDashboard.classList.remove('hidden');
            DOM.checkoutView.classList.add('hidden');
        }, 500);
    }

    function showCheckout() {
        DOM.mainDashboard.classList.add('hidden');
        DOM.checkoutView.classList.remove('hidden');
        renderMiniCart();
        
        // Restore saved values
        DOM.tableNumber.value = state.checkoutData.tableNumber;
        DOM.customerName.value = state.checkoutData.customerName;
        
        // Restore payment selection
        const paymentInput = document.querySelector('input[name="payment"][value="' + state.checkoutData.paymentMethod + '"]');
        if (paymentInput) paymentInput.checked = true;
    }

    function showMainFromCheckout() {
        DOM.checkoutView.classList.add('hidden');
        DOM.mainDashboard.classList.remove('hidden');
    }

    // ============================================
    // MODAL OPERATIONS
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
    // WHATSAPP COMPILER
    // ============================================
    function compileWhatsAppMessage() {
        const items = getCartItems();
        const { total } = getCartTotal();
        const now = new Date();
        
        let message = '*BARISYU - NEW ORDER*' + '\\n';
        message += '===================' + '\\n\\n';
        message += '*Date:* ' + now.toLocaleString('id-ID') + '\\n';
        message += '*Table:* ' + state.checkoutData.tableNumber + '\\n';
        message += '*Customer:* ' + state.checkoutData.customerName + '\\n';
        message += '*Payment:* ' + state.checkoutData.paymentMethod + '\\n\\n';
        message += '*ORDER ITEMS:*' + '\\n';
        message += '-------------------' + '\\n';
        
        items.forEach((item, index) => {
            message += (index + 1) + '. ' + item.name + '\\n';
            message += '   Qty: ' + item.quantity + ' x ' + formatRupiah(item.price) + '\\n';
            message += '   Sub: ' + formatRupiah(item.price * item.quantity) + '\\n';
        });
        
        message += '-------------------' + '\\n';
        message += '*TOTAL: ' + formatRupiah(total) + '*\\n\\n';
        message += 'Thank you for ordering with Barisyu!';
        
        return encodeURIComponent(message);
    }

    function sendToWhatsApp() {
        const message = compileWhatsAppMessage();
        const phoneNumber = '6281382057596';
        const url = 'https://wa.me/' + phoneNumber + '?text=' + message;
        
        // Mark that we are redirecting for post-checkout detection
        sessionStorage.setItem('barisyu_checkout_redirect', 'true');
        sessionStorage.setItem('barisyu_checkout_time', Date.now().toString());
        
        window.location.href = url;
    }

    // ============================================
    // POST-CHECKOUT DETECTION
    // ============================================
    function checkPostCheckout() {
        const redirected = sessionStorage.getItem('barisyu_checkout_redirect');
        const checkoutTime = sessionStorage.getItem('barisyu_checkout_time');
        
        if (redirected === 'true' && checkoutTime) {
            const elapsed = Date.now() - parseInt(checkoutTime);
            // If user returned within 5 minutes, show thank you modal
            if (elapsed < 300000) {
                openModal(DOM.postCheckoutModal);
            }
            // Clear the flag
            sessionStorage.removeItem('barisyu_checkout_redirect');
            sessionStorage.removeItem('barisyu_checkout_time');
        }
    }

    function resetApplication() {
        clearCart();
        state.checkoutData = {
            tableNumber: '',
            customerName: '',
            paymentMethod: 'QRIS'
        };
        
        DOM.tableNumber.value = '';
        DOM.customerName.value = '';
        document.querySelector('input[name="payment"][value="QRIS"]').checked = true;
        
        closeModal(DOM.postCheckoutModal);
        closeModal(DOM.doubleCheckModal);
        showMainFromCheckout();
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    function setupEventListeners() {
        // Category Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                state.activeCategory = this.getAttribute('data-category');
                renderMenuItems();
            });
        });

        // Menu Item Quantity Buttons (Event Delegation)
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

        // Floating Cart CTA
        DOM.cartCtaBtn.addEventListener('click', function() {
            const { count } = getCartTotal();
            if (count > 0) {
                renderCartItems();
                openModal(DOM.cartModal);
            }
        });

        // Cart Modal Close
        DOM.cartClose.addEventListener('click', function() {
            closeModal(DOM.cartModal);
        });

        // Cart Modal Overlay Click
        DOM.cartModal.addEventListener('click', function(e) {
            if (e.target === DOM.cartModal) {
                closeModal(DOM.cartModal);
            }
        });

        // Cart Item Actions (Event Delegation)
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

        // Confirm Order (from cart modal -> checkout)
        DOM.confirmOrderBtn.addEventListener('click', function() {
            const { count } = getCartTotal();
            if (count > 0) {
                closeModal(DOM.cartModal);
                showCheckout();
            }
        });

        // Back to Menu
        DOM.backToMenu.addEventListener('click', function() {
            showMainFromCheckout();
        });

        // Form Input Tracking
        DOM.tableNumber.addEventListener('input', function() {
            state.checkoutData.tableNumber = this.value;
        });

        DOM.customerName.addEventListener('input', function() {
            state.checkoutData.customerName = this.value;
        });

        // Payment Method Selection
        document.querySelectorAll('input[name="payment"]').forEach(input => {
            input.addEventListener('change', function() {
                state.checkoutData.paymentMethod = this.value;
            });
        });

        // Checkout CTA -> Double Check
        DOM.checkoutCtaBtn.addEventListener('click', function() {
            if (!state.checkoutData.tableNumber.trim()) {
                DOM.tableNumber.focus();
                DOM.tableNumber.style.borderColor = 'var(--danger)';
                setTimeout(() => {
                    DOM.tableNumber.style.borderColor = '';
                }, 2000);
                return;
            }
            if (!state.checkoutData.customerName.trim()) {
                DOM.customerName.focus();
                DOM.customerName.style.borderColor = 'var(--danger)';
                setTimeout(() => {
                    DOM.customerName.style.borderColor = '';
                }, 2000);
                return;
            }
            
            renderReview();
            openModal(DOM.doubleCheckModal);
        });

        // Review Order (go back)
        DOM.reviewOrderBtn.addEventListener('click', function() {
            closeModal(DOM.doubleCheckModal);
        });

        // Double Check Overlay Click
        DOM.doubleCheckModal.addEventListener('click', function(e) {
            if (e.target === DOM.doubleCheckModal) {
                closeModal(DOM.doubleCheckModal);
            }
        });

        // Proceed to Order (send to WhatsApp)
        DOM.proceedOrderBtn.addEventListener('click', function() {
            sendToWhatsApp();
        });

        // Post Checkout - Order Again
        DOM.orderAgainBtn.addEventListener('click', function() {
            resetApplication();
        });

        // Post Checkout Overlay Click
        DOM.postCheckoutModal.addEventListener('click', function(e) {
            if (e.target === DOM.postCheckoutModal) {
                closeModal(DOM.postCheckoutModal);
            }
        });

        // Visibility Change (Post-Checkout Detection)
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                checkPostCheckout();
            }
        });
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        renderMenuItems();
        updateCartUI();
        setupEventListeners();
        
        // Check for post-checkout on init
        checkPostCheckout();
        
        // Auto-transition from loading to main dashboard
        setTimeout(function() {
            showMainDashboard();
        }, 2500);
    }

    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
