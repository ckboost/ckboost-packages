import { ckTestBTCBooster, ckTESTBTC_CANISTER_IDS, type ckTESTBTCBoostRequest } from '@ckboost/booster';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import process from 'process';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: `${__dirname}/.env` });

const MEMPOOL_API_URL = "https://mempool.space/testnet4/api";

// Track processed transactions to avoid duplicates
const processedTransactions = new Set<string>();

// Types for mempool API responses
interface MempoolTransaction {
  txid: string;
  status: {
    confirmed: boolean;
    block_height?: number;
  };
  vout: Array<{
    scriptpubkey_address: string;
    value: number;
  }>;
  vin: Array<{
    sequence: number;
  }>;
}

class BoostRequestMonitor {
  protected booster: ckTestBTCBooster;
  private isRunning = false;
  private config = {
    checkIntervalMs: 10000, // 10 seconds
    minDepositAmount: 10,   // 10 ckTESTBTC
  };

  constructor(mnemonics: string) {
    this.booster = new ckTestBTCBooster(mnemonics);
  }

  async initialize() {
    console.log('Initializing booster...');
    await this.booster.initialize();
    
    const principal = await this.booster.getPrincipal();
    console.log('Booster Principal:', principal.toString());
    console.log('Backend Canister:', ckTESTBTC_CANISTER_IDS.CKBOOST_BACKEND);
    
    await this.ensureBoosterSetup();
  }

  private async ensureBoosterSetup() {
    // Check if already registered
    let accountResult = await this.booster.getBoosterAccount();
    
    if (!accountResult || accountResult.length === 0) {
      console.log('Registering as booster...');
      await this.booster.registerBoosterAccount();
      accountResult = await this.booster.getBoosterAccount();
      console.log('Registration successful!');
    }
    
    const account = accountResult[0];
    console.log('Booster account:', account);
    
    // Check current balance
    const principal = await this.booster.getPrincipal();
    const balance = await this.booster.getCKTESTBTCBalance({
      owner: principal,
      subaccount: []
    });
    console.log('Current ckTESTBTC balance:', this.formatBTC(balance), 'ckTESTBTC');
    
    // Check if we need to deposit more funds
    const minDepositSatoshis = this.booster.btcToSatoshis(this.config.minDepositAmount);
    if (account && account.availableBalance < minDepositSatoshis) {
      console.log(`Depositing ${this.config.minDepositAmount} ckTESTBTC for boosting...`);
      
      try {
        // Transfer ckTESTBTC to booster account
        const transferArgs = {
          to: {
            owner: this.booster.getBackendCanisterPrincipal(),
            subaccount: [account.subaccount],
          },
          fee: [BigInt(10)], // 10 satoshis fee
          memo: [],
          from_subaccount: [],
          created_at_time: [],
          amount: minDepositSatoshis,
        };
        
        console.log("Transferring ckTESTBTC to booster account...");
        const transferResponse = await this.booster.transferCKTESTBTC(transferArgs);
        
        if ('Ok' in transferResponse) {
          console.log("Transfer successful, transaction ID:", transferResponse.Ok.toString());
          
          // Update the booster deposit on the backend
          const result = await this.booster.updateBoosterDeposit(principal, minDepositSatoshis);
          if ('err' in result) {
            throw new Error(`Failed to update deposit: ${result.err}`);
          }
          console.log('Deposit update successful');
          
          // Verify new balance
          const updatedAccountResult = await this.booster.getBoosterAccount();
          if (updatedAccountResult && updatedAccountResult.length > 0) {
            const updatedAccount = updatedAccountResult[0];
            console.log('Updated available balance:', this.formatBTC(updatedAccount.availableBalance), 'ckTESTBTC');
          }
          
        } else if ('Err' in transferResponse) {
          const errorType = Object.keys(transferResponse.Err)[0];
          throw new Error(`Transfer failed: ${errorType}`);
        }
        
      } catch (error) {
        console.error('Failed to deposit funds:', error);
        throw error;
      }
    }
  }

  async start() {
    await this.initialize();
    
    this.isRunning = true;
    console.log('Starting boost request monitoring...');
    
    // Start monitoring loop
    this.monitoringLoop();
    
    // Initial check
    await this.checkBoostRequests();
  }

  stop() {
    this.isRunning = false;
    console.log('Stopping boost request monitoring...');
  }

