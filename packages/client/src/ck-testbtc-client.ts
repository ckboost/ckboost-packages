import { HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { createActor } from './candid/ck-testbtc';
import type { _SERVICE } from './candid/ck-testbtc/backend.did';
import {
  SupportedToken,
  TOKEN_CONFIGS,
  DepositAddressParams,
  DepositAddress,
  BoostRequest,
  BoostStatus,
  ClientConfig,
  CKBoostError,
  CKBoostErrorType,
  ApiResponse
} from './types';

/**
 * ckTESTBTC Client for integrating CKBoost acceleration for ckTESTBTC
 * 
 * Provides two main functions:
 * 1. generateDepositAddress - Creates a boost request and returns deposit info
 * 2. getBoostRequest - Gets detailed information about a boost request
 */
export class ckTESTBTCClient {
  private agent: HttpAgent;
  private backend: _SERVICE;
  private config: Required<ClientConfig>;
  private tokenConfig = TOKEN_CONFIGS[SupportedToken.ckTESTBTC];

  constructor(config: ClientConfig = {}) {
    this.config = {
      host: config.host || 'https://icp-api.io',
      timeout: config.timeout || 30000
    };

    // Initialize HTTP agent
    this.agent = new HttpAgent({
      host: this.config.host,
    });

    // Initialize backend actor for ckTESTBTC
    this.backend = createActor(this.tokenConfig.backendCanisterId, {
      agent: this.agent,
    });

    // Only fetch root key for testnet tokens or localhost
    if (this.tokenConfig.isTestnet || this.config.host.includes('localhost')) {
      this.agent.fetchRootKey().catch(err => {
        console.warn('Failed to fetch root key:', err);
      });
    }
  }

  /**
   * Generate a deposit address for a ckTESTBTC boost request
   * 
   * This function:
   * 1. Validates the input parameters
   * 2. Calls registerBoostRequest on the backend
   * 3. Gets the deposit address for the request
   * 4. Returns formatted deposit information
   */
  async generateDepositAddress(params: Omit<DepositAddressParams, 'token'>): Promise<ApiResponse<DepositAddress>> {
    try {
      // Validate amount
      const amount = parseFloat(params.amount);
      const minAmount = parseFloat(this.tokenConfig.minimumAmount);
      const maxAmount = parseFloat(this.tokenConfig.maximumAmount);

      if (amount < minAmount) {
        throw new CKBoostError(
          CKBoostErrorType.INVALID_AMOUNT,
          `Amount ${params.amount} is below minimum ${this.tokenConfig.minimumAmount}`
        );
      }

      if (amount > maxAmount) {
        throw new CKBoostError(
          CKBoostErrorType.INVALID_AMOUNT,
          `Amount ${params.amount} exceeds maximum ${this.tokenConfig.maximumAmount}`
        );
      }

      // Validate fee percentage
      if (params.maxFeePercentage < 0.1 || params.maxFeePercentage > 2.0) {
        throw new CKBoostError(
          CKBoostErrorType.VALIDATION_ERROR,
          'Fee percentage must be between 0.1% and 2.0%'
        );
      }

      // Convert amount to raw units (satoshis for ckTESTBTC)
      const amountRaw = BigInt(Math.floor(amount * Math.pow(10, this.tokenConfig.decimals)));
      
      // Get confirmations required
      const confirmationsRequired = BigInt(params.confirmationsRequired || this.tokenConfig.confirmationsRequired);
      
      // Convert preferred booster to Principal if provided
      const preferredBooster: [] | [Principal] = params.preferredBooster 
        ? [Principal.fromText(params.preferredBooster)]
        : [];

      // Register boost request
      const registerResult = await this.backend.registerBoostRequest(
        amountRaw,
        params.maxFeePercentage,
        confirmationsRequired,
        preferredBooster
      );

      if ('err' in registerResult) {
        throw new CKBoostError(
          CKBoostErrorType.CANISTER_ERROR,
          `Failed to register boost request: ${registerResult.err}`
        );
      }

      const boostRequest = registerResult.ok;
      const requestId = boostRequest.id.toString();

      // Get deposit address
      const addressResult = await this.backend.getBoostRequestBTCAddress(boostRequest.id);

      if ('err' in addressResult) {
        throw new CKBoostError(
          CKBoostErrorType.CANISTER_ERROR,
          `Failed to get deposit address: ${addressResult.err}`
        );
      }

      const depositAddressValue = addressResult.ok;

      // Format response
      const depositAddress: DepositAddress = {
        requestId,
        address: depositAddressValue,
        amount: params.amount,
        amountRaw: amountRaw.toString(),
        maxFeePercentage: params.maxFeePercentage,
        confirmationsRequired: Number(confirmationsRequired),
        explorerUrl: `${this.tokenConfig.blockExplorerUrl}/address/${depositAddressValue}`
      };

      return {
        success: true,
        data: depositAddress
      };

    } catch (error) {
      if (error instanceof CKBoostError) {
        return {
          success: false,
          error: {
            type: error.type,
            message: error.message,
            details: error.details
          }
        };
      }

      return {
        success: false,
        error: {
          type: CKBoostErrorType.NETWORK_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        }
      };
    }
  }

  /**
   * Get detailed information about a ckTESTBTC boost request
   * 
   * @param requestId - The boost request ID (as string)
   * @returns Detailed boost request information
   */
  async getBoostRequest(requestId: string): Promise<ApiResponse<BoostRequest>> {
    try {
      // Convert string ID to bigint
      const boostId = BigInt(requestId);

      // Get boost request from backend
      const result = await this.backend.getBoostRequest(boostId);

      if (result.length === 0) {
        throw new CKBoostError(
          CKBoostErrorType.REQUEST_NOT_FOUND,
          `Boost request with ID ${requestId} not found`
        );
      }

      const backendRequest = result[0];

      // Convert backend BoostRequest to our format
      const boostRequest: BoostRequest = {
        id: backendRequest.id.toString(),
        status: this.convertBoostStatus(backendRequest.status),
        amount: this.rawToTokenAmount(backendRequest.amount),
        amountRaw: backendRequest.amount.toString(),
        maxFeePercentage: backendRequest.maxFeePercentage,
        owner: backendRequest.owner.toString(),
        booster: backendRequest.booster.length > 0 ? backendRequest.booster[0]?.toString() : undefined,
        preferredBooster: backendRequest.preferredBooster.length > 0 ? backendRequest.preferredBooster[0]?.toString() : undefined,
        depositAddress: backendRequest.btcAddress.length > 0 ? backendRequest.btcAddress[0] : undefined,
        receivedAmount: this.rawToTokenAmount(backendRequest.receivedBTC),
        confirmationsRequired: Number(backendRequest.confirmationsRequired),
        createdAt: Number(backendRequest.createdAt),
        updatedAt: Number(backendRequest.updatedAt),
        explorerUrl: backendRequest.btcAddress.length > 0 && backendRequest.btcAddress[0]
          ? `${this.tokenConfig.blockExplorerUrl}/address/${backendRequest.btcAddress[0]}`
          : this.tokenConfig.blockExplorerUrl
      };

      return {
        success: true,
        data: boostRequest
      };

    } catch (error) {
      if (error instanceof CKBoostError) {
        return {
          success: false,
          error: {
            type: error.type,
            message: error.message,
            details: error.details
          }
        };
      }

      return {
        success: false,
        error: {
          type: CKBoostErrorType.NETWORK_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        }
      };
    }
  }

  /**
   * Convert backend BoostStatus variant to our enum
   */
  private convertBoostStatus(status: any): BoostStatus {
    if ('pending' in status) return BoostStatus.PENDING;
    if ('active' in status) return BoostStatus.ACTIVE;
    if ('completed' in status) return BoostStatus.COMPLETED;
    if ('cancelled' in status) return BoostStatus.CANCELLED;
    return BoostStatus.PENDING; // Default fallback
  }

  /**
   * Convert raw amount (bigint) to token amount string
   */
  private rawToTokenAmount(rawAmount: bigint): string {
    const amount = Number(rawAmount) / Math.pow(10, this.tokenConfig.decimals);
    return amount.toFixed(this.tokenConfig.decimals);
  }

  /**
   * Utility method to get all pending ckTESTBTC boost requests
   */
  async getPendingBoostRequests(): Promise<ApiResponse<BoostRequest[]>> {
    try {
      const result = await this.backend.getPendingBoostRequests();

      const requests: BoostRequest[] = result.map(backendRequest => ({
        id: backendRequest.id.toString(),
        status: this.convertBoostStatus(backendRequest.status),
        amount: this.rawToTokenAmount(backendRequest.amount),
        amountRaw: backendRequest.amount.toString(),
        maxFeePercentage: backendRequest.maxFeePercentage,
        owner: backendRequest.owner.toString(),
        booster: backendRequest.booster.length > 0 ? backendRequest.booster[0]?.toString() : undefined,
        preferredBooster: backendRequest.preferredBooster.length > 0 ? backendRequest.preferredBooster[0]?.toString() : undefined,
        depositAddress: backendRequest.btcAddress.length > 0 ? backendRequest.btcAddress[0] : undefined,
        receivedAmount: this.rawToTokenAmount(backendRequest.receivedBTC),
        confirmationsRequired: Number(backendRequest.confirmationsRequired),
        createdAt: Number(backendRequest.createdAt) / 1_000_000, // Convert nanoseconds to milliseconds
        updatedAt: Number(backendRequest.updatedAt) / 1_000_000, // Convert nanoseconds to milliseconds
        explorerUrl: backendRequest.btcAddress.length > 0 && backendRequest.btcAddress[0]
          ? `${this.tokenConfig.blockExplorerUrl}/address/${backendRequest.btcAddress[0]}`
          : this.tokenConfig.blockExplorerUrl
      }));

      return {
        success: true,
        data: requests
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: CKBoostErrorType.NETWORK_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        }
      };
    }
  }

  /**
   * Get the ckTESTBTC token configuration
   */
  getTokenConfig() {
    return this.tokenConfig;
  }
} 