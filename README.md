# Farmingdale Lunch Guide

A web-based restaurant discovery application designed for students at Farmingdale State College. Find the best lunch spots near campus with easy filtering, searching, and favorites management.

## Features

- **Restaurant Browsing**: View 10+ local restaurants with details including ratings, prices, and descriptions
- **Category Filtering**: Filter by cuisine type (Pizza, Deli, Asian, Fast Food, Cafe)
- **Price Filtering**: Filter by price range ($, $$, $$$)
- **Multi-Category Selection**: Select multiple categories simultaneously
- **Sorting Options**: Sort by rating, distance, price, or name
- **Search**: Real-time search across restaurant names, categories, and descriptions
- **Favorites**: Save your favorite restaurants with persistent localStorage
- **Dark Mode**: Toggle between light and dark themes
- **Toast Notifications**: Non-blocking feedback for user actions
- **Responsive Design**: Works on desktop and mobile devices
- **Offline Support**: Service worker caches assets for offline access
- **Lazy Loading**: Images load on-demand for better performance
- **Accessibility**: Keyboard navigation, skip links, and ARIA labels

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/farmingdale/lunch-guide.git
   cd farmingdale-lunch-guide
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:3000`

## Project Structure

```
farmingdale-lunch-guide/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Responsive styling with CSS Grid
├── js/
│   ├── constants.js        # Application constants and configuration
│   ├── utils.js            # Utility functions
│   ├── storage.js          # localStorage management
│   ├── api.js              # API simulation and data filtering
│   ├── data.js             # Sample restaurant dataset
│   ├── toast.js            # Toast notification system
│   ├── ui.js               # DOM rendering and manipulation
│   └── app.js              # Main application orchestrator
├── data/
│   └── restaurants.json    # Externalized restaurant data
├── tests/
│   ├── utils.test.js       # Unit tests for utilities
│   ├── storage.test.js     # Unit tests for storage
│   ├── api.test.js         # Unit tests for API
│   └── e2e/
│       └── app.spec.js     # End-to-end tests
├── package.json            # npm configuration
├── .eslintrc.json          # ESLint configuration
├── jest.config.js          # Jest configuration
├── playwright.config.js    # Playwright configuration
└── README.md               # This file
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start local development server |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm test` | Run unit tests with Jest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run e2e` | Run end-to-end tests with Playwright |
| `npm run e2e:ui` | Run e2e tests with Playwright UI |

## Architecture

### Module Pattern
The application uses the JavaScript module pattern with namespace objects:

- **Constants**: Centralized configuration values
- **Utils**: Pure utility functions (JSON parsing, DOM helpers, validation)
- **Storage**: localStorage abstraction with error handling
- **Api**: Data fetching simulation with retry logic
- **UI**: DOM manipulation and rendering
- **Toast**: Non-blocking notification system
- **App**: Main orchestrator coordinating all modules

### Error Handling
Comprehensive error handling throughout:
- Try-catch blocks in all functions
- Custom `ApiError` class with error codes
- User-friendly error messages
- Graceful fallbacks
- Console logging for debugging

### Security
- HTML escaping to prevent XSS attacks
- Input validation on all user data
- Safe localStorage operations
- No external dependencies in core app

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Farmingdale State College
- Restaurant images from Unsplash
- Icons from Unicode emoji set
