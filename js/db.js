// =====================================================
// IndexedDB Database Management for SnapLedger
// =====================================================

const DB_NAME = 'SnapLedgerDB';
const DB_VERSION = 1;
let db = null;

// Initialize Database
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            reject('Database failed to open');
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('Database initialized successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (e) => {
            db = e.target.result;
            
            // Expenses store
            if (!db.objectStoreNames.contains('expenses')) {
                const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
                expenseStore.createIndex('date', 'date', { unique: false });
                expenseStore.createIndex('category', 'category', { unique: false });
                expenseStore.createIndex('amount', 'amount', { unique: false });
            }
            
            // Settings store
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
            
            // ML Models store
            if (!db.objectStoreNames.contains('models')) {
                db.createObjectStore('models', { keyPath: 'name' });
            }
            
            console.log('Database setup complete');
        };
    });
}

// =====================================================
// Expense Operations
// =====================================================

// Add expense
async function addExpense(expense) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readwrite');
        const store = transaction.objectStore('expenses');
        const request = store.add(expense);
        
        request.onsuccess = () => {
            resolve(expense);
        };
        
        request.onerror = () => {
            reject('Failed to add expense');
        };
    });
}

// Get all expenses
async function getAllExpenses() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readonly');
        const store = transaction.objectStore('expenses');
        const request = store.getAll();
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject('Failed to get expenses');
        };
    });
}

// Get expense by ID
async function getExpenseById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readonly');
        const store = transaction.objectStore('expenses');
        const request = store.get(id);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject('Failed to get expense');
        };
    });
}

// Update expense
async function updateExpense(expense) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readwrite');
        const store = transaction.objectStore('expenses');
        const request = store.put(expense);
        
        request.onsuccess = () => {
            resolve(expense);
        };
        
        request.onerror = () => {
            reject('Failed to update expense');
        };
    });
}

// Delete expense
async function deleteExpense(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readwrite');
        const store = transaction.objectStore('expenses');
        const request = store.delete(id);
        
        request.onsuccess = () => {
            resolve(true);
        };
        
        request.onerror = () => {
            reject('Failed to delete expense');
        };
    });
}

// Delete all expenses
async function deleteAllExpenses() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readwrite');
        const store = transaction.objectStore('expenses');
        const request = store.clear();
        
        request.onsuccess = () => {
            resolve(true);
        };
        
        request.onerror = () => {
            reject('Failed to clear expenses');
        };
    });
}

// =====================================================
// Settings Operations
// =====================================================

// Save setting
async function saveSetting(key, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const request = store.put({ key, value });
        
        request.onsuccess = () => {
            resolve({ key, value });
        };
        
        request.onerror = () => {
            reject('Failed to save setting');
        };
    });
}

// Get setting
async function getSetting(key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get(key);
        
        request.onsuccess = () => {
            resolve(request.result ? request.result.value : null);
        };
        
        request.onerror = () => {
            reject('Failed to get setting');
        };
    });
}

// Get all settings
async function getAllSettings() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const settings = {};
            request.result.forEach(item => {
                settings[item.key] = item.value;
            });
            resolve(settings);
        };
        
        request.onerror = () => {
            reject('Failed to get settings');
        };
    });
}

// =====================================================
// ML Model Operations
// =====================================================

// Save ML model
async function saveModel(name, modelData) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['models'], 'readwrite');
        const store = transaction.objectStore('models');
        const request = store.put({ name, data: modelData, timestamp: Date.now() });
        
        request.onsuccess = () => {
            resolve(true);
        };
        
        request.onerror = () => {
            reject('Failed to save model');
        };
    });
}

// Get ML model
async function getModel(name) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['models'], 'readonly');
        const store = transaction.objectStore('models');
        const request = store.get(name);
        
        request.onsuccess = () => {
            resolve(request.result ? request.result.data : null);
        };
        
        request.onerror = () => {
            reject('Failed to get model');
        };
    });
}

// =====================================================
// Bulk Operations
// =====================================================

// Import expenses (bulk add)
async function importExpenses(expenses) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readwrite');
        const store = transaction.objectStore('expenses');
        
        let successCount = 0;
        let errorCount = 0;
        
        expenses.forEach(expense => {
            const request = store.add(expense);
            request.onsuccess = () => successCount++;
            request.onerror = () => errorCount++;
        });
        
        transaction.oncomplete = () => {
            resolve({ success: successCount, errors: errorCount });
        };
        
        transaction.onerror = () => {
            reject('Failed to import expenses');
        };
    });
}

// Export all data
async function exportAllData() {
    const expenses = await getAllExpenses();
    const settings = await getAllSettings();
    
    return {
        expenses,
        settings,
        exportDate: new Date().toISOString(),
        version: DB_VERSION
    };
}

// Import all data
async function importAllData(data) {
    try {
        // Clear existing data
        await deleteAllExpenses();
        
        // Import expenses
        if (data.expenses && data.expenses.length > 0) {
            await importExpenses(data.expenses);
        }
        
        // Import settings
        if (data.settings) {
            for (const [key, value] of Object.entries(data.settings)) {
                await saveSetting(key, value);
            }
        }
        
        return true;
    } catch (error) {
        throw new Error('Failed to import data: ' + error.message);
    }
}
