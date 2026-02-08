// =====================================================
// AI/ML Features for SnapLedger using TensorFlow.js
// =====================================================

let categorizationModel = null;
let isModelReady = false;

// Category labels for the model
const CATEGORIES = ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'other'];

// =====================================================
// Initialize AI Models
// =====================================================

async function initAI() {
    try {
        console.log('Initializing AI models...');
        
        // For now, we'll use a simple rule-based system
        // In a production app, you'd train a proper model
        isModelReady = true;
        
        console.log('AI models ready');
        return true;
    } catch (error) {
        console.error('Error initializing AI:', error);
        return false;
    }
}

// =====================================================
// Expense Categorization
// =====================================================

// Suggest category based on description
function suggestCategory(description, amount) {
    const desc = description.toLowerCase();
    
    // Food keywords
    if (desc.match(/coffee|restaurant|food|lunch|dinner|breakfast|pizza|burger|cafe|starbucks|mcdonald|subway|grocery|supermarket/)) {
        return 'food';
    }
    
    // Transport keywords
    if (desc.match(/uber|lyft|taxi|gas|fuel|parking|metro|bus|train|flight|car|vehicle/)) {
        return 'transport';
    }
    
    // Shopping keywords
    if (desc.match(/amazon|store|shop|buy|purchase|cloth|shoe|electronics|online|walmart|target/)) {
        return 'shopping';
    }
    
    // Bills keywords
    if (desc.match(/bill|rent|electric|water|internet|phone|utility|subscription|netflix|spotify|insurance/)) {
        return 'bills';
    }
    
    // Entertainment keywords
    if (desc.match(/movie|cinema|concert|game|sport|ticket|entertainment|theater|netflix|spotify|music/)) {
        return 'entertainment';
    }
    
    // Health keywords
    if (desc.match(/doctor|hospital|pharmacy|medicine|gym|fitness|health|medical|dental|dentist/)) {
        return 'health';
    }
    
    // Education keywords
    if (desc.match(/book|course|school|college|university|education|tuition|learning|class|seminar/)) {
        return 'education';
    }
    
    return 'other';
}

// Get confidence score for a category suggestion
function getCategoryConfidence(description, suggestedCategory) {
    const desc = description.toLowerCase();
    const categoryKeywords = {
        food: ['coffee', 'restaurant', 'food', 'lunch', 'dinner', 'pizza'],
        transport: ['uber', 'taxi', 'gas', 'parking', 'bus'],
        shopping: ['amazon', 'store', 'shop', 'buy'],
        bills: ['bill', 'rent', 'electric', 'subscription'],
        entertainment: ['movie', 'concert', 'game', 'ticket'],
        health: ['doctor', 'hospital', 'gym', 'fitness'],
        education: ['book', 'course', 'school', 'education'],
        other: []
    };
    
    const keywords = categoryKeywords[suggestedCategory] || [];
    const matchCount = keywords.filter(keyword => desc.includes(keyword)).length;
    
    return Math.min((matchCount / 3) * 100, 95); // Max 95% confidence
}

// =====================================================
// Spending Predictions
// =====================================================

// Predict next month's spending
async function predictNextMonthSpending(expenses) {
    if (expenses.length < 30) {
        return null; // Not enough data
    }
    
    // Get last 3 months of data
    const last90Days = getLastNDays(expenses, 90);
    
    // Calculate monthly averages
    const monthlyTotals = {};
    last90Days.forEach(expense => {
        const month = new Date(expense.date).toISOString().slice(0, 7);
        monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.amount;
    });
    
    const totals = Object.values(monthlyTotals);
    const average = totals.reduce((sum, val) => sum + val, 0) / totals.length;
    
    // Simple linear regression for trend
    const trend = totals.length > 1 ? (totals[totals.length - 1] - totals[0]) / totals.length : 0;
    
    return {
        predicted: average + trend,
        confidence: Math.min((totals.length / 12) * 100, 90),
        trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable'
    };
}

// Predict category spending
async function predictCategorySpending(expenses, category) {
    const categoryExpenses = expenses.filter(e => e.category === category);
    
    if (categoryExpenses.length < 10) {
        return null;
    }
    
    const last30Days = getLastNDays(categoryExpenses, 30);
    const total = calculateTotal(last30Days);
    const average = total / 30;
    
    return {
        dailyAverage: average,
        monthlyProjection: average * 30,
        categoryPercentage: (total / calculateTotal(getLastNDays(expenses, 30))) * 100
    };
}

// =====================================================
// Budget Recommendations
// =====================================================

// Generate budget recommendations based on spending patterns
async function generateBudgetRecommendations(expenses) {
    if (expenses.length < 30) {
        return {
            recommendations: [],
            message: 'Add more transactions to get personalized budget recommendations'
        };
    }
    
    const last90Days = getLastNDays(expenses, 90);
    const categoryTotals = calculateCategoryTotals(last90Days);
    const totalSpending = calculateTotal(last90Days);
    const monthlyAverage = totalSpending / 3;
    
    const recommendations = [];
    
    // Recommend total budget (with 10% buffer)
    recommendations.push({
        type: 'total',
        title: 'Monthly Budget Recommendation',
        amount: Math.ceil(monthlyAverage * 1.1),
        reason: 'Based on your average monthly spending plus 10% buffer'
    });
    
    // Category-specific recommendations
    for (const [category, total] of Object.entries(categoryTotals)) {
        const categoryMonthly = total / 3;
        const percentage = (categoryMonthly / monthlyAverage) * 100;
        
        recommendations.push({
            type: 'category',
            category,
            title: `${getCategoryName(category)} Budget`,
            amount: Math.ceil(categoryMonthly * 1.05),
            percentage: percentage.toFixed(1),
            reason: `Currently ${percentage.toFixed(0)}% of your spending`
        });
    }
    
    return { recommendations };
}

