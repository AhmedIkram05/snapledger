// =====================================================
// Chart.js Visualization for SnapLedger
// =====================================================

let spendingChart = null;
let categoryChart = null;

// Chart.js default configuration
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
Chart.defaults.color = '#6B7280';

// =====================================================
// Initialize Charts
// =====================================================

function initCharts() {
    initSpendingChart();
    initCategoryChart();
}

// =====================================================
// Spending Trend Chart (Line Chart)
// =====================================================

function initSpendingChart() {
    const ctx = document.getElementById('spendingChart');
    if (!ctx) return;
    
    spendingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Daily Spending',
                data: [],
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    },
                    grid: {
                        color: '#E5E7EB'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Update spending chart with data
function updateSpendingChart(expenses) {
    if (!spendingChart) return;
    
    // Get last 14 days
    const last14Days = getLastNDays(expenses, 14);
    const dailyData = {};
    
    // Initialize all dates with 0
    for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = 0;
    }
    
    // Sum expenses by date
    last14Days.forEach(expense => {
        const dateStr = expense.date;
        dailyData[dateStr] = (dailyData[dateStr] || 0) + expense.amount;
    });
    
    // Format data for chart
    const labels = Object.keys(dailyData).map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const data = Object.values(dailyData);
    
    spendingChart.data.labels = labels;
    spendingChart.data.datasets[0].data = data;
    spendingChart.update();
}

// =====================================================
// Category Breakdown Chart (Doughnut Chart)
// =====================================================

function initCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#EF4444', // Red
                    '#F59E0B', // Amber
                    '#10B981', // Green
                    '#3B82F6', // Blue
                    '#8B5CF6', // Purple
                    '#EC4899', // Pink
                    '#14B8A6', // Teal
                    '#6B7280'  // Gray
                ],
                borderWidth: 2,
                borderColor: '#FFFFFF'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update category chart with data
function updateCategoryChart(expenses) {
    if (!categoryChart) return;
    
    const currentMonth = getCurrentMonthExpenses(expenses);
    const categoryTotals = calculateCategoryTotals(currentMonth);
    
    if (Object.keys(categoryTotals).length === 0) {
        categoryChart.data.labels = ['No data'];
        categoryChart.data.datasets[0].data = [1];
        categoryChart.update();
        return;
    }
    
    const labels = Object.keys(categoryTotals).map(cat => 
        getCategoryEmoji(cat) + ' ' + getCategoryName(cat)
    );
    const data = Object.values(categoryTotals);
    
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = data;
    categoryChart.update();
}

// =====================================================
// Update All Charts
// =====================================================

function updateAllCharts(expenses) {
    updateSpendingChart(expenses);
    updateCategoryChart(expenses);
}

// =====================================================
// Destroy Charts (for cleanup)
// =====================================================

function destroyCharts() {
    if (spendingChart) {
        spendingChart.destroy();
        spendingChart = null;
    }
    
    if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
    }
}
