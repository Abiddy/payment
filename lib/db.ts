import fs from 'fs';
import path from 'path';

// Database Schema Interface
export interface Transaction {
  id: string;
  streamer_id: string;
  streamer_name: string;
  amount: number; // Total amount in cents (gross amount customer paid)
  
  // Stripe fee fields
  stripe_fee_estimated?: number; // Estimated Stripe fee in cents (calculated at payment intent creation)
  stripe_fee_actual?: number; // Actual Stripe fee in cents (from Stripe API after payment)
  
  // Net amount fields (amount - Stripe fee)
  // 
  //  IMPORTANT: The estimations are one approach. We can implement a different apporach based on the business needs.
  net_amount_estimated?: number; // Estimated net amount after Stripe fees
  net_amount_actual?: number; // Actual net amount after Stripe fees
  
  // Split fields - based on NET amount, not gross
  platform_fee_estimated?: number; // 20% of estimated net amount
  platform_fee_actual?: number; // 20% of actual net amount
  streamer_amount_estimated?: number; // 80% of estimated net amount
  streamer_amount_actual?: number; // 80% of actual net amount (use for payouts)
  
  // Legacy fields (for backward compatibility) - will be calculated from estimated if not set
  platform_fee: number; // 20% in cents (backward compatibility - uses estimated or calculated)
  streamer_amount: number; // 80% in cents (backward compatibility - uses estimated or calculated)
  
  payment_id: string; // Stripe payment intent ID
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  currency: string;
  customer_email?: string;
  timestamp: string; // ISO 8601 format
  created_at: string;
  updated_at: string;
}

export interface Streamer {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
}

// Mock Database Class
class Database {
  private dbPath: string;
  private transactions: Transaction[] = [];
  private streamers: Streamer[] = [
    {
      id: 'streamer_1',
      name: 'GamingPro',
      description: 'Professional gamer streaming FPS games',
    },
    {
      id: 'streamer_2',
      name: 'MusicMaster',
      description: 'Live music performances and covers',
    },
    {
      id: 'streamer_3',
      name: 'TechTalk',
      description: 'Tech reviews and coding tutorials',
    },
  ];

  constructor() {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.dbPath = path.join(dataDir, 'transactions.json');
    this.loadTransactions();
  }

  // Load transactions from file
  private loadTransactions(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        this.transactions = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      this.transactions = [];
    }
  }

  // Save transactions to file
  private saveTransactions(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.transactions, null, 2));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }

  // Create a new transaction
  createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.transactions.push(newTransaction);
    this.saveTransactions();
    return newTransaction;
  }

  // Update transaction status
  updateTransaction(paymentId: string, status: Transaction['status']): Transaction | null {
    const transaction = this.transactions.find(t => t.payment_id === paymentId);
    if (!transaction) {
      return null;
    }

    transaction.status = status;
    transaction.updated_at = new Date().toISOString();
    this.saveTransactions();
    return transaction;
  }

  // Update transaction with actual Stripe fee and recalculate splits
  updateTransactionWithActualFees(
    paymentId: string,
    stripeFeeActual: number
  ): Transaction | null {
    const transaction = this.transactions.find(t => t.payment_id === paymentId);
    if (!transaction) {
      return null;
    }

    // Calculate actual net amount
    const netAmountActual = transaction.amount - stripeFeeActual;
    
    // Calculate actual splits (20% platform, 80% streamer)
    const platformFeeActual = Math.round(netAmountActual * 0.20);
    const streamerAmountActual = netAmountActual - platformFeeActual;

    // Update with actual values
    transaction.stripe_fee_actual = stripeFeeActual;
    transaction.net_amount_actual = netAmountActual;
    transaction.platform_fee_actual = platformFeeActual;
    transaction.streamer_amount_actual = streamerAmountActual;
    
    // Update legacy fields with actual values for backward compatibility
    transaction.platform_fee = platformFeeActual;
    transaction.streamer_amount = streamerAmountActual;
    
    transaction.status = 'succeeded';
    transaction.updated_at = new Date().toISOString();
    this.saveTransactions();
    return transaction;
  }

  // Get all transactions
  getAllTransactions(): Transaction[] {
    return [...this.transactions].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Get transactions by streamer
  getTransactionsByStreamer(streamerId: string): Transaction[] {
    return this.transactions
      .filter(t => t.streamer_id === streamerId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Get transaction by payment ID
  getTransactionByPaymentId(paymentId: string): Transaction | null {
    return this.transactions.find(t => t.payment_id === paymentId) || null;
  }

  // Get all streamers
  getStreamers(): Streamer[] {
    return this.streamers;
  }

  // Get streamer by ID
  getStreamerById(id: string): Streamer | null {
    return this.streamers.find(s => s.id === id) || null;
  }

  // Calculate platform statistics
  getPlatformStats() {
    const succeeded = this.transactions.filter(t => t.status === 'succeeded');
    const totalAmount = succeeded.reduce((sum, t) => sum + t.amount, 0);
    
    // Use actual values if available, otherwise use estimated, otherwise use legacy fields
    const totalPlatformFee = succeeded.reduce((sum, t) => {
      return sum + (t.platform_fee_actual ?? t.platform_fee_estimated ?? t.platform_fee);
    }, 0);
    
    const totalStreamerAmount = succeeded.reduce((sum, t) => {
      return sum + (t.streamer_amount_actual ?? t.streamer_amount_estimated ?? t.streamer_amount);
    }, 0);
    
    const totalStripeFees = succeeded.reduce((sum, t) => {
      return sum + (t.stripe_fee_actual ?? t.stripe_fee_estimated ?? 0);
    }, 0);

    return {
      totalTransactions: succeeded.length,
      totalAmount,
      totalPlatformFee,
      totalStreamerAmount,
      totalStripeFees,
    };
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}




