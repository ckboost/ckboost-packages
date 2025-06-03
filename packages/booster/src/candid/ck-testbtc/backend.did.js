export const idlFactory = ({ IDL }) => {
  const BoostId = IDL.Nat;
  const BoostStatus = IDL.Variant({
    'active' : IDL.Null,
    'cancelled' : IDL.Null,
    'pending' : IDL.Null,
    'completed' : IDL.Null,
  });
  const Amount = IDL.Nat;
  const Timestamp = IDL.Int;
  const Subaccount = IDL.Vec(IDL.Nat8);
  const BoostRequest = IDL.Record({
    'id' : BoostId,
    'status' : BoostStatus,
    'receivedBTC' : Amount,
    'confirmationsRequired' : IDL.Nat,
    'owner' : IDL.Principal,
    'maxFeePercentage' : IDL.Float64,
    'createdAt' : Timestamp,
    'subaccount' : Subaccount,
    'booster' : IDL.Opt(IDL.Principal),
    'updatedAt' : Timestamp,
    'btcAddress' : IDL.Opt(IDL.Text),
    'amount' : Amount,
    'preferredBooster' : IDL.Opt(IDL.Principal),
  });
  const Result = IDL.Variant({ 'ok' : BoostRequest, 'err' : IDL.Text });
  const BoosterAccount = IDL.Record({
    'availableBalance' : Amount,
    'owner' : IDL.Principal,
    'createdAt' : Timestamp,
    'subaccount' : Subaccount,
    'updatedAt' : Timestamp,
    'totalDeposited' : Amount,
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : BoosterAccount, 'err' : IDL.Text });
  const Main = IDL.Service({
    'acceptBoostRequest' : IDL.Func([BoostId], [IDL.Text], []),
    'checkBTCDeposit' : IDL.Func([BoostId], [Result], []),
    'getAllBoostRequests' : IDL.Func([], [IDL.Vec(BoostRequest)], ['query']),
    'getAllBoosterAccounts' : IDL.Func(
        [],
        [IDL.Vec(BoosterAccount)],
        ['query'],
      ),
    'getBoostRequest' : IDL.Func([BoostId], [IDL.Opt(BoostRequest)], ['query']),
    'getBoostRequestBTCAddress' : IDL.Func([BoostId], [Result_2], []),
    'getBoosterAccount' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(BoosterAccount)],
        ['query'],
      ),
    'getCanisterPrincipal' : IDL.Func([], [IDL.Principal], ['query']),
    'getDirectBTCAddress' : IDL.Func([], [IDL.Text], []),
    'getPendingBoostRequests' : IDL.Func(
        [],
        [IDL.Vec(BoostRequest)],
        ['query'],
      ),
    'getUserBoostRequests' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(BoostRequest)],
        ['query'],
      ),
    'registerBoostRequest' : IDL.Func(
        [Amount, IDL.Float64, IDL.Nat, IDL.Opt(IDL.Principal)],
        [Result],
        [],
      ),
    'registerBoosterAccount' : IDL.Func([], [Result_1], []),
    'updateBoosterDeposit' : IDL.Func([IDL.Principal, Amount], [Result_1], []),
    'updateReceivedBTC' : IDL.Func([BoostId, Amount], [Result], []),
    'withdrawBoosterFunds' : IDL.Func([Amount], [IDL.Text], []),
  });
  return Main;
};
export const init = ({ IDL }) => { return []; };
