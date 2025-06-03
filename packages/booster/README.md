# @ckboost/booster

A TypeScript SDK for liquidity providers to participate in the CKBoost platform on the Internet Computer Protocol (ICP).

## What is CKBoost?

ckBoost is a  platform that accelerates Bitcoin transactions by reducing ckBTC conversion times from **1 hour** (6 confirmations) to just **7-10 minutes** (1-2 confirmations).

### How it works:
- **User-initiated requests**: Users submit boost requests when they need faster ckBTC conversion
- **Liquidity provider acceptance**: Providers evaluate and accept requests based on their risk parameters
- **Flexible fees**: Pool operators set fees between 0.1% - 2%
- **Multi-token support**: Supports all ck-tokens (ckBTC, ckETH, ckUSDC, etc.)
- **Testnet ready**: This package supports ckTESTBTC for testing

## Package Purpose

`@ckboost/booster` is designed for **liquidity providers** who want to:
- Monitor incoming boost requests from users
- Accept boost requests based on their own risk criteria
- Earn fees by providing faster ckBTC conversion services
- Manage their booster account and liquidity

> **Note**: For dApp developers integrating CKBoost for their users, see `@ckboost/client` (coming soon).

## Installation

```bash
npm install @ckboost/booster
```

## Quick Start

```typescript
import { ckTestBTCBooster } from '@ckboost/booster'

// Initialize with your mnemonic phrase
const booster = new ckTestBTCBooster('your twelve word mnemonic phrase here')

// Initialize the connection
await booster.initialize()

// Register as a booster
await booster.registerBoosterAccount()

// Check your account
const account = await booster.getBoosterAccount()
console.log('Booster account:', account)

// Check your ckTESTBTC balance
const balance = await booster.getBalance()
console.log('Balance:', booster.formatBTC(balance), 'ckTESTBTC')
```

## Core Concepts

### Booster Account
A registered account that can provide liquidity and accept boost requests. Each booster account has:
- **Principal ID**: Your unique identifier
- **Deposit amount**: ckTESTBTC locked for boosting
- **Status**: Active/inactive state

### Boost Requests
Users submit boost requests when they need faster ckBTC conversion. As a liquidity provider, you can:
- Monitor pending boost requests from users
- Evaluate requests based on your risk parameters (amount, fees, user history)
- Accept requests that meet your criteria
- Earn fees for providing faster conversion services

## API Reference

### Constructor

```typescript
new ckTestBTCBooster(mnemonics: string, host?: string)
```

- `mnemonics`: Your 12-word mnemonic phrase for identity creation
- `host`: ICP host URL (defaults to mainnet)

### Initialization

```typescript
await booster.initialize(): Promise<void>
```

Initializes the connection to ICP and sets up the actor. Must be called before using other methods.

### Booster Management

```typescript
// Register as a booster
await booster.registerBoosterAccount(): Promise<any>

// Get your booster account info
await booster.getBoosterAccount(): Promise<BoosterAccount | null>

// Update your deposit amount
await booster.updateBoosterDeposit(amount: bigint): Promise<any>
```

### Boost Operations

```typescript
// Get pending boost requests
await booster.getPendingBoostRequests(): Promise<BoostRequest[]>

// Accept a boost request
await booster.acceptBoostRequest(requestId: bigint): Promise<any>
```

### ICRC-1 Token Operations

```typescript
// Get your ckTESTBTC balance
await booster.getBalance(): Promise<bigint>

// Transfer ckTESTBTC
await booster.transfer(to: string, amount: bigint): Promise<any>

// Approve spending (for booster deposits)
await booster.approve(spender: string, amount: bigint): Promise<any>
```

### Utility Methods

```typescript
// Convert satoshis to BTC
booster.formatBTC(satoshis: bigint): string

// Convert BTC to satoshis  
booster.parseBTC(btc: string): bigint

// Get your principal ID
booster.getPrincipal(): Principal
```

## Complete Example

```typescript
import { 
  ckTestBTCBooster, 
  ckTESTBTC_CANISTER_IDS,
  type ckTESTBTCBoosterAccount 
} from '@ckboost/booster'

async function runBooster() {
  // Initialize booster
  const booster = new ckTestBTCBooster('your mnemonic here')
  await booster.initialize()
  
  console.log('Booster Principal:', booster.getPrincipal().toString())
  console.log('Backend Canister:', ckTESTBTC_CANISTER_IDS.CKBOOST_BACKEND)
  
  // Check if already registered
  let account = await booster.getBoosterAccount()
  
  if (!account) {
    console.log('Registering as booster...')
    await booster.registerBoosterAccount()
    account = await booster.getBoosterAccount()
  }
  
  console.log('Booster account:', account)
  
  // Check balance
  const balance = await booster.getBalance()
  console.log('ckTESTBTC balance:', booster.formatBTC(balance))
  
  // Deposit liquidity (example: 0.01 ckTESTBTC)
  const depositAmount = booster.parseBTC('0.01')
  
  // First approve the backend to spend your tokens
  await booster.approve(ckTESTBTC_CANISTER_IDS.CKBOOST_BACKEND, depositAmount)
  
  // Update your booster deposit
  await booster.updateBoosterDeposit(depositAmount)
  
  // Monitor for boost requests
  const pendingRequests = await booster.getPendingBoostRequests()
  console.log('Pending requests:', pendingRequests.length)
  
  // Accept the first request (if any)
  if (pendingRequests.length > 0) {
    const request = pendingRequests[0]
    console.log('Accepting boost request:', request)
    await booster.acceptBoostRequest(request.id)
  }
}

runBooster().catch(console.error)
```

## Type Safety

The package exports all Candid types for full type safety:

```typescript
import type { 
  ckTESTBTCService,
  ckTESTBTCBoosterAccount,
  ckTESTBTCBoostRequest,
  ckTESTBTCResult 
} from '@ckboost/booster'
```

## Canister IDs

Access predefined canister IDs:

```typescript
import { ckTESTBTC_CANISTER_IDS } from '@ckboost/booster'

console.log(ckTESTBTC_CANISTER_IDS.CKBOOST_BACKEND)  // '75egi-7qaaa-aaaao-qj6ma-cai'
console.log(ckTESTBTC_CANISTER_IDS.CKTESTBTC_LEDGER) // 'mc6ru-gyaaa-aaaar-qaaaq-cai'
```

## Error Handling

All methods return promises and may throw errors. Always use try-catch:

```typescript
try {
  await booster.registerBoosterAccount()
} catch (error) {
  console.error('Failed to register:', error)
}
```

## Security Notes

- **Never share your mnemonic phrase**
- **Test thoroughly on testnet before mainnet**
- **Monitor your booster account regularly**
- **Set appropriate deposit amounts based on your risk tolerance**



**⚡ Start boosting ckTESTBTC transactions today!** 