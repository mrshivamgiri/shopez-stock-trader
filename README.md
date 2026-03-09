# Shopez Stock Trader

This repository contains the **Shopez Stock Trader** application, a React/Vite based web interface for tracking and trading stocks. It includes authentication, real-time charts, user portfolios, and an admin dashboard.

## 🚀 Features

- User registration and login with context-based auth
- Dashboard displaying stock quotes and portfolio summary
- Interactive stock charts using Chart.js
- Admin panel for managing users and monitoring activity
- Responsive layout built with TypeScript and React

## 🛠️ Getting Started

### Prerequisites

- Node.js (>=16) and npm
- Git

### Installation

```bash
# clone the repo
git clone https://github.com/mrshivamgiri/shopez-stock-trader.git
cd shopez-stock-trader

# install dependencies
npm install
```

### Running Locally

```bash
# start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Building for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/        # reusable UI components
├── context/           # React context (AuthContext etc.)
├── lib/               # utility functions
├── pages/             # page-level components (Dashboard, Login, etc.)
└── App.tsx            # root component
```

## 🔧 Configuration

- `server.ts` contains the Express server for API endpoints
- `vite.config.ts` for Vite configuration
- `.env.example` includes environment variable templates

## ✅ Contributing

Pull requests are welcome! Please open an issue first to discuss your changes.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🏷️ Badges

![GitHub commit activity](https://img.shields.io/github/commit-activity/m/mrshivamgiri/shopez-stock-trader)
![License](https://img.shields.io/github/license/mrshivamgiri/shopez-stock-trader)

## ⚙️ NPM Scripts

```bash
npm run dev       # start vite development server
npm run build     # compile for production
npm run preview   # serve built output locally
npm run lint      # run linter (if configured)
```

## 🔐 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```
PORT=3000
API_URL=http://localhost:3000/api
JWT_SECRET=your_secret_key
```

## 💡 Acknowledgments

- Built with [Vite](https://vitejs.dev/) and [React](https://reactjs.org/)
- Charting powered by [Chart.js](https://www.chartjs.org/)
- Inspired by stock tracking apps and online trading platforms

Feel free to file issues or suggest improvements on GitHub!