// =====================================================
// Anomaly Detection
// =====================================================

// Detect unusual transactions
async function detectAnomalies(expenses) {
    if (expenses.length < 20) {
        return [];
    }
    
    const anomalies = [];
    
    // Group by category
    const categoryGroups = groupByCategory(expenses);
    
    for (const [category, categoryExpenses] of Object.entries(categoryGroups)) {
        if (categoryExpenses.length < 5) continue;
        
        // Calculate statistics
        const amounts = categoryExpenses.map(e => e.amount);
        const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
        const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        
        // Find outliers (more than 2 standard deviations from mean)
        categoryExpenses.forEach(expense => {
            const zScore = Math.abs((expense.amount - mean) / stdDev);
            
            if (zScore > 2) {
                anomalies.push({
                    expense,
                    severity: zScore > 3 ? 'high' : 'medium',
                    reason: `${formatCurrency(expense.amount)} is ${zScore.toFixed(1)}x higher than your average ${getCategoryName(category)} expense`,
                    type: 'unusual_amount'
                });
            }
        });
    }
    
    // Detect unusual frequency
    const last7Days = getLastNDays(expenses, 7);
    const recentCount = last7Days.length;
    const averageWeekly = (expenses.length / 90) * 7;
    
    if (recentCount > averageWeekly * 1.5) {
        anomalies.push({
            severity: 'medium',
            reason: `You've made ${recentCount} transactions in the last week, which is higher than usual`,
            type: 'unusual_frequency'
        });
    }
    
    return anomalies.slice(0, 5); // Return top 5 anomalies
}

// =====================================================
// Financial Insights
// =====================================================

// Generate AI insights
async function generateInsights(expenses) {
    if (expenses.length === 0) {
        return [{
            icon: getIcon('lightbulb'),
            title: 'Getting Started',
            message: 'Start adding your expenses to unlock AI-powered insights!',
            priority: 'low'
        }];
    }
    
    const insights = [];
    const last30Days = getLastNDays(expenses, 30);
    const categoryTotals = calculateCategoryTotals(last30Days);
    const totalSpent = calculateTotal(last30Days);
    
    // Top spending category
    const topCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0];
    
    if (topCategory) {
        const percentage = (topCategory[1] / totalSpent) * 100;
        insights.push({
            icon: getCategoryIcon(topCategory[0]),
            title: 'Top Spending Category',
            message: `${getCategoryName(topCategory[0])} accounts for ${percentage.toFixed(0)}% of your monthly spending (${formatCurrency(topCategory[1])})`,
            priority: 'high'
        });
    }
    
    // Spending trend
    const last60Days = getLastNDays(expenses, 60);
    const first30 = last60Days.slice(0, 30);
    const second30 = last60Days.slice(30);
    
    const firstTotal = calculateTotal(first30);
    const secondTotal = calculateTotal(second30);
    
    if (firstTotal > 0) {
        const change = ((secondTotal - firstTotal) / firstTotal) * 100;
        
        if (Math.abs(change) > 10) {
            insights.push({
                icon: change > 0 ? getIcon('trending-up') : getIcon('trending-down'),
                title: 'Spending Trend',
                message: `Your spending has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(0)}% compared to the previous month`,
                priority: change > 20 ? 'high' : 'medium'
            });
        }
    }
    
    // Weekend spending
    const weekendExpenses = last30Days.filter(e => {
        const day = new Date(e.date).getDay();
        return day === 0 || day === 6;
    });
    
    if (weekendExpenses.length > 0) {
        const weekendTotal = calculateTotal(weekendExpenses);
        const weekendPercentage = (weekendTotal / totalSpent) * 100;
        
        if (weekendPercentage > 30) {
            insights.push({
                icon: getIcon('calendar'),
                title: 'Weekend Spending',
                message: `${weekendPercentage.toFixed(0)}% of your spending happens on weekends (${formatCurrency(weekendTotal)})`,
                priority: 'medium'
            });
        }
    }
    
    // Saving opportunity
    const dailyAverage = totalSpent / 30;
    const potentialSavings = dailyAverage * 0.15; // 15% reduction goal
    
    insights.push({
        icon: getIcon('piggy-bank'),
        title: 'Saving Opportunity',
        message: `Reducing daily spending by 15% could save you ${formatCurrency(potentialSavings * 30)} per month`,
        priority: 'medium'
    });
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return insights;
}

// =====================================================
// Smart Notifications
// =====================================================

// Check if user should be notified about spending
async function checkSpendingAlerts(expenses, monthlyBudget) {
    const alerts = [];
    const currentMonth = getCurrentMonthExpenses(expenses);
    const monthlyTotal = calculateTotal(currentMonth);
    
    if (monthlyBudget && monthlyTotal > 0) {
        const percentage = (monthlyTotal / monthlyBudget) * 100;
        
        if (percentage >= 90) {
            alerts.push({
                type: 'budget',
                severity: 'high',
                message: `${getIcon('alert-triangle')} You've used ${percentage.toFixed(0)}% of your monthly budget!`
            });
        } else if (percentage >= 75) {
            alerts.push({
                type: 'budget',
                severity: 'medium',
                message: `${getIcon('zap')} You've used ${percentage.toFixed(0)}% of your monthly budget`
            });
        }
    }
    
    return alerts;
}
