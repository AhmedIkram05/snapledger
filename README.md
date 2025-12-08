# 💰 SnapLedger PWA

An AI-powered Progressive Web App for intelligent personal finance management.

## ✨ Features

### 📱 PWA Capabilities
- **Installable**: Add to home screen on any device
- **Offline-first**: Works without internet connection
- **Responsive**: Optimized for mobile, tablet, and desktop
- **Fast**: Service worker caching for instant loading

### 🤖 AI/ML Features
- **Smart Categorization**: Automatically categorizes expenses using ML
- **Spending Predictions**: Forecasts future spending patterns
- **Budget Recommendations**: AI-powered budget suggestions
- **Anomaly Detection**: Alerts for unusual spending behavior
- **Financial Insights**: Personalized tips and advice

### 💰 Finance Features
- **Expense Tracking**: Quick and easy expense entry
- **Budget Management**: Set and track spending limits
- **Visual Analytics**: Interactive charts and graphs
- **Categories**: Customizable expense categories
- **Search & Filter**: Find transactions quickly
- **Export Data**: Download your financial data

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd "SnapLedger PWA"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Installing as PWA

1. Open the app in Chrome/Edge/Safari
2. Click the install icon in the address bar
3. Confirm installation
4. Access from your home screen or app drawer

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **ML/AI**: TensorFlow.js for client-side machine learning
- **Data Visualization**: Chart.js for interactive charts
- **Storage**: IndexedDB (via idb) for offline data persistence
- **PWA**: Service Worker API for caching and offline support

### Project Structure
```
SnapLedger PWA/
├── index.html              # Main app entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   ├── app.js              # Main application logic
│   ├── db.js               # IndexedDB operations
│   ├── ai.js               # ML/AI features
│   ├── charts.js           # Data visualization
│   └── utils.js            # Helper functions
└── assets/
    └── icons/              # PWA icons

```

## 🤖 AI Features Explained

### Expense Categorization
Uses a trained neural network to automatically categorize expenses based on description and amount patterns.

### Spending Prediction
Analyzes historical spending patterns to forecast future expenses and help with budget planning.

### Budget Recommendations
Machine learning algorithm suggests optimal budget allocations based on your spending habits.

### Anomaly Detection
Identifies unusual transactions that deviate from normal spending patterns.

## 📊 Data Privacy

All data is stored locally on your device using IndexedDB. No data is sent to external servers. The ML models run entirely in your browser using TensorFlow.js.

## 🔧 Configuration

You can customize categories, budgets, and preferences in the app settings.

## 📱 Browser Support

- Chrome/Edge (recommended): Full PWA support
- Firefox: Core features supported
- Safari: iOS 11.3+ for PWA features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🎯 Roadmap

- [ ] Multi-currency support
- [ ] Receipt scanning with OCR
- [ ] Recurring transactions
- [ ] Financial goal tracking
- [ ] Data sync across devices
- [ ] More advanced ML models
- [ ] Investment tracking
- [ ] Bill reminders

## 💡 Tips for Best Experience

1. **Regular Updates**: Add expenses daily for accurate insights
2. **Categorize Properly**: Help the AI learn by correcting categories
3. **Set Budgets**: Define monthly budgets for better tracking
4. **Install as App**: Install as PWA for the best experience
5. **Backup Data**: Regularly export your data as backup

---

Made with ❤️ for better financial management