  private async monitoringLoop() {
    while (this.isRunning) {
      try {
        await this.checkBoostRequests();
      } catch (error) {
        console.error('Error in monitoring loop:', error);
      }
      
      // Wait before next check
      await new Promise(resolve => 
        setTimeout(resolve, this.config.checkIntervalMs)
      );
    }
  }

  private async checkBoostRequests() {
    try {
      const requests = await this.booster.getPendingBoostRequests();
      console.log(`Found ${requests.length} pending boost requests`);
      
      if (requests.length === 0) {
        return;
      }
      
      // Get our current available balance
      const accountResult = await this.booster.getBoosterAccount();
      if (!accountResult || accountResult.length === 0) {
        console.log('No booster account found');
        return;
      }
      
      const account = accountResult[0];
      const ourAvailableBalance = account.availableBalance;
      console.log('Our available balance:', this.formatBTC(ourAvailableBalance), 'ckTESTBTC');
      
      for (const request of requests) {
        await this.processBoostRequest(request, ourAvailableBalance);
      }
      
    } catch (error) {
      console.error('Error checking boost requests:', error);
    }
  }

  protected async processBoostRequest(request: ckTESTBTCBoostRequest, ourBalance: bigint) {
    console.log(`Processing boost request ${request.id}:`, {
      amount: this.formatBTC(request.amount),
      maxFee: request.maxFeePercentage,
      confirmationsRequired: request.confirmationsRequired
    });
    
    // Check if we have enough balance
    if (ourBalance < request.amount) {
      console.log(`Insufficient balance for request ${request.id}. Required: ${this.formatBTC(request.amount)}, Available: ${this.formatBTC(ourBalance)}`);
      return;
    }
    
    // Check if request has a BTC address
    if (!request.btcAddress || request.btcAddress.length === 0) {
      console.log(`Request ${request.id} has no BTC address, skipping`);
      return;
    }
    
    const btcAddress = request.btcAddress[0];
    
    try {
      // Check Bitcoin transactions for this address
      const hasValidTransaction = await this.checkBitcoinTransaction(request, btcAddress);
      
      if (hasValidTransaction) {
        await this.acceptBoostRequest(request);
      }
      
    } catch (error) {
      console.error(`Error processing request ${request.id}:`, error);
    }
  }

  private async checkBitcoinTransaction(request: ckTESTBTCBoostRequest, btcAddress: string): Promise<boolean> {
    try {
      console.log(`Checking Bitcoin transactions for address: ${btcAddress}`);
      
      const response = await axios.get<MempoolTransaction[]>(
        `${MEMPOOL_API_URL}/address/${btcAddress}/txs/mempool`
      );
      
      const transactions = response.data;
      
      // Find unprocessed transaction to this address
      const tx = transactions.find(tx => 
        !processedTransactions.has(tx.txid) &&
        tx.vout.some(output => output.scriptpubkey_address === btcAddress)
      );
      
      if (!tx) {
        console.log(`No new transactions found for address ${btcAddress}`);
        return false;
      }
      
      console.log(`Found transaction ${tx.txid} for request ${request.id}`);
      
      // Check if transaction has RBF (Replace-By-Fee) flag
      const hasRBF = tx.vin.some(input => input.sequence < 0xffffffff - 1);
      if (hasRBF) {
        console.log(`Transaction ${tx.txid} has RBF flag set, waiting for confirmation`);
        return false;
      }
      
      // Calculate total received amount
      const totalReceived = tx.vout.reduce((sum: number, output) => {
        if (output.scriptpubkey_address === btcAddress) {
          return sum + output.value;
        }
        return sum;
      }, 0);
      
      const receivedSatoshis = BigInt(totalReceived);
      
      // Verify amount matches request
      if (receivedSatoshis !== request.amount) {
        console.log(`Amount mismatch for request ${request.id}. Expected: ${this.formatBTC(request.amount)}, Received: ${this.formatBTC(receivedSatoshis)}`);
        return false;
      }
      
      console.log(`✅ Valid transaction found for request ${request.id}:`, {
        txid: tx.txid,
        amount: this.formatBTC(receivedSatoshis),
        address: btcAddress
      });
      
      // Mark transaction as processed
      processedTransactions.add(tx.txid);
      
      return true;
      
    } catch (error) {
      console.error(`Error checking Bitcoin transaction for ${btcAddress}:`, error);
      return false;
    }
  }

