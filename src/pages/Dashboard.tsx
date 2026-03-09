import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, Search, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

import StockChart from '../components/StockChart';

interface Stock {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
}

// Mock historical data for charts
const generateMockHistory = (basePrice: number) => {
  return Array.from({ length: 10 }, (_, i) => ({
    time: `${i}:00`,
    price: basePrice * (1 + (Math.random() - 0.5) * 0.05)
  }));
};

const Dashboard: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { token, refreshUser } = useAuth();

  const fetchStocks = async () => {
    try {
      const res = await fetch('/api/stocks');
      const data = await res.json();
      setStocks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(search.toLowerCase()) || 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleTrade = async (symbol: string, type: 'BUY' | 'SELL', quantity: number) => {
    if (!token) return alert('Please login to trade');
    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ symbol, type, quantity })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        refreshUser();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Market Overview</h1>
          <p className="text-zinc-500 mt-1">Real-time stock prices and market trends.</p>
        </div>
        
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search stocks by symbol or name..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStocks.map((stock) => (
            <div key={stock.id} className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-lg transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">{stock.symbol}</h3>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stock.name}</p>
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
                  stock.change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(stock.change).toFixed(2)}%
                </div>
              </div>

              <div className="mb-6">
                <span className="text-2xl font-bold text-zinc-900">${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="mb-6">
                <StockChart 
                  data={generateMockHistory(stock.price)} 
                  color={stock.change >= 0 ? "#10b981" : "#ef4444"} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleTrade(stock.symbol, 'BUY', 1)}
                  className="bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  Buy
                </button>
                <button
                  onClick={() => handleTrade(stock.symbol, 'SELL', 1)}
                  className="bg-zinc-100 text-zinc-900 py-2 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors"
                >
                  Sell
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
