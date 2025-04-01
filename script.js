// Variables globales
let products = []; // Almacena todos los productos
let cart = []; // Almacena los productos en el carrito
let currentProduct = null; // Producto seleccionado para añadir al carrito
let filteredProducts = []; // Productos filtrados por búsqueda o categoría

// Elementos del DOM
const productsContainer = document.getElementById('productos-container');
const searchInput = document.getElementById('search-input');
const cartCounter = document.getElementById('cart-counter');
const decreaseBtn = document.getElementById('decrease-quantity');
const increaseBtn = document.getElementById('increase-quantity');
const quantityInput = document.getElementById('quantity-input');
const addToCartBtn = document.getElementById('add-to-cart-btn');
const modalProductName = document.getElementById('modal-product-name');
const cartItemsList = document.getElementById('cart-items-list');
const emptyCartMessage = document.getElementById('empty-cart-message');
const cartTotal = document.getElementById('cart-total');
const checkoutTotal = document.getElementById('checkout-total');
const orderSummary = document.getElementById('order-summary');
const categoryFilters = document.querySelectorAll('.category-filter');
const clearCartBtn = document.getElementById('clear-cart-btn');
const processPaymentBtn = document.getElementById('process-payment-btn');
const successToast = document.getElementById('success-toast');

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Cargar productos desde la API
    fetchProducts();
    
    // Cargar carrito desde localStorage si existe
    loadCartFromStorage();
    
    // Event listeners
    setupEventListeners();
});

// Función para cargar productos desde la API
function fetchProducts() {
    fetch('https://fakestoreapi.com/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar productos');
            }
            return response.json();
        })
        .then(data => {
            products = data;
            filteredProducts = [...products];
            renderProducts(products);
            // Ocultar los skeleton loaders
            document.querySelectorAll('.skeleton-loader').forEach(loader => {
                loader.style.display = 'none';
            });
        })
        .catch(error => {
            console.error('Error:', error);
            productsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error al cargar los productos. Por favor, intenta nuevamente.
                    </div>
                    <button class="btn btn-primary" onclick="fetchProducts()">
                        <i class="fas fa-sync-alt me-2"></i>Reintentar
                    </button>
                </div>
            `;
        });
}

// Función para manejar errores de carga de imágenes
function handleImageError(img, productTitle) {
    img.onerror = null; // Prevenir bucle infinito
    img.src = `https://via.placeholder.com/200x200?text=${encodeURIComponent(productTitle.substring(0, 20))}`;
    img.alt = `Imagen no disponible: ${productTitle}`;
}

// Función para renderizar productos en la página
function renderProducts(productsToRender) {
    // Limpiar el contenedor de productos
    productsContainer.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No se encontraron productos que coincidan con la búsqueda.
                </div>
            </div>
        `;
        return;
    }
    
    // Renderizar cada producto
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'col';
        
        // Crear una imagen placeholder con el nombre del producto en caso de que la imagen original falle
        const imageUrl = product.image || `https://via.placeholder.com/200x200?text=${encodeURIComponent(product.title.substring(0, 20))}`;
        
        productCard.innerHTML = `
            <div class="card h-100">
                <div class="card-img-container">
                    <img src="${imageUrl}" class="card-img-top" alt="${product.title}" 
                         onerror="handleImageError(this, '${product.title.replace(/'/g, "\\'")}')" 
                         loading="lazy">
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${product.title.length > 40 ? product.title.substring(0, 40) + '...' : product.title}</h5>
                    <p class="card-text mb-1 text-muted small">${product.category}</p>
                    <div class="product-rating mb-2">
                        ${generateRatingStars(product.rating.rate)}
                        <small class="text-muted">(${product.rating.count})</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="product-price">$${product.price.toFixed(2)}</span>
                        <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">
                            <i class="fas fa-cart-plus me-1"></i> Añadir
                        </button>
                    </div>
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
        
        // Añadir event listener al botón de añadir al carrito
        const addButton = productCard.querySelector('.add-to-cart-btn');
        addButton.addEventListener('click', function() {
            handleAddToCartClick(product);
        });
    });
}

// Función para generar estrellas de calificación
function generateRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Estrellas completas
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i> ';
    }
    
    // Media estrella si es necesario
    if (halfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i> ';
    }
    
    // Estrellas vacías
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i> ';
    }
    
    return starsHTML;
}

// Configuración de event listeners
function setupEventListeners() {
    // Filtro de búsqueda
    searchInput.addEventListener('input', handleSearch);
    
    // Filtros de categoría
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', handleCategoryFilter);
    });
    
    // Botones de cantidad en el modal
    decreaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });
    
    increaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue < 10) {
            quantityInput.value = currentValue + 1;
        }
    });
    
    // Botón de añadir al carrito desde el modal
    addToCartBtn.addEventListener('click', () => {
        if (currentProduct) {
            const quantity = parseInt(quantityInput.value);
            addToCart(currentProduct, quantity);
            
            // Cerrar el modal
            const cantidadModal = bootstrap.Modal.getInstance(document.getElementById('cantidadModal'));
            cantidadModal.hide();
            
            // Mostrar toast de éxito
            const toast = new bootstrap.Toast(successToast);
            toast.show();
        }
    });
    
    // Botón de vaciar carrito
    clearCartBtn.addEventListener('click', clearCart);
    
    // Botón de procesar pago
    processPaymentBtn.addEventListener('click', processPayment);
    
    // Event listener para modal de carrito (actualización de resumen de pedido)
    document.getElementById('carritoModal').addEventListener('show.bs.modal', updateOrderSummary);
    
    // Event listener para modal de checkout
    document.getElementById('checkoutModal').addEventListener('show.bs.modal', updateCheckoutSummary);
}

// Función para manejar clic en botón de añadir al carrito
function handleAddToCartClick(product) {
    currentProduct = product;
    modalProductName.textContent = product.title;
    quantityInput.value = 1;
    
    // Mostrar el modal
    const cantidadModal = new bootstrap.Modal(document.getElementById('cantidadModal'));
    cantidadModal.show();
}

// Función para manejar la búsqueda
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        // Si no hay término de búsqueda, mostrar todos los productos o los filtrados por categoría
        renderProducts(filteredProducts);
        return;
    }
    
    // Filtrar productos por término de búsqueda
    const searchResults = filteredProducts.filter(product => 
        product.title.toLowerCase().includes(searchTerm) || 
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    
    renderProducts(searchResults);
}

// Función para manejar el filtro de categoría
function handleCategoryFilter(event) {
    const selectedCategory = event.target.dataset.category;
    
    // Actualizar estado visual de los botones
    categoryFilters.forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filtrar productos por categoría
    if (selectedCategory === 'all') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.category === selectedCategory);
    }
    
    // Actualizar productos mostrados
    renderProducts(filteredProducts);
    
    // Limpiar búsqueda
    searchInput.value = '';
}

// Función para añadir producto al carrito
function addToCart(product, quantity) {
    // Buscar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        // Actualizar cantidad si ya existe
        existingItem.quantity += quantity;
    } else {
        // Añadir nuevo item si no existe
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image || `https://via.placeholder.com/60x60?text=${encodeURIComponent(product.title.substring(0, 10))}`,
            quantity: quantity
        });
    }
    
    // Actualizar contador del carrito y localStorage
    updateCartCounter();
    saveCartToStorage();
    
    // Efecto visual en el botón de carrito
    cartCounter.parentElement.classList.add('added-to-cart');
    setTimeout(() => {
        cartCounter.parentElement.classList.remove('added-to-cart');
    }, 500);
}