  private async acceptBoostRequest(request: ckTESTBTCBoostRequest) {
    try {
      console.log(`🚀 Accepting boost request ${request.id}...`);
      
      const result = await this.booster.acceptBoostRequest(request.id);
      
      console.log(`✅ Successfully accepted boost request ${request.id}`);
      console.log('Accept result:', result);
      
      // Calculate expected fee earnings
      const feeAmount = request.amount * BigInt(Math.floor(request.maxFeePercentage * 100)) / BigInt(10000);
      console.log(`💰 Expected fee earnings: ${this.formatBTC(feeAmount)} ckTESTBTC (${request.maxFeePercentage.toFixed(2)}%)`);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('already accepted')) {
        console.log(`⚡ Request ${request.id} was already accepted by another booster`);
      } else {
        console.error(`❌ Failed to accept boost request ${request.id}:`, error);
      }
    }
  }

  // Utility method to format BTC
  protected formatBTC(satoshis: bigint): string {
    return this.booster.satoshisToBTC(satoshis).toFixed(8);
  }
}

// Configuration class for easy customization
class MonitorConfig {
  static readonly RISK_PARAMETERS = {
    maxAmountBTC: 1.0,           // Maximum 1 ckTESTBTC per request
    minFeePercentage: 0.1,       // Minimum 0.1% fee
    maxRequestAge: 3600000,      // 1 hour in milliseconds
  };
  
  static readonly MONITORING = {
    checkInterval: 10000,        // 10 seconds
    retryDelay: 5000,           // 5 seconds
    maxRetries: 3,
  };
}

// Enhanced version with risk assessment
class EnhancedBoostMonitor extends BoostRequestMonitor {
  private shouldAcceptRequest(request: ckTESTBTCBoostRequest): boolean {
    const amountBTC = this.booster.satoshisToBTC(request.amount);
    const feePercentage = request.maxFeePercentage;
    
    // Apply risk parameters
    if (amountBTC > MonitorConfig.RISK_PARAMETERS.maxAmountBTC) {
      console.log(`Request ${request.id}: Amount too large (${amountBTC} BTC > ${MonitorConfig.RISK_PARAMETERS.maxAmountBTC} BTC)`);
      return false;
    }
    
    if (feePercentage < MonitorConfig.RISK_PARAMETERS.minFeePercentage) {
      console.log(`Request ${request.id}: Fee too low (${feePercentage}% < ${MonitorConfig.RISK_PARAMETERS.minFeePercentage}%)`);
      return false;
    }
    
    console.log(`Request ${request.id}: Passes risk assessment`);
    return true;
  }
  
  protected async processBoostRequest(request: ckTESTBTCBoostRequest, ourBalance: bigint) {
    // Add risk assessment before processing
    if (!this.shouldAcceptRequest(request)) {
      return;
    }
    
    // Continue with parent processing
    return super.processBoostRequest(request, ourBalance);
  }
}

// Main execution function
async function main() {
  const mnemonics = process.env.MNEMONICS;
  if (!mnemonics) {
    throw new Error("MNEMONICS environment variable is not set");
  }
  
  console.log('🚀 Starting CKBoost Liquidity Provider Bot...');
  console.log('Configuration:', {
    checkInterval: `${MonitorConfig.MONITORING.checkInterval / 1000}s`,
    maxAmountBTC: MonitorConfig.RISK_PARAMETERS.maxAmountBTC,
    minFeePercentage: `${MonitorConfig.RISK_PARAMETERS.minFeePercentage}%`,
  });
  
  // Create and start the enhanced monitor
  const monitor = new EnhancedBoostMonitor(mnemonics);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n⏹️  Received SIGINT, shutting down gracefully...');
    monitor.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n⏹️  Received SIGTERM, shutting down gracefully...');
    monitor.stop();
    process.exit(0);
  });
  
  try {
    await monitor.start();
    console.log('✅ Monitor started successfully');
    
    // Keep the process running
    console.log('🔄 Monitoring boost requests... Press Ctrl+C to stop');
    
  } catch (error) {
    console.error('❌ Failed to start monitor:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

export { BoostRequestMonitor, EnhancedBoostMonitor, MonitorConfig }; 