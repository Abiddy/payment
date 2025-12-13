'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/lib/db';
import Navbar from '@/components/Navbar';

interface DashboardStats {
  totalTransactions: number;
  totalAmount: number;
  totalPlatformFee: number;
  totalStreamerAmount: number;
}

interface DashboardData {
  transactions: Transaction[];
  stats: DashboardStats;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Refresh every 5 seconds to show new transactions
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-500/20 text-green-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'canceled':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-[#efeff1]">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0e0e10] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-red-500">Failed to load dashboard data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] flex flex-col">
      <Navbar />
      <div className="flex-1 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-medium text-white">Transaction Dashboard</h1>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#18181b] border border-[#3a3a3d] rounded-lg p-6">
              <p className="text-sm text-[#adadb8] mb-2 font-light">Total Transactions</p>
              <p className="text-3xl font-medium text-white">{data.stats.totalTransactions}</p>
            </div>
            <div className="bg-[#18181b] border border-[#3a3a3d] rounded-lg p-6">
              <p className="text-sm text-[#adadb8] mb-2 font-light">Total Amount</p>
              <p className="text-3xl font-medium text-green-500">{formatCurrency(data.stats.totalAmount)}</p>
            </div>
            <div className="bg-[#18181b] border border-[#3a3a3d] rounded-lg p-6">
              <p className="text-sm text-[#adadb8] mb-2 font-light">Platform Fee (20%)</p>
              <p className="text-3xl font-medium text-green-500">{formatCurrency(data.stats.totalPlatformFee)}</p>
            </div>
            <div className="bg-[#18181b] border border-[#3a3a3d] rounded-lg p-6">
              <p className="text-sm text-[#adadb8] mb-2 font-light">Streamer Amount (80%)</p>
              <p className="text-3xl font-medium text-green-500">{formatCurrency(data.stats.totalStreamerAmount)}</p>
            </div>
          </div>

          {/* Breakdown Visualization */}
          <div className="bg-[#18181b] border border-[#3a3a3d] rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-medium text-white mb-4">Revenue Breakdown</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-green-500">Platform (20%)</span>
                  <span className="text-sm text-[#adadb8] font-light">{formatCurrency(data.stats.totalPlatformFee)}</span>
                </div>
                <div className="w-full bg-[#3a3a3d] rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full"
                    style={{ width: '20%' }}
                  ></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-green-500">Streamers (80%)</span>
                  <span className="text-sm text-[#adadb8] font-light">{formatCurrency(data.stats.totalStreamerAmount)}</span>
                </div>
                <div className="w-full bg-[#3a3a3d] rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full"
                    style={{ width: '80%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-[#18181b] border border-[#3a3a3d] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#3a3a3d]">
            <h2 className="text-2xl font-medium text-white">All Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0e0e10]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#adadb8] uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#adadb8] uppercase tracking-wider">
                    Streamer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#adadb8] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#adadb8] uppercase tracking-wider">
                    Stripe Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#adadb8] uppercase tracking-wider">
                    Platform Fee (20%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#adadb8] uppercase tracking-wider">
                    Streamer Amount (80%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#adadb8] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#adadb8] uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#adadb8] uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#18181b] divide-y divide-[#3a3a3d]">
                {data.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-[#adadb8]">
                      No transactions yet. Start tipping streamers!
                    </td>
                  </tr>
                ) : (
                  data.transactions.map((transaction) => {
                    // Get Stripe fee (actual if available, otherwise estimated, otherwise calculate)
                    const stripeFee = transaction.stripe_fee_actual ?? 
                                     transaction.stripe_fee_estimated ?? 
                                     null;
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-[#26262c]">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">
                          {transaction.id.substring(0, 20)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {transaction.streamer_name}
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-400 font-light">
                        {stripeFee !== null ? formatCurrency(stripeFee) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-medium">
                        {formatCurrency(transaction.platform_fee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-medium">
                        {formatCurrency(transaction.streamer_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-light rounded-full ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#adadb8]">
                        {transaction.payment_id.substring(0, 20)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#adadb8]">
                        {formatDate(transaction.timestamp)}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}




