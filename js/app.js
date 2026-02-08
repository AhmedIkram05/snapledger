// =====================================================
// Main Application Logic for SnapLedger
// =====================================================

let expenses = [];
let currentTab = 'dashboard';
let monthlyBudget = 0;
let deferredPrompt = null;

// =====================================================
// Initialize Application
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('SnapLedger initializing...');
    
    // Initialize database
    await initDB();
    
    // Initialize AI
    await initAI();
    
    // Load data
    await loadData();
    
    // Initialize charts
    initCharts();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup PWA install prompt
    setupPWAInstall();
    
    // Update UI
    updateUI();
    
    console.log('SnapLedger ready!');
});

// =====================================================
// Data Loading
// =====================================================

async function loadData() {
    try {
        // Load expenses
        expenses = await getAllExpenses();
        console.log(`Loaded ${expenses.length} expenses`);
        
        // Load settings
        monthlyBudget = await getSetting('monthlyBudget') || 0;
        
        // Set default date for expense form
        document.getElementById('expenseDate').value = getDateInputValue();
        
        // Load monthly budget value
        document.getElementById('monthlyBudget').value = monthlyBudget || '';
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data', 'error');
    }
}

// =====================================================
// Event Listeners Setup
// =====================================================

function setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
        
        // Add hover functionality for desktop devices
        // Use matchMedia to check if the device supports hover (i.e., has a mouse/pointer device)
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            tab.addEventListener('mouseenter', (e) => {
                switchTab(e.target.dataset.tab);
            });
        }
    });
    
    // Expense form
    document.getElementById('expenseForm').addEventListener('submit', handleExpenseSubmit);
    
    // AI suggestion
    document.getElementById('expenseDescription').addEventListener('input', 
        debounce(handleDescriptionInput, 500)
    );
    
    document.getElementById('acceptSuggestion').addEventListener('click', acceptAISuggestion);
    
    // Filters
    document.getElementById('searchExpenses').addEventListener('input',
        debounce(applyFilters, 300)
    );
    
    document.getElementById('filterCategory').addEventListener('change', applyFilters);
    document.getElementById('filterPeriod').addEventListener('change', applyFilters);
    
    // Budget form
    document.getElementById('budgetForm').addEventListener('submit', handleBudgetSubmit);
    
    // Data management
    document.getElementById('exportData').addEventListener('click', handleExportData);
    document.getElementById('importData').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', handleImportData);
    document.getElementById('clearData').addEventListener('click', handleClearData);
}

// =====================================================
// Tab Navigation
// =====================================================

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Update content when switching tabs
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'expenses') {
        updateExpensesList();
    } else if (tabName === 'insights') {
        updateInsights();
    }
}

// =====================================================
// Expense Management
// =====================================================

async function handleExpenseSubmit(e) {
    e.preventDefault();
    
    const description = document.getElementById('expenseDescription').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const date = document.getElementById('expenseDate').value;
    const category = document.getElementById('expenseCategory').value || 
                     suggestCategory(description, amount);
    
    const expense = {
        id: generateId(),
        description,
        amount,
        date,
        category,
        createdAt: new Date().toISOString()
    };
    
    try {
        validateExpense(expense);
        await addExpense(expense);
        expenses.push(expense);
        
        showToast('Expense added successfully!', 'success');
        
        // Reset form
        e.target.reset();
        document.getElementById('expenseDate').value = getDateInputValue();
        document.getElementById('aiSuggestion').style.display = 'none';
        
        // Update UI
        updateUI();
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleDeleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        await deleteExpense(id);
        expenses = expenses.filter(e => e.id !== id);
        
        showToast('Expense deleted', 'success');
        updateUI();
        
    } catch (error) {
        showToast('Error deleting expense', 'error');
    }
}

// =====================================================
// AI Features
// =====================================================

function handleDescriptionInput(e) {
    const description = e.target.value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value) || 0;
    
    if (description.length > 3) {
        const suggested = suggestCategory(description, amount);
        const confidence = getCategoryConfidence(description, suggested);
        
        if (confidence > 30) {
            document.getElementById('suggestedCategory').textContent = 
                getCategoryEmoji(suggested) + ' ' + getCategoryName(suggested);
            document.getElementById('aiSuggestion').style.display = 'flex';
            document.getElementById('aiSuggestion').dataset.category = suggested;
        }
    } else {
        document.getElementById('aiSuggestion').style.display = 'none';
    }
}

