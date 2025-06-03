# @ckboost/client

Client library for integrating CKBoost acceleration into your dApps. CKBoost reduces ck-token conversion times from hours to minutes by providing instant liquidity.

## Installation

```bash
npm install @ckboost/client
```

## Quick Start

```typescript
import { ckTESTBTCClient } from '@ckboost/client';

// Initialize client (ckTESTBTC is always testnet)
const client = new ckTESTBTCClient({
  host: 'https://icp-api.io'  // Optional: defaults to this
});

// Generate a deposit address for boost request
const result = await client.generateDepositAddress({
  amount: '0.01',           // 0.01 ckTESTBTC
  maxFeePercentage: 1.5,    // 1.5% maximum fee
  confirmationsRequired: 2   // Optional: override default confirmations
});

if (result.success) {
  const { requestId, address, amountRaw } = result.data;
  console.log(`Send ${amountRaw} satoshis to ${address}`);
  console.log(`Request ID: ${requestId}`);
} else {
  console.error('Error:', result.error.message);
}

// Check boost request status
const statusResult = await client.getBoostRequest('123');
if (statusResult.success) {
  const request = statusResult.data;
  console.log(`Status: ${request.status}`);
  console.log(`Received: ${request.receivedAmount} ckTESTBTC`);
}
```

## API Reference

### `ckTESTBTCClient`

#### Constructor

```typescript
new ckTESTBTCClient(config?: ClientConfig)
```

**ClientConfig:**
- `host?: string` - ICP host URL (default: 'https://icp-api.io')
- `timeout?: number` - Request timeout in ms (default: 30000)

**Note:** ckTESTBTC is always on testnet. Future tokens like ckBTC, ckETH, ckUSDC will be on mainnet.

#### Methods

##### `generateDepositAddress(params)`

Creates a boost request and returns deposit information.

**Parameters:**
```typescript
{
  amount: string;              // Amount in ckTESTBTC (e.g., "0.01")
  maxFeePercentage: number;    // Maximum fee percentage (0.1-2.0)
  confirmationsRequired?: number; // Optional confirmations override
  preferredBooster?: string;   // Optional preferred booster principal
}
```

**Returns:**
```typescript
ApiResponse<DepositAddress>

interface DepositAddress {
  requestId: string;           // Unique boost request ID
  address: string;             // Bitcoin deposit address
  amount: string;              // Amount in ckTESTBTC
  amountRaw: string;           // Amount in satoshis
  maxFeePercentage: number;    // Fee percentage
  confirmationsRequired: number;
  explorerUrl: string;         // Block explorer URL
}
```

##### `getBoostRequest(requestId: string)`

Gets detailed information about a boost request.

**Returns:**
```typescript
ApiResponse<BoostRequest>

interface BoostRequest {
  id: string;                  // Request ID
  status: BoostStatus;         // 'pending' | 'active' | 'completed' | 'cancelled'
  amount: string;              // Amount in ckTESTBTC
  amountRaw: string;           // Amount in satoshis
  maxFeePercentage: number;    // Maximum fee percentage
  owner: string;               // Owner principal
  booster?: string;            // Assigned booster (if any)
  preferredBooster?: string;   // Preferred booster (if any)
  depositAddress?: string;     // Bitcoin deposit address (if generated)
  receivedAmount: string;      // Amount received so far
  confirmationsRequired: number;
  createdAt: number;           // Creation timestamp
  updatedAt: number;           // Last update timestamp
  explorerUrl: string;         // Block explorer URL
}
```

##### `getPendingBoostRequests()`

Gets all pending boost requests (utility method for monitoring).

**Returns:**
```typescript
ApiResponse<BoostRequest[]>
```

##### `getTokenConfig()`

Gets the ckTESTBTC token configuration.

**Returns:**
```typescript
TokenConfig
```

## Error Handling

