// Core types for CKBoost client integration

/**
 * Supported ck-tokens for CKBoost acceleration
 */
export enum SupportedToken {
  ckTESTBTC = 'ckTESTBTC'
  // Future tokens will be added here:
  // ckBTC = 'ckBTC',
  // ckETH = 'ckETH',
  // ckUSDC = 'ckUSDC'
}

/**
 * Token configuration with network-specific settings
 */
export interface TokenConfig {
  token: SupportedToken;
  backendCanisterId: string;
  ledgerCanisterId: string;
  minimumAmount: string;      // Minimum boost amount (e.g., "0.0001")
  maximumAmount: string;      // Maximum boost amount (e.g., "1.0")
  standardFee: string;        // Standard fee (e.g., "0.001")
  confirmationsRequired: number;
  blockExplorerUrl: string;
  decimals: number;           // Token decimals (e.g., 8 for Bitcoin-like tokens)
  isTestnet: boolean;         // Whether this is a testnet token
}

/**
 * Predefined token configurations
 */
export const TOKEN_CONFIGS: Record<SupportedToken, TokenConfig> = {
  [SupportedToken.ckTESTBTC]: {
    token: SupportedToken.ckTESTBTC,
    backendCanisterId: '75egi-7qaaa-aaaao-qj6ma-cai',
    ledgerCanisterId: 'mc6ru-gyaaa-aaaar-qaaaq-cai',
    minimumAmount: '0.005',
    maximumAmount: '1.0',
    standardFee: '0.00001',
    confirmationsRequired: 2,
    blockExplorerUrl: 'https://mempool.space/testnet4',
    decimals: 8,
    isTestnet: true
  }
};

/**
 * Parameters for generating a deposit address
 */
export interface DepositAddressParams {
  token: SupportedToken;
  amount: string;              // Amount in token units (e.g., "0.01" for 0.01 ckTESTBTC)
  maxFeePercentage: number;    // Maximum fee percentage (e.g., 1.5 for 1.5%)
  confirmationsRequired?: number; // Optional, defaults to token standard
  preferredBooster?: string;   // Optional preferred booster principal
}

/**
 * Generated deposit address information
 */
export interface DepositAddress {
  requestId: string;           // Unique boost request ID
  address: string;             // Deposit address for the underlying asset
  amount: string;              // Exact amount to send (in token units)
  amountRaw: string;           // Amount in smallest units (e.g., satoshis for Bitcoin)
  maxFeePercentage: number;    // Fee percentage
  confirmationsRequired: number;
  explorerUrl: string;         // Block explorer URL for tracking
}

/**
 * Boost request status (matches backend candid interface)
 */
export enum BoostStatus {
  PENDING = 'pending',         // Waiting for deposit
  ACTIVE = 'active',           // Transaction detected/being processed
  COMPLETED = 'completed',     // ck-tokens delivered to user
  CANCELLED = 'cancelled'      // Request cancelled
}

/**
 * Detailed boost request information (matches backend BoostRequest type)
 */
export interface BoostRequest {
  id: string;                  // Request ID (converted from bigint)
  status: BoostStatus;         // Current status
  amount: string;              // Amount in token units (converted from bigint)
  amountRaw: string;           // Amount in smallest units (e.g., satoshis)
  maxFeePercentage: number;    // Maximum fee percentage
  owner: string;               // Owner principal as string
  booster?: string | undefined; // Assigned booster principal (if any)
  preferredBooster?: string | undefined; // Preferred booster principal (if any)
  depositAddress?: string | undefined; // Deposit address (if generated)
  receivedAmount: string;      // Amount of underlying asset received (converted from bigint)
  confirmationsRequired: number; // Required confirmations (converted from bigint)
  createdAt: number;           // Creation timestamp (converted from bigint)
  updatedAt: number;           // Last update timestamp (converted from bigint)
  explorerUrl: string;         // Block explorer URL
}

/**
 * Client configuration options
 */
export interface ClientConfig {
  host?: string;               // ICP host URL (default: 'https://icp-api.io')
  timeout?: number;            // Request timeout in milliseconds
}

/**
 * Error types for better error handling
 */
export enum CKBoostErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_TOKEN = 'INVALID_TOKEN',
  REQUEST_NOT_FOUND = 'REQUEST_NOT_FOUND',
  REQUEST_EXPIRED = 'REQUEST_EXPIRED',
  CANISTER_ERROR = 'CANISTER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * Structured error for CKBoost operations
 */
export class CKBoostError extends Error {
  constructor(
    public type: CKBoostErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CKBoostError';
  }
}

/**
 * Response wrapper for API calls - discriminated union for better type safety
 */
export type ApiResponse<T> = 
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        type: CKBoostErrorType;
        message: string;
        details?: any;
      };
    };

/**
 * Utility type for amount conversion
 */
export interface AmountInfo {
  tokenAmount: string;         // Human-readable amount (e.g., "0.01")
  rawAmount: string;           // Raw amount in smallest units (e.g., "1000000")
  formatted: string;          // Formatted display (e.g., "0.01000000 ckTESTBTC")
} 