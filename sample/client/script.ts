/**
 * CKBoost Client Sample Script
 * 
 * This script demonstrates how to integrate @ckboost/client into your dApp
 * to provide Bitcoin acceleration for users.
 * 
 * Features demonstrated:
 * 1. Generate deposit addresses for boost requests
 * 2. Monitor boost request status
 * 3. Handle errors gracefully
 * 4. Real-time status updates
 */

import { 
  ckTESTBTCClient, 
  BoostRequest, 
  BoostStatus, 
  CKBoostErrorType,
  ckTESTBTC_CANISTER_IDS 
} from '@ckboost/client';

class CKBoostIntegrationDemo {
  private client: ckTESTBTCClient;

  constructor() {
    // Initialize client (ckTESTBTC is always testnet)
    this.client = new ckTESTBTCClient({
      host: 'https://icp-api.io',  // Use production ICP host
      timeout: 30000
    });

    console.log('🚀 CKBoost Client Demo Initialized');
    console.log('📋 Canister IDs:');
    console.log(`   Backend: ${ckTESTBTC_CANISTER_IDS.CKBOOST_BACKEND}`);
    console.log(`   Ledger:  ${ckTESTBTC_CANISTER_IDS.CKTESTBTC_LEDGER}`);
    console.log('');
  }

