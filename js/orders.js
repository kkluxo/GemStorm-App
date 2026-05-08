// Глобальные переменные
let allOrders = [];
let currentFilter = 'all';
let currentOrderId = null;

// Загрузка страницы
document.addEventListener('DOMContentLoaded', () => {
    loadOrdersFromServer();
    
    // Добавляем обработчики фильтров
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.status;
            displayOrders();
        });
    });
});

// Загрузка заказов с сервера
async function loadOrdersFromServer() {
    try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Ошибка загрузки');
        
        allOrders = await response.json();
        displayOrders();
        updateStats();
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('ordersTableBody').innerHTML = 
            '<tr><td colspan="8" class="no-data">❌ Ошибка загрузки заказов</td></tr>';
    }
}

// Отображение заказов с учетом фильтра
function displayOrders() {
    const tbody = document.getElementById('ordersTableBody');
    
    let filteredOrders = allOrders;
    if (currentFilter !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === currentFilter);
    }
    
    if (filteredOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">📭 Заказов не найдено</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredOrders.map(order => `
        <tr>
            <td><strong>#${order.id}</strong></td>
            <td>${escapeHtml(order.customerName)}</td>
            <td>${escapeHtml(order.phone)}</td>
            <td>${escapeHtml(order.products)}</td>
            <td><strong>${order.total} ₽</strong></td>
            <td>${getStatusBadge(order.status)}</td>
            <td>${formatDate(order.date)}</td>
            <td class="action-buttons">
                <button class="action-btn edit-status" onclick="openStatusModal(${order.id})">📝 Статус</button>
                <button class="action-btn delete-order" onclick="deleteOrder(${order.id})">🗑️ Удалить</button>
            </td>
        </tr>
    `).join('');
}

// Получение бейджа статуса
function getStatusBadge(status) {
    const statuses = {
        'pending': '<span class="status-badge status-pending">🕐 Новый</span>',
        'processing': '<span class="status-badge status-processing">⚙️ В обработке</span>',
        'completed': '<span class="status-badge status-completed">✅ Выполнен</span>',
        'cancelled': '<span class="status-badge status-cancelled">❌ Отменен</span>'
    };
    return statuses[status] || statuses.pending;
}

// Обновление статистики
function updateStats() {
    const stats = {
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === 'pending').length,
        processing: allOrders.filter(o => o.status === 'processing').length,
        completed: allOrders.filter(o => o.status === 'completed').length,
        cancelled: allOrders.filter(o => o.status === 'cancelled').length
    };
    
    const statsHtml = `
        <div class="stat-card">
            <h3>Всего заказов</h3>
            <p>${stats.total}</p>
        </div>
        <div class="stat-card">
            <h3>Новые</h3>
            <p style="color: #856404;">${stats.pending}</p>
        </div>
        <div class="stat-card">
            <h3>В обработке</h3>
            <p style="color: #004085;">${stats.processing}</p>
        </div>
        <div class="stat-card">
            <h3>Выполненные</h3>
            <p style="color: #155724;">${stats.completed}</p>
        </div>
        <div class="stat-card">
            <h3>Отмененные</h3>
            <p style="color: #721c24;">${stats.cancelled}</p>
        </div>
    `;
    
    const statsContainer = document.getElementById('statsContainer');
    if (statsContainer) statsContainer.innerHTML = statsHtml;
}

// Открытие модального окна для изменения статуса
function openStatusModal(orderId) {
    currentOrderId = orderId;
    const order = allOrders.find(o => o.id === orderId);
    if (order) {
        document.getElementById('modalOrderId').textContent = orderId;
        document.getElementById('statusSelect').value = order.status;
        document.getElementById('statusModal').style.display = 'flex';
    }
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('statusModal').style.display = 'none';
    currentOrderId = null;
}

// Сохранение статуса
async function saveStatus() {
    if (!currentOrderId) return;
    
    const newStatus = document.getElementById('statusSelect').value;
    
    try {
        const response = await fetch(`/api/orders/${currentOrderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            // Обновляем локальный массив
            const orderIndex = allOrders.findIndex(o => o.id === currentOrderId);
            if (orderIndex !== -1) {
                allOrders[orderIndex].status = newStatus;
            }
            
            displayOrders();
            updateStats();
            closeModal();
        } else {
            alert('Ошибка при обновлении статуса');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка соединения с сервером');
    }
}

// Удаление заказа
async function deleteOrder(orderId) {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;
    
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            allOrders = allOrders.filter(o => o.id !== orderId);
            displayOrders();
            updateStats();
        } else {
            alert('Ошибка при удалении заказа');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка соединения с сервером');
    }
}

// Вспомогательные функции
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Нажатие на Escape для закрытия модалки
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// Закрытие модалки при клике вне окна
window.onclick = (e) => {
    const modal = document.getElementById('statusModal');
    if (e.target === modal) closeModal();
};