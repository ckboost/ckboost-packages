import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Amount = bigint;
export type BoostId = bigint;
export interface BoostRequest {
  'id' : BoostId,
  'status' : BoostStatus,
  'receivedBTC' : Amount,
  'confirmationsRequired' : bigint,
  'owner' : Principal,
  'maxFeePercentage' : number,
  'createdAt' : Timestamp,
  'subaccount' : Subaccount,
  'booster' : [] | [Principal],
  'updatedAt' : Timestamp,
  'btcAddress' : [] | [string],
  'amount' : Amount,
  'preferredBooster' : [] | [Principal],
}
export type BoostStatus = { 'active' : null } |
  { 'cancelled' : null } |
  { 'pending' : null } |
  { 'completed' : null };
export interface BoosterAccount {
  'availableBalance' : Amount,
  'owner' : Principal,
  'createdAt' : Timestamp,
  'subaccount' : Subaccount,
  'updatedAt' : Timestamp,
  'totalDeposited' : Amount,
}
export interface Main {
  'acceptBoostRequest' : ActorMethod<[BoostId], string>,
  'checkBTCDeposit' : ActorMethod<[BoostId], Result>,
  'getAllBoostRequests' : ActorMethod<[], Array<BoostRequest>>,
  'getAllBoosterAccounts' : ActorMethod<[], Array<BoosterAccount>>,
  'getBoostRequest' : ActorMethod<[BoostId], [] | [BoostRequest]>,
  'getBoostRequestBTCAddress' : ActorMethod<[BoostId], Result_2>,
  'getBoosterAccount' : ActorMethod<[Principal], [] | [BoosterAccount]>,
  'getCanisterPrincipal' : ActorMethod<[], Principal>,
  'getDirectBTCAddress' : ActorMethod<[], string>,
  'getPendingBoostRequests' : ActorMethod<[], Array<BoostRequest>>,
  'getUserBoostRequests' : ActorMethod<[Principal], Array<BoostRequest>>,
  'registerBoostRequest' : ActorMethod<
    [Amount, number, bigint, [] | [Principal]],
    Result
  >,
  'registerBoosterAccount' : ActorMethod<[], Result_1>,
  'updateBoosterDeposit' : ActorMethod<[Principal, Amount], Result_1>,
  'updateReceivedBTC' : ActorMethod<[BoostId, Amount], Result>,
  'withdrawBoosterFunds' : ActorMethod<[Amount], string>,
}
export type Result = { 'ok' : BoostRequest } |
  { 'err' : string };
export type Result_1 = { 'ok' : BoosterAccount } |
  { 'err' : string };
export type Result_2 = { 'ok' : string } |
  { 'err' : string };
export type Subaccount = Uint8Array | number[];
export type Timestamp = bigint;
export interface _SERVICE extends Main {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