function acceptAISuggestion() {
    const suggested = document.getElementById('aiSuggestion').dataset.category;
    document.getElementById('expenseCategory').value = suggested;
    document.getElementById('aiSuggestion').style.display = 'none';
}

// =====================================================
// Filters
// =====================================================

function applyFilters() {
    const searchQuery = document.getElementById('searchExpenses').value.trim();
    const category = document.getElementById('filterCategory').value;
    const period = document.getElementById('filterPeriod').value;
    
    let filtered = [...expenses];
    
    // Apply search
    if (searchQuery) {
        filtered = searchExpenses(filtered, searchQuery);
    }
    
    // Apply category filter
    if (category) {
        filtered = filtered.filter(e => e.category === category);
    }
    
    // Apply period filter
    if (period !== 'all') {
        filtered = filterByPeriod(filtered, period);
    }
    
    renderExpensesList(filtered);
}

// =====================================================
// UI Updates
// =====================================================

function updateUI() {
    updateDashboard();
    updateExpensesList();
    updateInsights();
    updateAllCharts(expenses);
}

function updateDashboard() {
    const currentMonth = getCurrentMonthExpenses(expenses);
    const previousMonth = getPreviousMonthExpenses(expenses);
    
    const monthlyTotal = calculateTotal(currentMonth);
    const previousTotal = calculateTotal(previousMonth);
    const change = calculatePercentageChange(monthlyTotal, previousTotal);
    
    // Update summary cards
    document.getElementById('monthlyTotal').textContent = formatCurrency(monthlyTotal);
    
    const changeElement = document.getElementById('monthlyChange');
    changeElement.textContent = (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
    changeElement.className = 'change-indicator ' + (change >= 0 ? 'negative' : 'positive');
    
    // Budget
    const budgetLeft = monthlyBudget - monthlyTotal;
    document.getElementById('budgetLeft').textContent = 
        monthlyBudget ? formatCurrency(Math.max(0, budgetLeft)) : 'Not set';
    
    const budgetProgress = monthlyBudget ? 
        Math.min((monthlyTotal / monthlyBudget) * 100, 100) : 0;
    document.getElementById('budgetProgress').style.width = budgetProgress + '%';
    
    // Daily average
    const last30Days = getLastNDays(expenses, 30);
    const dailyAvg = calculateDailyAverage(last30Days, 30);
    document.getElementById('dailyAverage').textContent = formatCurrency(dailyAvg);
    
    // Recent transactions
    const recent = sortByDateDesc(expenses).slice(0, 5);
    renderRecentTransactions(recent);
    
    // Update charts
    updateAllCharts(expenses);
}

function renderRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    
    if (transactions.length === 0) {
        container.innerHTML = '<p class="empty-state">No transactions yet. Add your first expense!</p>';
        return;
    }
    
    container.innerHTML = transactions.map(expense => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-description">
                    ${getCategoryIcon(expense.category)} ${expense.description}
                </div>
                <div class="transaction-meta">
                    ${formatDate(expense.date)} • ${getCategoryName(expense.category)}
                </div>
            </div>
            <div class="transaction-amount">${formatCurrency(expense.amount)}</div>
        </div>
    `).join('');
}

function updateExpensesList() {
    applyFilters();
}

function renderExpensesList(expensesList) {
    const container = document.getElementById('expensesList');
    
    if (expensesList.length === 0) {
        container.innerHTML = '<p class="empty-state">No expenses to show.</p>';
        return;
    }
    
    const sorted = sortByDateDesc(expensesList);
    
    container.innerHTML = sorted.map(expense => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-description">
                    ${getCategoryIcon(expense.category)} ${expense.description}
                </div>
                <div class="transaction-meta">
                    ${formatDate(expense.date)} • ${getCategoryName(expense.category)}
                </div>
            </div>
            <div class="transaction-amount">${formatCurrency(expense.amount)}</div>
            <div class="transaction-actions">
                <button class="btn-icon" onclick="handleDeleteExpense('${expense.id}')" title="Delete">
                    ${getIcon('trash-2', 'delete-icon')}
                </button>
            </div>
        </div>
    `).join('');
}