// Función para actualizar contador del carrito
function updateCartCounter() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCounter.textContent = totalItems;
    
    // Actualizar visibilidad del mensaje de carrito vacío
    if (totalItems > 0) {
        emptyCartMessage.classList.add('d-none');
        cartItemsList.classList.remove('d-none');
        document.getElementById('checkout-btn').disabled = false;
    } else {
        emptyCartMessage.classList.remove('d-none');
        cartItemsList.classList.add('d-none');
        document.getElementById('checkout-btn').disabled = true;
    }
}

// Función para actualizar resumen del carrito
function updateOrderSummary() {
    if (cart.length === 0) {
        return;
    }
    
    // Limpiar lista de items
    cartItemsList.innerHTML = '';
    
    // Calcular total
    let total = 0;
    
    // Agregar cada item a la lista
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item d-flex align-items-center py-2';
        itemElement.innerHTML = `
            <div class="me-3">
                <img src="${item.image}" class="cart-item-img" alt="${item.title}" 
                     onerror="this.src='https://via.placeholder.com/60x60?text=${encodeURIComponent(item.title.substring(0, 10))}'">
            </div>
            <div class="cart-item-details flex-grow-1">
                <h6 class="mb-0">${item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title}</h6>
                <p class="mb-0 text-muted">${item.quantity} x $${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-item-actions">
                <span class="fw-bold">$${itemTotal.toFixed(2)}</span>
                <button class="btn btn-sm btn-outline-danger ms-2 remove-item-btn" data-product-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        cartItemsList.appendChild(itemElement);
        
        // Añadir event listener al botón de eliminar
        const removeButton = itemElement.querySelector('.remove-item-btn');
        removeButton.addEventListener('click', () => removeFromCart(item.id));
    });
    
    // Actualizar total
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Función para actualizar resumen del checkout
function updateCheckoutSummary() {
    if (cart.length === 0) {
        return;
    }
    
    // Limpiar resumen
    orderSummary.innerHTML = '';
    
    // Calcular total
    let total = 0;
    
    // Crear tabla de resumen
    const summaryTable = document.createElement('table');
    summaryTable.className = 'table';
    summaryTable.innerHTML = `
        <thead>
            <tr>
                <th>Producto</th>
                <th class="text-center">Cantidad</th>
                <th class="text-end">Precio</th>
            </tr>
        </thead>
        <tbody id="checkout-items">
        </tbody>
    `;
    
    orderSummary.appendChild(summaryTable);
    
    const checkoutItems = document.getElementById('checkout-items');
    
    // Agregar cada item al resumen
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-end">$${itemTotal.toFixed(2)}</td>
        `;
        
        checkoutItems.appendChild(row);
    });
    
    // Actualizar total
    checkoutTotal.textContent = `$${total.toFixed(2)}`;
}

