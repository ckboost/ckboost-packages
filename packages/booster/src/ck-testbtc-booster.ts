import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { Ed25519KeyIdentity } from '@dfinity/identity'
import { createHash } from 'crypto'
import { idlFactory, _SERVICE } from './candid/ck-testbtc/backend.did.js'

// Constants from your script
const BACKEND_CANISTER_ID = "75egi-7qaaa-aaaao-qj6ma-cai"
const CKBTC_LEDGER_CANISTER_ID = "mc6ru-gyaaa-aaaar-qaaaq-cai"

/**
 * ckTestBTCBooster - Clean interface for CKBoost operations
 * Handles only the CKBoost-specific functionality from your working script
 */
export class ckTestBTCBooster {
  private actor!: _SERVICE
  private agent: HttpAgent
  private identity: Ed25519KeyIdentity
  private ledgerActor: any

  constructor(mnemonics: string, host: string = "https://icp0.io") {
    this.identity = this.createIdentityFromMnemonics(mnemonics)
    this.agent = new HttpAgent({ 
      host,
      identity: this.identity
    })
  }

  /**
   * Create identity from mnemonics (your exact logic)
   */
  private createIdentityFromMnemonics(mnemonics: string): Ed25519KeyIdentity {
    const words = mnemonics.trim().split(/\s+/)
    if (words.length !== 12) {
      throw new Error("Invalid mnemonics length. Expected 12 words.")
    }

    const hash = createHash('sha256')
    hash.update(words.join(' '))
    const seed = hash.digest()

    const identity = Ed25519KeyIdentity.generate(seed)
    console.log('Raw identity principal:', identity.getPrincipal().toText())
    
    return identity
  }

  /**
   * Initialize - now uses built-in IDL factory
   */
  async initialize(): Promise<void> {
    this.actor = Actor.createActor<_SERVICE>(idlFactory, { 
      agent: this.agent, 
      canisterId: Principal.fromText(BACKEND_CANISTER_ID) 
    })

    // Create ledger actor
    this.ledgerActor = this.createLedgerActor()
  }

  /**
   * Create ICRC-1 ledger actor (your exact logic)
   */
  private createLedgerActor() {
    const icrc1LedgerIDLFactory = ({ IDL }: { IDL: any }) => {
      const Account = IDL.Record({
        'owner': IDL.Principal,
        'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
      })
      const Tokens = IDL.Nat
      const Memo = IDL.Vec(IDL.Nat8)
      const Timestamp = IDL.Nat64
      const TransferArg = IDL.Record({
        'to': Account,
        'fee': IDL.Opt(Tokens),
        'memo': IDL.Opt(Memo),
        'from_subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
        'created_at_time': IDL.Opt(Timestamp),
        'amount': Tokens,
      })
      const TransferError = IDL.Variant({
        'GenericError': IDL.Record({
          'message': IDL.Text,
          'error_code': IDL.Nat,
        }),
        'TemporarilyUnavailable': IDL.Null,
        'BadBurn': IDL.Record({ 'min_burn_amount': Tokens }),
        'Duplicate': IDL.Record({ 'duplicate_of': IDL.Nat }),
        'BadFee': IDL.Record({ 'expected_fee': Tokens }),
        'CreatedInFuture': IDL.Record({ 'ledger_time': Timestamp }),
        'TooOld': IDL.Null,
        'InsufficientFunds': IDL.Record({ 'balance': Tokens }),
      })
      const TransferResult = IDL.Variant({
        'Ok': IDL.Nat,
        'Err': TransferError,
      })
      return IDL.Service({
        'icrc1_balance_of': IDL.Func([Account], [Tokens], ['query']),
        'icrc1_transfer': IDL.Func([TransferArg], [TransferResult], []),
      })
    }

    return Actor.createActor(icrc1LedgerIDLFactory, {
      agent: this.agent,
      canisterId: Principal.fromText(CKBTC_LEDGER_CANISTER_ID)
    })
  }

  // CKBoost Operations

  /**
   * Register as booster
   */
  async registerBoosterAccount() {
    return await this.actor.registerBoosterAccount()
  }

  /**
   * Get booster account
   */
  async getBoosterAccount(principal?: Principal) {
    const targetPrincipal = principal || await this.agent.getPrincipal()
    return await this.actor.getBoosterAccount(targetPrincipal)
  }

  /**
   * Update booster deposit
   */
  async updateBoosterDeposit(principal: Principal, amount: bigint) {
    return await this.actor.updateBoosterDeposit(principal, amount)
  }

  /**
   * Get pending boost requests
   */
  async getPendingBoostRequests() {
    return await this.actor.getPendingBoostRequests()
  }

  /**
   * Accept boost request
   */
  async acceptBoostRequest(requestId: bigint) {
    return await this.actor.acceptBoostRequest(requestId)
  }

  // ICRC-1 Operations

  /**
   * Transfer ckTESTBTC (your exact logic)
   */
  async transferCKTESTBTC(transferArgs: any) {
    return await this.ledgerActor['icrc1_transfer'](transferArgs)
  }

  /**
   * Get ckTESTBTC balance
   */
  async getCKTESTBTCBalance(account: any) {
    return await this.ledgerActor['icrc1_balance_of'](account)
  }

  // Utility methods

  /**
   * Get current principal
   */
  async getPrincipal(): Promise<Principal> {
    return await this.agent.getPrincipal()
  }

  /**
   * Get backend canister principal
   */
  getBackendCanisterPrincipal(): Principal {
    return Principal.fromText(BACKEND_CANISTER_ID)
  }

  /**
   * Get ledger canister principal
   */
  getLedgerCanisterPrincipal(): Principal {
    return Principal.fromText(CKBTC_LEDGER_CANISTER_ID)
  }

  /**
   * Convert BTC to satoshis
   */
  btcToSatoshis(btcAmount: number): bigint {
    return BigInt(btcAmount * 10 ** 8)
  }

  /**
   * Convert satoshis to BTC
   */
  satoshisToBTC(satoshis: bigint): number {
    return Number(satoshis) / 10 ** 8
  }
}