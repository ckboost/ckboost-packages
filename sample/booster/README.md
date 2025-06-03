# CKBoost Liquidity Provider Bot Sample

This sample demonstrates how to use the `@ckboost/booster` package to create an automated liquidity provider bot for the CKBoost platform.

## Overview

The bot:
- Monitors pending boost requests from users
- Verifies Bitcoin transactions via mempool API
- Applies configurable risk parameters
- Automatically accepts profitable requests
- Handles graceful shutdown and error recovery

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp env.example .env
# Edit .env with your mnemonic phrase
```

3. **Run the bot:**
```bash
npm start
```

## Configuration

The bot uses environment variables for configuration:

- `MNEMONICS`: Your 12-word mnemonic phrase (required)
- `ICP_HOST`: Custom ICP host (optional, defaults to https://icp0.io)

Risk parameters can be modified in the `MonitorConfig` class:

```typescript
static readonly RISK_PARAMETERS = {
  maxAmountBTC: 1.0,           // Maximum 1 ckTESTBTC per request
  minFeePercentage: 0.1,       // Minimum 0.1% fee
  maxRequestAge: 3600000,      // 1 hour in milliseconds
};
```

## Features

### Basic Monitor (`BoostRequestMonitor`)
- Registers as booster automatically
- Manages deposit funds
- Monitors boost requests
- Verifies Bitcoin transactions
- Accepts valid requests

### Enhanced Monitor (`EnhancedBoostMonitor`)
- All basic features plus:
- Risk assessment before acceptance
- Configurable limits and parameters
- Better logging and error handling

## Security Notes

- **Never commit your mnemonic phrase to version control**
- **Keep your `.env` file secure**
- **Start with small amounts for testing**
- **Monitor the bot's performance regularly**

## Troubleshooting

### Common Issues

1. **"MNEMONICS environment variable is not set"**
   - Make sure you've created a `.env` file with your mnemonic

2. **"Insufficient funds for operation"**
   - Ensure you have enough ckTESTBTC in your wallet
   - The bot will automatically deposit funds if needed

3. **"Failed to authenticate with agent"**
   - Check your mnemonic phrase is correct
   - Verify network connectivity

### Debug Mode

Set the log level for more detailed output:
```bash
NODE_ENV=development npm start
```

## API Integration

The script demonstrates integration with:
- **CKBoost Backend**: For boost request management
- **Mempool API**: For Bitcoin transaction verification
- **ICRC-1 Ledger**: For ckTESTBTC operations
