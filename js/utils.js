// =====================================================
// Utility Functions for SnapLedger
// =====================================================

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(date) {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(d);
}

// Get date for input field (YYYY-MM-DD)
function getDateInputValue(date = new Date()) {
    return date.toISOString().split('T')[0];
}

// Calculate percentage change
function calculatePercentageChange(current, previous) {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

// Get category icon (SVG icon HTML)
function getCategoryIcon(category) {
    return getCategoryIconHTML(category);
}

// Get category emoji (deprecated - kept for backward compatibility in charts)
function getCategoryEmoji(category) {
    const emojis = {
        food: '🍽️',
        transport: '🚙',
        shopping: '🛒',
        bills: '⚡',
        entertainment: '🎭',
        health: '❤️',
        education: '🎓',
        other: '📍'
    };
    return emojis[category] || '📍';
}

// Get category name
function getCategoryName(category) {
    const names = {
        food: 'Food & Dining',
        transport: 'Transportation',
        shopping: 'Shopping',
        bills: 'Bills & Utilities',
        entertainment: 'Entertainment',
        health: 'Health & Fitness',
        education: 'Education',
        other: 'Other'
    };
    return names[category] || 'Other';
}

// Filter expenses by date period
function filterByPeriod(expenses, period) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        
        switch (period) {
            case 'today':
                return expenseDate >= today;
            
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return expenseDate >= weekAgo;
            
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                return expenseDate >= monthStart;
            
            case 'year':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                return expenseDate >= yearStart;
            
            default:
                return true;
        }
    });
}

// Search expenses
function searchExpenses(expenses, query) {
    const lowerQuery = query.toLowerCase();
    return expenses.filter(expense => 
        expense.description.toLowerCase().includes(lowerQuery) ||
        expense.category.toLowerCase().includes(lowerQuery)
    );
}

// Calculate total amount
function calculateTotal(expenses) {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
}

// Group expenses by category
function groupByCategory(expenses) {
    return expenses.reduce((groups, expense) => {
        const category = expense.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(expense);
        return groups;
    }, {});
}

// Group expenses by date
function groupByDate(expenses) {
    return expenses.reduce((groups, expense) => {
        const date = expense.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(expense);
        return groups;
    }, {});
}

// Calculate category totals
function calculateCategoryTotals(expenses) {
    const grouped = groupByCategory(expenses);
    const totals = {};
    
    for (const [category, categoryExpenses] of Object.entries(grouped)) {
        totals[category] = calculateTotal(categoryExpenses);
    }
    
    return totals;
}

// Get current month expenses
function getCurrentMonthExpenses(expenses) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
    });
}

// Get previous month expenses
function getPreviousMonthExpenses(expenses) {
    const now = new Date();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= prevMonthStart && expenseDate <= prevMonthEnd;
    });
}

// Calculate daily average
function calculateDailyAverage(expenses, days = 30) {
    const total = calculateTotal(expenses);
    return total / days;
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate expense data
function validateExpense(expense) {
    if (!expense.description || expense.description.trim() === '') {
        throw new Error('Description is required');
    }
    
    if (!expense.amount || expense.amount <= 0) {
        throw new Error('Amount must be greater than 0');
    }
    
    if (!expense.date) {
        throw new Error('Date is required');
    }
    
    if (!expense.category) {
        throw new Error('Category is required');
    }
    
    return true;
}

// Export data as JSON
function exportToJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
}

// Parse JSON file
function parseJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsText(file);
    });
}

// Sort expenses by date (newest first)
function sortByDateDesc(expenses) {
    return [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Get last N days of data
function getLastNDays(expenses, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return expenses.filter(expense => new Date(expense.date) >= cutoffDate);
}

// Calculate statistics
function calculateStats(expenses) {
    if (expenses.length === 0) {
        return {
            total: 0,
            average: 0,
            min: 0,
            max: 0,
            count: 0
        };
    }
    
    const amounts = expenses.map(e => e.amount);
    const total = amounts.reduce((sum, amt) => sum + amt, 0);
    
    return {
        total,
        average: total / expenses.length,
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        count: expenses.length
    };
}