// Función para eliminar item del carrito
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    
    // Actualizar interfaz
    updateCartCounter();
    updateOrderSummary();
    saveCartToStorage();
}

// Función para vaciar carrito
function clearCart() {
    cart = [];
    
    // Actualizar interfaz
    updateCartCounter();
    updateOrderSummary();
    saveCartToStorage();
}

// Función para procesar pago
function processPayment() {
    // Validar formulario
    const form = document.getElementById('payment-form');
    form.classList.add('was-validated');
    
    if (!form.checkValidity()) {
        return;
    }
    
    // Generar factura PDF
    generateInvoice();
    
    // Limpiar carrito
    clearCart();
    
    // Cerrar modales
    const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
    const carritoModal = bootstrap.Modal.getInstance(document.getElementById('carritoModal'));
    
    checkoutModal.hide();
    carritoModal.hide();
    
    // Mostrar alerta de éxito
    setTimeout(() => {
        alert('¡Pago procesado con éxito! La factura se ha descargado.');
    }, 500);
}

// Función para generar factura en PDF
function generateInvoice() {
    // Información del cliente
    const customerName = document.getElementById('customer-name').value;
    const customerEmail = document.getElementById('customer-email').value;
    const customerAddress = document.getElementById('customer-address').value;
    
    // Fecha actual
    const currentDate = new Date().toLocaleDateString();
    
    // Inicializar jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Agregar logo y encabezado
    doc.setFontSize(22);
    doc.setTextColor(74, 137, 220);
    doc.text('EcoShop', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('FACTURA', 105, 30, { align: 'center' });
    
    // Información del documento
    doc.setFontSize(10);
    doc.text(`Fecha: ${currentDate}`, 20, 40);
    doc.text(`No. Factura: INV-${Math.floor(Math.random() * 10000)}`, 20, 45);
    
    // Información del cliente
    doc.setFontSize(11);
    doc.text('Facturado a:', 20, 55);
    doc.setFontSize(10);
    doc.text(customerName, 20, 60);
    doc.text(customerEmail, 20, 65);
    doc.text(customerAddress, 20, 70);
    
    // Crear tabla de productos
    const tableColumn = ["Producto", "Cantidad", "Precio", "Total"];
    const tableRows = [];
    
    let totalAmount = 0;
    
    // Añadir filas a la tabla
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        
        tableRows.push([
            item.title.length > 35 ? item.title.substring(0, 35) + '...' : item.title,
            item.quantity,
            `$${item.price.toFixed(2)}`,
            `$${itemTotal.toFixed(2)}`
        ]);
    });
    
    // Agregar tabla al documento
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontStyle: 'normal',
            fontSize: 8
        },
        headStyles: {
            fillColor: [74, 137, 220],
            textColor: 255,
            fontSize: 9
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        }
    });
    
    // Agregar total
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.setFontSize(10);
    doc.text(`Subtotal: $${totalAmount.toFixed(2)}`, 150, finalY + 10, { align: 'right' });
    doc.text(`IVA (16%): $${(totalAmount * 0.16).toFixed(2)}`, 150, finalY + 15, { align: 'right' });
    doc.setFontSize(12);
    doc.setFontStyle('bold');
    doc.text(`Total: $${(totalAmount * 1.16).toFixed(2)}`, 150, finalY + 25, { align: 'right' });
    
    // Agregar pie de página
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Gracias por tu compra. Para cualquier consulta, contacta con nosotros en info@ecoshop.com', 105, 280, { align: 'center' });
    
    // Guardar el PDF
    doc.save(`factura_ecoshop_${currentDate.replace(/\//g, '-')}.pdf`);
}

// Funciones para manejo de localStorage
function saveCartToStorage() {
    localStorage.setItem('ecoShopCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('ecoShopCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCounter();
    }
}