All methods return an `ApiResponse<T>` wrapper:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    type: CKBoostErrorType;
    message: string;
    details?: any;
  };
}
```

**Error Types:**
- `NETWORK_ERROR` - Network or connectivity issues
- `INVALID_AMOUNT` - Amount validation failed
- `INVALID_TOKEN` - Unsupported token
- `REQUEST_NOT_FOUND` - Boost request not found
- `CANISTER_ERROR` - Backend canister error
- `VALIDATION_ERROR` - Input validation error

## Advanced Usage

### Type Safety

Import specific types for better type safety:

```typescript
import { 
  ckTESTBTCClient,
  BoostRequest,
  DepositAddress,
  BoostStatus,
  CKBoostError,
  ckTESTBTC_CANISTER_IDS
} from '@ckboost/client';

// Use canister IDs
console.log(ckTESTBTC_CANISTER_IDS.CKBOOST_BACKEND);
console.log(ckTESTBTC_CANISTER_IDS.CKTESTBTC_LEDGER);
```

### Error Handling

```typescript
import { CKBoostError, CKBoostErrorType } from '@ckboost/client';

try {
  const result = await client.generateDepositAddress({
    amount: '0.001',  // Below minimum
    maxFeePercentage: 1.0
  });
  
  if (!result.success) {
    switch (result.error.type) {
      case CKBoostErrorType.INVALID_AMOUNT:
        console.log('Amount is invalid:', result.error.message);
        break;
      case CKBoostErrorType.NETWORK_ERROR:
        console.log('Network issue:', result.error.message);
        break;
      default:
        console.log('Unknown error:', result.error.message);
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### Configuration

```typescript
// Default configuration (ckTESTBTC on testnet)
const client = new ckTESTBTCClient();

// Custom ICP host
const customClient = new ckTESTBTCClient({
  host: 'https://icp-api.io',
  timeout: 30000
});

// Local development
const localClient = new ckTESTBTCClient({
  host: 'http://localhost:4943',
  timeout: 60000
});
```

## Integration Examples

### React Integration

```typescript
import { useEffect, useState } from 'react';
import { ckTESTBTCClient, BoostRequest } from '@ckboost/client';

function BoostRequestTracker({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<BoostRequest | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const client = new ckTESTBTCClient();
    
    const checkStatus = async () => {
      const result = await client.getBoostRequest(requestId);
      if (result.success) {
        setRequest(result.data);
      }
      setLoading(false);
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10s
    
    return () => clearInterval(interval);
  }, [requestId]);
  
  if (loading) return <div>Loading...</div>;
  if (!request) return <div>Request not found</div>;
  
  return (
    <div>
      <h3>Boost Request {request.id}</h3>
      <p>Status: {request.status}</p>
      <p>Amount: {request.amount} ckTESTBTC</p>
      <p>Received: {request.receivedAmount} ckTESTBTC</p>
      {request.depositAddress && (
        <p>Deposit to: {request.depositAddress}</p>
      )}
    </div>
  );
}
```

### Node.js Integration

```typescript
import { ckTESTBTCClient } from '@ckboost/client';

async function processBoostRequest() {
  const client = new ckTESTBTCClient();
  
  // Create boost request
  const depositResult = await client.generateDepositAddress({
    amount: '0.01',
    maxFeePercentage: 1.5
  });
  
  if (!depositResult.success) {
    throw new Error(`Failed to create boost request: ${depositResult.error.message}`);
  }
  
  const { requestId, address } = depositResult.data;
  console.log(`Created boost request ${requestId}`);
  console.log(`Send Bitcoin to: ${address}`);
  
  // Monitor status
  while (true) {
    const statusResult = await client.getBoostRequest(requestId);
    if (statusResult.success) {
      const status = statusResult.data.status;
      console.log(`Current status: ${status}`);
      
      if (status === 'completed') {
        console.log('Boost completed!');
        break;
      } else if (status === 'cancelled') {
        console.log('Boost cancelled');
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
  }
}
```

## Future Token Support

The architecture is designed to support future ck-tokens. When ckBTC, ckETH, and ckUSDC are supported, you'll be able to use:

```typescript
// Future API (not yet available)
import { ckBTCClient, ckETHClient, ckUSDCClient } from '@ckboost/client';
```

## Support

- **Documentation**: [GitBook Documentation](https://ckboost.gitbook.io)
- **Issues**: [GitHub Issues](https://github.com/your-org/ckboost)
- **Discord**: [CKBoost Community](https://discord.gg/ckboost)

## License

MIT License 