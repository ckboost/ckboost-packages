# CKBoost Client Sample

This sample demonstrates how to integrate `@ckboost/client` into your dApp to provide Bitcoin acceleration for your users.

## Overview

The CKBoost client sample shows how to:
- Generate deposit addresses for boost requests
- Monitor boost request status in real-time
- Handle errors gracefully
- Provide a smooth user experience

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the demo**:
   ```bash
   npm start
   ```

## What the Demo Does

### 1. Token Configuration Display
Shows the current ckTESTBTC token configuration including:
- Minimum/maximum amounts
- Default confirmations required
- Fee structure
- Network information

### 2. Pending Requests Overview
Fetches and displays all currently pending boost requests to give you an overview of system activity.

### 3. Create Boost Request
Demonstrates how to create a new boost request:
- Validates input parameters
- Generates a Bitcoin deposit address
- Returns request ID for tracking

### 4. Real-time Monitoring
Shows how to monitor boost request status:
- Polls for status updates
- Displays progress information
- Handles final states (completed/cancelled)

## Key Classes

### `CKBoostIntegrationDemo`
Full-featured demo showing all client capabilities with detailed logging and error handling.

### `SimpleBoostService`
Simplified service class showing how you might integrate CKBoost into your dApp:

```typescript
const service = new SimpleBoostService();

// Create a boost
const result = await service.createBoost('0.01', 1.5);
if (result.success) {
  console.log('Deposit to:', result.depositAddress);
  console.log('Request ID:', result.requestId);
}

// Check status
const status = await service.checkBoostStatus(result.requestId);
console.log('Progress:', status.progress.percentage + '%');
```

## Integration into Your dApp

To integrate CKBoost into your own application:

1. **Install the client**:
   ```bash
   npm install @ckboost/client
   ```

2. **Initialize the client**:
   ```typescript
   import { ckTESTBTCClient } from '@ckboost/client';
   const client = new ckTESTBTCClient();
   ```

3. **Create boost requests**:
   ```typescript
   const result = await client.generateDepositAddress({
     amount: '0.01',
     maxFeePercentage: 1.5
   });
   ```

4. **Monitor progress**:
   ```typescript
   const status = await client.getBoostRequest(requestId);
   ```

## Error Handling

The sample demonstrates comprehensive error handling:
- Network connectivity issues
- Invalid parameters
- Request not found
- Backend canister errors

Each error type includes helpful tips for resolution.

## Real-world Considerations

When implementing in production:

1. **UI/UX**: Create beautiful interfaces for deposit address display
2. **QR Codes**: Generate QR codes for easy wallet scanning
3. **Real-time Updates**: Use WebSocket connections instead of polling
4. **Progress Indicators**: Show visual progress to users
5. **Notifications**: Alert users when transactions are complete
6. **Error Recovery**: Provide retry mechanisms for failed requests

## Testing

To test the integration:
1. Run the sample script
2. Use the provided deposit address with a Bitcoin testnet wallet
3. Send a small amount to see the monitoring in action
4. Observe how the status changes from pending → active → completed

## Support

- Check the main package README for detailed API documentation
- Review error messages for troubleshooting guidance
- Monitor console output for debugging information 