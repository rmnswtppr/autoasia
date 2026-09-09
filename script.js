/**
 * === ГЛОБАЛЬНЫЕ УТИЛИТЫ ===
 */
function escapeHTML(string) {
    const res = document.createElement('div');
    res.innerText = string;
    return res.innerHTML;
}

// 🔥 НОВОЕ: Утилиты для работы с корзиной в localStorage
function getCart() {
    const cartData = localStorage.getItem('shoppingCart');
    return cartData ? JSON.parse(cartData) : [];
}

function saveCart(cart) {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
}

function addToCartStorage(id, title, price) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.qty += 1; // Увеличиваем количество, если товар уже есть
    } else {
        cart.push({ id, title, price, qty: 1 }); // Добавляем новый товар
    }
    saveCart(cart);
}

function updateQtyStorage(id, newQty) {
    const cart = getCart();
    const item = cart.find(item => item.id === id);
    if (item) {
        if (newQty <= 0) {
            removeFromCartStorage(id);
        } else {
            item.qty = newQty;
            saveCart(cart);
        }
    }
}

function removeFromCartStorage(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
}

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // 1. СТРАНИЦА АВТОРИЗАЦИИ
    // =========================================================================
    const authTabButtons = document.querySelectorAll('.auth-tab-btn');
    const authFormContents = document.querySelectorAll('.auth-form-content');
    const registerForm = document.getElementById('register-form');

    if (authTabButtons.length > 0 && authFormContents.length > 0) {
        authTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetFormId = button.getAttribute('data-auth-tab');
                authTabButtons.forEach(btn => btn.classList.remove('active'));
                authFormContents.forEach(form => form.classList.remove('active'));
                button.classList.add('active');
                const targetForm = document.getElementById(targetFormId);
                if (targetForm) targetForm.classList.add('active');
            });
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            const password = document.getElementById('reg-password').value;
            const passwordConfirm = document.getElementById('reg-password-confirm').value;
            if (password !== passwordConfirm) {
                event.preventDefault();
                alert('Ошибка: Пароли не совпадают!');
            } else {
                alert('Регистрация прошла успешно (демо-режим)!');
            }
        });
    }

    // =========================================================================
    // 2. СТРАНИЦА КОРЗИНЫ (🔥 ПОЛНОСТЬЮ ПЕРЕПИСАНО ДЛЯ LOCALSTORAGE)
    // =========================================================================
    // ВАЖНО: Замените '.cart-items-container' на реальный класс обертки товаров в вашей корзине (например, '.cart-list' или '#cart-items')
    const cartContainer = document.querySelector('.cart-items-container'); 
    const totalCountElement = document.getElementById('total-count');
    const subtotalElement = document.getElementById('subtotal-price');
    const finalPriceElement = document.getElementById('final-price');
    const emptyMessage = document.querySelector('.empty-cart-message');
    const submitOrderBtn = document.getElementById('submit-order-btn');
    const orderForm = document.getElementById('order-form');

    // Функция отрисовки корзины на основе данных из localStorage
    function renderCart() {
        const cart = getCart();
        
        // Очищаем контейнер перед новой отрисовкой
        if (cartContainer) {
            cartContainer.innerHTML = ''; 
        }

        if (cart.length === 0) {
            // Корзина пуста
            if (emptyMessage) emptyMessage.style.display = 'block';
            if (submitOrderBtn) {
                submitOrderBtn.disabled = true;
                submitOrderBtn.style.backgroundColor = '#ccc';
                submitOrderBtn.style.cursor = 'not-allowed';
            }
            if (totalCountElement) totalCountElement.textContent = '0';
            if (subtotalElement) subtotalElement.textContent = '0 ₽';
            if (finalPriceElement) finalPriceElement.textContent = '0 ₽';
            return; 
        }

        // Корзина не пуста
        if (emptyMessage) emptyMessage.style.display = 'none';
        if (submitOrderBtn) {
            submitOrderBtn.disabled = false;
            submitOrderBtn.style.backgroundColor = ''; 
            submitOrderBtn.style.cursor = 'pointer';
        }

        let totalSum = 0;
        let totalCount = 0;

        // Генерируем HTML для каждого товара из массива
        cart.forEach(item => {
            const itemTotalSum = item.price * item.qty;
            totalSum += itemTotalSum;
            totalCount += item.qty;

            if (cartContainer) {
                const itemHTML = `
                    <div class="cart-item" data-id="${item.id}" data-price="${item.price}">
                        <h4>${escapeHTML(item.title)}</h4>
                        <div class="cart-controls">
                            <button type="button" class="qty-minus">-</button>
                            <span class="qty-value">${item.qty}</span>
                            <button type="button" class="qty-plus">+</button>
                        </div>
                        <div class="cart-item-price">${itemTotalSum.toLocaleString('ru-RU')} ₽</div>
                        <button type="button" class="delete-item-btn">Удалить</button>
                    </div>
                `;
                cartContainer.insertAdjacentHTML('beforeend', itemHTML);
            }
        });

        // Обновляем итоги на странице
        if (totalCountElement) totalCountElement.textContent = totalCount;
        if (subtotalElement) subtotalElement.textContent = `${totalSum.toLocaleString('ru-RU')} ₽`;
        if (finalPriceElement) finalPriceElement.textContent = `${totalSum.toLocaleString('ru-RU')} ₽`;
    }

    // 🔥 НОВОЕ: Делегирование событий (один слушатель на весь контейнер, работает для динамических элементов)
    if (cartContainer) {
        cartContainer.addEventListener('click', (event) => {
            const target = event.target;
            const cartItem = target.closest('.cart-item');
            if (!cartItem) return;

            const itemId = cartItem.getAttribute('data-id');
            const qtyValueElement = cartItem.querySelector('.qty-value');
            let currentQty = parseInt(qtyValueElement.textContent) || 0;

            if (target.classList.contains('qty-minus')) {
                if (currentQty > 1) {
                    updateQtyStorage(itemId, currentQty - 1);
                    renderCart(); // Перерисовываем корзину
                }
            } else if (target.classList.contains('qty-plus')) {
                updateQtyStorage(itemId, currentQty + 1);
                renderCart(); // Перерисовываем корзину
            } else if (target.classList.contains('delete-item-btn')) {
                removeFromCartStorage(itemId);
                renderCart(); // Перерисовываем корзину
            }
        });
    }

    // Первичная отрисовка при загрузке страницы
    renderCart();

    // Обработка отправки заказа
    if (orderForm) {
        orderForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const clientNameElement = document.getElementById('checkout-name');
            const finalPriceEl = document.getElementById('final-price');
            
            const clientName = clientNameElement ? clientNameElement.value : 'Клиент';
            const finalPrice = finalPriceEl ? finalPriceEl.textContent : '0 ₽';

            alert(`Спасибо за заказ, ${clientName}! Заявка на сумму ${finalPrice} успешно оформлена.`);
            
            // 🔥 НОВОЕ: Очищаем корзину в localStorage и перерисовываем пустую корзину
            localStorage.removeItem('shoppingCart');
            renderCart();
            orderForm.reset();
        });
    }

    // =========================================================================
    // 3. СТРАНИЦА ОТЗЫВОВ
    // =========================================================================
    const reviewForm = document.querySelector('.review-form');
    const reviewsList = document.querySelector('.reviews-list');

    if (reviewForm && reviewsList) {
        reviewForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const nameInput = document.getElementById('review-name');
            const ratingSelect = document.getElementById('review-rating');
            const textInput = document.getElementById('review-text');

            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            const formattedDate = `${day}.${month}.${year}`;

            const starsCount = parseInt(ratingSelect.value);
            const starsVisual = '⭐'.repeat(starsCount);

            const newReviewCard = document.createElement('article');
            newReviewCard.classList.add('review-card');

            newReviewCard.innerHTML = `
                <div class="review-header">
                    <strong>${escapeHTML(nameInput.value)}</strong>
                    <span class="review-date">${formattedDate}</span>
                </div>
                <div class="review-rating">${starsVisual}</div>
                <p>${escapeHTML(textInput.value)}</p>
            `;

            reviewsList.prepend(newReviewCard);
            reviewForm.reset();
            newReviewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // =========================================================================
    // 4. СТРАНИЦА ЛИЧНОГО КАБИНЕТА
    // =========================================================================
    const menuButtons = document.querySelectorAll('.menu-btn');
    const tabContents = document.querySelectorAll('.profile-tab-content');
    const profileForm = document.querySelector('.profile-form');
    const userDisplayName = document.querySelector('.user-display-name');

    if (menuButtons.length > 0 && tabContents.length > 0) {
        menuButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                menuButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(tab => tab.classList.remove('active'));
                button.classList.add('active');
                const targetBlock = document.getElementById(targetTab);
                if (targetBlock) targetBlock.classList.add('active');
            });
        });
    }

    if (profileForm && userDisplayName) {
        profileForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const userNameValue = document.getElementById('user-name').value;
            if (userNameValue.trim() !== "") {
                userDisplayName.textContent = userNameValue;
                alert('Изменения профиля успешно сохранены!');
            }
        });
    }

    // =========================================================================
    // 5. СТРАНИЦА КАТАЛОГА (🔥 ОБНОВЛЕНА ЛОГИКА ДОБАВЛЕНИЯ В КОРЗИНУ)
    // =========================================================================
    const searchInput = document.getElementById('catalog-search');
    const searchBtn = document.querySelector('.search-btn');
    const applyFiltersBtn = document.querySelector('.apply-filters-btn');
    const productItems = document.querySelectorAll('.product-card-item');
    const noProductsMsg = document.querySelector('.no-products-found');

    function filterProducts() {
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const minPrice = document.getElementById('price-min').value ? parseInt(document.getElementById('price-min').value) : 0;
        const maxPrice = document.getElementById('price-max').value ? parseInt(document.getElementById('price-max').value) : Infinity;

        const activeCategories = Array.from(document.querySelectorAll('.filter-checkbox[data-type="category"]:checked')).map(cb => cb.value);
        const activeBrands = Array.from(document.querySelectorAll('.filter-checkbox[data-type="brand"]:checked')).map(cb => cb.value);

        let visibleCount = 0;

        productItems.forEach(product => {
            const name = product.querySelector('h4').textContent.toLowerCase();
            const sku = product.querySelector('.product-sku').textContent.toLowerCase();
            const price = parseInt(product.getAttribute('data-price'));
            const category = product.getAttribute('data-category');
            const brand = product.getAttribute('data-brand');

            const matchesSearch = name.includes(searchText) || sku.includes(searchText);
            const matchesPrice = price >= minPrice && price <= maxPrice;
            const matchesCategory = activeCategories.length === 0 || activeCategories.includes(category);
            const matchesBrand = activeBrands.length === 0 || activeBrands.includes(brand);

            if (matchesSearch && matchesPrice && matchesCategory && matchesBrand) {
                product.style.display = 'flex';
                visibleCount++;
            } else {
                product.style.display = 'none';
            }
        });

        if (noProductsMsg) {
            noProductsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', filterProducts);
    if (searchBtn) searchBtn.addEventListener('click', filterProducts);
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') filterProducts();
        });
    }

    // 🔥 НОВОЕ: Реальное добавление в localStorage вместо простого alert
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Находим карточку товара. Убедитесь, что у нее есть класс 'product-card-item'
            const productCard = btn.closest('.product-card-item');
            
            // Извлекаем данные. Убедитесь, что в HTML есть атрибуты data-id и data-price
            const productId = productCard ? productCard.getAttribute('data-id') : null;
            const productTitle = productCard ? productCard.querySelector('h4').textContent : 'Неизвестный товар';
            const productPrice = productCard ? parseInt(productCard.getAttribute('data-price')) : 0;

            if (productId && !isNaN(productPrice)) {
                addToCartStorage(productId, productTitle, productPrice);
                alert(`Товар "${productTitle}" добавлен в корзину!`);
                
                // Опционально: здесь можно добавить анимацию иконки корзины в шапке сайта
            } else {
                console.error('Ошибка: у карточки товара отсутствует атрибут data-id или data-price. Добавьте их в HTML.');
                alert('Не удалось добавить товар: отсутствуют данные (data-id/data-price).');
            }
        });
    });

}); // Конец DOMContentLoaded