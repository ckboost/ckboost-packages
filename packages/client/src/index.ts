// Main ckTESTBTCClient class - clean API for ckTESTBTC boost integration
export { ckTESTBTCClient } from './ck-testbtc-client';

// ckTESTBTC Candid types for type safety
export type { _SERVICE as ckTESTBTCService } from './candid/ck-testbtc/backend.did';
export type { 
  BoosterAccount as ckTESTBTCBoosterAccount, 
  BoostRequest as ckTESTBTCBackendBoostRequest, 
  Result as ckTESTBTCResult, 
  Result_1 as ckTESTBTCResult_1 
} from './candid/ck-testbtc/backend.did';

// ckTESTBTC constants
export const ckTESTBTC_CANISTER_IDS = {
  CKBOOST_BACKEND: '75egi-7qaaa-aaaao-qj6ma-cai',
  CKTESTBTC_LEDGER: 'mc6ru-gyaaa-aaaar-qaaaq-cai'
} as const;

// Generic types (can be used for future tokens)
export {
  // Enums (values)
  SupportedToken,
  BoostStatus,
  CKBoostErrorType,
  
  // Constants (values)
  TOKEN_CONFIGS,
  
  // Error class (value)
  CKBoostError
} from './types';

export type {
  // Interfaces (types only)
  DepositAddressParams,
  DepositAddress,
  BoostRequest,
  ClientConfig,
  TokenConfig,
  ApiResponse,
  AmountInfo
} from './types'; 