import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PieChart, Wallet, ArrowUpRight, ArrowDownRight, History, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface PortfolioItem {
  symbol: string;
  name: string;
  quantity: number;
  current_price: number;
}

interface Transaction {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
}

const Portfolio: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  const fetchData = async () => {
    if (!token) return;
    try {
      const [pRes, tRes] = await Promise.all([
        fetch('/api/portfolio', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const pData = await pRes.json();
      const tData = await tRes.json();
      setPortfolio(pData);
      setTransactions(tData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const totalValue = portfolio.reduce((acc, item) => acc + (item.quantity * item.current_price), 0);
  const totalAssets = totalValue + (user?.balance || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total Assets</h3>
              </div>
              <p className="text-3xl font-bold text-zinc-900">${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <PieChart className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Portfolio Value</h3>
              </div>
              <p className="text-3xl font-bold text-zinc-900">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-900">Your Holdings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">Asset</th>
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {portfolio.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">No holdings yet. Start trading to build your portfolio!</td>
                    </tr>
                  ) : (
                    portfolio.map((item) => (
                      <tr key={item.symbol} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900">{item.symbol}</span>
                            <span className="text-xs text-zinc-500">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-700">{item.quantity}</td>
                        <td className="px-6 py-4 font-medium text-zinc-700">${item.current_price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-zinc-900">${(item.quantity * item.current_price).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-400" />
            <h3 className="text-lg font-bold text-zinc-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-500 text-sm">No transactions yet.</div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="px-6 py-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1 rounded-md",
                        tx.type === 'BUY' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                      )}>
                        {tx.type === 'BUY' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      </div>
                      <span className="font-bold text-zinc-900">{tx.symbol}</span>
                    </div>
                    <span className="text-sm font-bold text-zinc-900">${(tx.quantity * tx.price).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{tx.type} {tx.quantity} @ ${tx.price.toFixed(2)}</span>
                    <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