async function updateInsights() {
    // AI Insights
    const insights = await generateInsights(expenses);
    const insightsContainer = document.getElementById('aiInsights');
    
    insightsContainer.innerHTML = insights.map(insight => `
        <div class="insight">
            <span class="insight-icon">${insight.icon}</span>
            <div class="insight-content">
                <strong>${insight.title}</strong>
                <p>${insight.message}</p>
            </div>
        </div>
    `).join('');
    
    // Predictions
    const prediction = await predictNextMonthSpending(expenses);
    const predictionsContainer = document.getElementById('predictions');
    
    if (prediction) {
        predictionsContainer.innerHTML = `
            <div class="prediction-card">
                <div class="label">Next Month Forecast</div>
                <div class="prediction-amount">${formatCurrency(prediction.predicted)}</div>
                <div class="label">${prediction.trend} trend</div>
            </div>
        `;
    } else {
        predictionsContainer.innerHTML = '<p class="empty-state">Need more data for predictions (minimum 30 days)</p>';
    }
    
    // Budget Recommendations
    const recommendations = await generateBudgetRecommendations(expenses);
    const recsContainer = document.getElementById('budgetRecommendations');
    
    if (recommendations.recommendations.length > 0) {
        recsContainer.innerHTML = recommendations.recommendations.map(rec => `
            <div class="insight">
                <span class="insight-icon"></span>
                <div class="insight-content">
                    <strong>${rec.title}</strong>
                    <p>${formatCurrency(rec.amount)} - ${rec.reason}</p>
                </div>
            </div>
        `).join('');
    } else {
        recsContainer.innerHTML = `<p class="empty-state">${recommendations.message}</p>`;
    }
    
    // Anomalies
    const anomalies = await detectAnomalies(expenses);
    const anomaliesContainer = document.getElementById('anomalies');
    
    if (anomalies.length > 0) {
        anomaliesContainer.innerHTML = anomalies.map(anomaly => `
            <div class="insight">
                <span class="insight-icon"></span>
                <div class="insight-content">
                    <strong>${anomaly.severity === 'high' ? 'High Alert' : 'Notice'}</strong>
                    <p>${anomaly.reason}</p>
                </div>
            </div>
        `).join('');
    } else {
        anomaliesContainer.innerHTML = '<p class="empty-state">No unusual spending detected.</p>';
    }
}

// =====================================================
// Budget Management
// =====================================================

async function handleBudgetSubmit(e) {
    e.preventDefault();
    
    const budget = parseFloat(document.getElementById('monthlyBudget').value);
    
    if (budget && budget > 0) {
        await saveSetting('monthlyBudget', budget);
        monthlyBudget = budget;
        
        showToast('Budget saved successfully!', 'success');
        updateDashboard();
    } else {
        showToast('Please enter a valid budget amount', 'error');
    }
}

// =====================================================
// Data Management
// =====================================================

async function handleExportData() {
    try {
        const data = await exportAllData();
        const filename = `snapledger-export-${new Date().toISOString().split('T')[0]}.json`;
        exportToJSON(data, filename);
        showToast('Data exported successfully!', 'success');
    } catch (error) {
        showToast('Error exporting data', 'error');
    }
}

async function handleImportData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const data = await parseJSONFile(file);
        
        if (confirm('This will replace all existing data. Continue?')) {
            await importAllData(data);
            await loadData();
            updateUI();
            showToast('Data imported successfully!', 'success');
        }
    } catch (error) {
        showToast('Error importing data: ' + error.message, 'error');
    }
    
    // Reset file input
    e.target.value = '';
}

async function handleClearData() {
    if (!confirm('This will delete ALL your data. This cannot be undone. Are you sure?')) {
        return;
    }
    
    if (!confirm('Really? This will permanently delete everything!')) {
        return;
    }
    
    try {
        await deleteAllExpenses();
        expenses = [];
        updateUI();
        showToast('All data cleared', 'success');
    } catch (error) {
        showToast('Error clearing data', 'error');
    }
}

// =====================================================
// PWA Installation
// =====================================================

function setupPWAInstall() {
    const installBtn = document.getElementById('installBtn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
    });
    
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            showToast('App installed successfully!', 'success');
        }
        
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });
    
    window.addEventListener('appinstalled', () => {
        showToast('SnapLedger installed!', 'success');
        deferredPrompt = null;
    });
}
