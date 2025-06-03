// Main ckTestBTCBooster class - clean API for ckTESTBTC boosting
export { ckTestBTCBooster } from './ck-testbtc-booster'

// ckTESTBTC Candid types for type safety
export type { _SERVICE as ckTESTBTCService } from './candid/ck-testbtc/backend.did.js'
export type { 
  BoosterAccount as ckTESTBTCBoosterAccount, 
  BoostRequest as ckTESTBTCBoostRequest, 
  Result as ckTESTBTCResult, 
  Result_1 as ckTESTBTCResult_1 
} from './candid/ck-testbtc/backend.did.js'

// ckTESTBTC constants
export const ckTESTBTC_CANISTER_IDS = {
  CKBOOST_BACKEND: '75egi-7qaaa-aaaao-qj6ma-cai',
  CKTESTBTC_LEDGER: 'mc6ru-gyaaa-aaaar-qaaaq-cai'
} as const 