  /**
   * Demo: Create a boost request and get deposit address
   */
  async createBoostRequest(): Promise<string | null> {
    console.log('💰 Creating boost request...');
    
    try {
      const result = await this.client.generateDepositAddress({
        amount: '0.01',              // 0.01 ckTESTBTC
        maxFeePercentage: 1.5,       // 1.5% maximum fee
        confirmationsRequired: 2,    // Override default confirmations
        // preferredBooster: 'some-principal-id'  // Optional
      });

      if (result.success) {
        const depositInfo = result.data;
        
        console.log('✅ Boost request created successfully!');
        console.log(`📋 Request ID: ${depositInfo.requestId}`);
        console.log(`🏦 Deposit Address: ${depositInfo.address}`);
        console.log(`💵 Amount: ${depositInfo.amount} ckTESTBTC`);
        console.log(`⚡ Raw Amount: ${depositInfo.amountRaw} satoshis`);
        console.log(`💸 Max Fee: ${depositInfo.maxFeePercentage}%`);
        console.log(`🔗 Explorer: ${depositInfo.explorerUrl}`);
        console.log('');
        
        // In a real dApp, you would:
        // 1. Display this address to the user
        // 2. Show a QR code for easy scanning
        // 3. Set up monitoring for the request
        
        return depositInfo.requestId;
      } else {
        this.handleError(result.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Unexpected error creating boost request:', error);
      return null;
    }
  }

  /**
   * Demo: Monitor a boost request status
   */
  async monitorBoostRequest(requestId: string): Promise<void> {
    console.log(`👀 Monitoring boost request ${requestId}...`);
    
    let attempts = 0;
    const maxAttempts = 20; // Monitor for ~3 minutes
    
    while (attempts < maxAttempts) {
      try {
        const result = await this.client.getBoostRequest(requestId);
        
        if (result.success) {
          const request = result.data;
          this.displayRequestStatus(request);
          
          // Check if request is in a final state
          if (request.status === BoostStatus.COMPLETED || 
              request.status === BoostStatus.CANCELLED) {
            console.log('🏁 Request reached final state. Monitoring complete.');
            break;
          }
        } else {
          this.handleError(result.error);
          break;
        }
      } catch (error) {
        console.error('❌ Error monitoring request:', error);
        break;
      }
      
      attempts++;
      
      if (attempts < maxAttempts) {
        console.log(`⏰ Waiting 10 seconds before next check... (${attempts}/${maxAttempts})`);
        await this.sleep(10000); // Wait 10 seconds
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('⏰ Monitoring timeout reached. Request may still be processing.');
    }
  }

  /**
   * Display detailed request status
   */
  private displayRequestStatus(request: BoostRequest): void {
    const statusEmoji = this.getStatusEmoji(request.status);
    
    console.log(`${statusEmoji} Status Update:`);
    console.log(`   ID: ${request.id}`);
    console.log(`   Status: ${request.status}`);
    console.log(`   Amount: ${request.amount} ckTESTBTC`);
    console.log(`   Received: ${request.receivedAmount} ckTESTBTC`);
    
    if (request.depositAddress) {
      console.log(`   Deposit Address: ${request.depositAddress}`);
    }
    
    if (request.booster) {
      console.log(`   Assigned Booster: ${request.booster}`);
    }
    
    const createdDate = new Date(Number(request.createdAt));
    const updatedDate = new Date(Number(request.updatedAt));
    
    console.log(`   Created: ${createdDate.toLocaleString()}`);
    console.log(`   Updated: ${updatedDate.toLocaleString()}`);
    console.log('');
  }

  /**
   * Get emoji for status display
   */
  private getStatusEmoji(status: BoostStatus): string {
    switch (status) {
      case BoostStatus.PENDING: return '⏳';
      case BoostStatus.ACTIVE: return '🔄';
      case BoostStatus.COMPLETED: return '✅';
      case BoostStatus.CANCELLED: return '❌';
      default: return '❓';
    }
  }

  /**
   * Handle and display errors appropriately
   */
  private handleError(error: any): void {
    console.error('❌ Error occurred:');
    console.error(`   Type: ${error.type}`);
    console.error(`   Message: ${error.message}`);
    
    // Provide helpful guidance based on error type
    switch (error.type) {
      case CKBoostErrorType.INVALID_AMOUNT:
        console.log('💡 Tip: Check minimum/maximum amount limits for ckTESTBTC');
        break;
      case CKBoostErrorType.NETWORK_ERROR:
        console.log('💡 Tip: Check your internet connection and ICP host configuration');
        break;
      case CKBoostErrorType.REQUEST_NOT_FOUND:
        console.log('💡 Tip: Verify the request ID is correct');
        break;
      case CKBoostErrorType.CANISTER_ERROR:
        console.log('💡 Tip: The backend canister may be experiencing issues');
        break;
      default:
        console.log('💡 Tip: Check the error details for more information');
    }
    
    if (error.details) {
      console.error('   Details:', error.details);
    }
    console.log('');
  }

  /**
   * Demo: Get all pending boost requests (useful for monitoring)
   */
  async viewPendingRequests(): Promise<void> {
    console.log('📋 Fetching all pending boost requests...');
    
    try {
      const result = await this.client.getPendingBoostRequests();
      
      if (result.success) {
        const requests = result.data;
        
        if (requests.length === 0) {
          console.log('📭 No pending boost requests found.');
        } else {
          console.log(`📬 Found ${requests.length} pending request(s):`);
          requests.forEach((request, index) => {
            console.log(`   ${index + 1}. ID: ${request.id} | Amount: ${request.amount} ckTESTBTC | Status: ${request.status}`);
          });
        }
      } else {
        this.handleError(result.error);
      }
    } catch (error) {
      console.error('❌ Error fetching pending requests:', error);
    }
    console.log('');
  }

  /**
   * Demo: Display token configuration
   */
  displayTokenConfig(): void {
    const config = this.client.getTokenConfig();
    
    console.log('⚙️  Token Configuration:');
    console.log(`   Token: ${config.token}`);
    console.log(`   Minimum Amount: ${config.minimumAmount} ckTESTBTC`);
    console.log(`   Maximum Amount: ${config.maximumAmount} ckTESTBTC`);
    console.log(`   Standard Fee: ${config.standardFee} ckTESTBTC`);
    console.log(`   Confirmations Required: ${config.confirmationsRequired}`);
    console.log(`   Decimals: ${config.decimals}`);
    console.log(`   Is Testnet: ${config.isTestnet}`);
    console.log(`   Block Explorer: ${config.blockExplorerUrl}`);
    console.log('');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Main demo function
 */
async function runDemo(): Promise<void> {
  console.log('🎯 CKBoost Client Integration Demo');
  console.log('==================================');
  console.log('');

  const demo = new CKBoostIntegrationDemo();
  
  try {
    // 1. Display token configuration
    demo.displayTokenConfig();
    
    // 2. View current pending requests
    await demo.viewPendingRequests();
    
    // 3. Create a new boost request
    const requestId = await demo.createBoostRequest();
    
    if (requestId) {
      console.log('🎯 In a real dApp, you would now:');
      console.log('   1. Display the deposit address to your user');
      console.log('   2. Show a QR code for easy Bitcoin wallet scanning');
      console.log('   3. Set up real-time monitoring (WebSocket or polling)');
      console.log('   4. Notify the user when ckTESTBTC is received');
      console.log('');
      
      // 4. Start monitoring the request
      console.log('🔄 Starting monitoring demo...');
      console.log('   (In production, you would use WebSocket or more efficient polling)');
      console.log('');
      
      await demo.monitorBoostRequest(requestId);
    }
    
  } catch (error) {
    console.error('💥 Demo failed with unexpected error:', error);
  }
  
  console.log('');
  console.log('✨ Demo completed!');
  console.log('');
  console.log('📚 Next steps:');
  console.log('   1. Integrate @ckboost/client into your dApp');
  console.log('   2. Create a beautiful UI for deposit address display');
  console.log('   3. Implement real-time status monitoring');
  console.log('   4. Add proper error handling and user feedback');
  console.log('   5. Test with real Bitcoin testnet transactions');
}

/**
 * Example: Simple integration for a dApp
 */
export class SimpleBoostService {
  private client = new ckTESTBTCClient();

  /**
   * Create a boost for a user
   */
  async createBoost(amount: string, maxFeePercentage: number) {
    const result = await this.client.generateDepositAddress({
      amount,
      maxFeePercentage
    });

    if (result.success) {
      return {
        success: true,
        requestId: result.data.requestId,
        depositAddress: result.data.address,
        amountToPay: result.data.amountRaw + ' satoshis',
        explorerUrl: result.data.explorerUrl
      };
    } else {
      return {
        success: false,
        error: result.error.message
      };
    }
  }

  /**
   * Check boost status
   */
  async checkBoostStatus(requestId: string) {
    const result = await this.client.getBoostRequest(requestId);

    if (result.success) {
      const request = result.data;
      return {
        success: true,
        status: request.status,
        progress: {
          requested: request.amount,
          received: request.receivedAmount,
          percentage: (parseFloat(request.receivedAmount) / parseFloat(request.amount)) * 100
        },
        isComplete: request.status === BoostStatus.COMPLETED
      };
    } else {
      return {
        success: false,
        error: result.error.message
      };
    }
  }
}

runDemo().catch(console.error);
