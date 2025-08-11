#!/usr/bin/env python3
"""
Option Position Sizer — underlying-anchored risk

Calculate how many option contracts to buy so that your dollar risk is consistent,
using a stop defined on the UNDERLYING (break of structure, level, etc.).

Now includes:
- Percent drawdown at the stop (requires estimated entry premium)
- Percent-cap helper: computes the MINIMUM entry premium needed to keep % drawdown ≤ cap

Author: You
"""

from dataclasses import dataclass
from math import floor
from typing import Optional

@dataclass
class SizingInput:
    # Capital & risk
    account_size: float = 5000.0
    risk_pct: Optional[float] = 0.02  # e.g. 0.02 = 2%
    fixed_dollar_risk: Optional[float] = None  # overrides risk_pct if provided

    # Trade thesis
    direction: str = "call"  # "call" or "put"
    entry_low: float = 210.20
    entry_high: float = 210.50  # worst-case fill for sizing
    stop: float = 209.20        # underlying stop level

    # Option parameters
    delta: float = 0.40         # expected option delta at entry
    buffer: float = 1.10        # cushion for gamma/vega/slippage (e.g., 1.10 = +10%)

    # Practical constraints (optional)
    max_premium_per_contract: Optional[float] = None  # e.g., 3.50 -> $350/contract
    est_entry_premium: Optional[float] = None         # option price per share (e.g., 2.50 = $250/contract)

    # Percent drawdown cap (optional)
    pct_drawdown_cap: Optional[float] = None          # e.g., 0.10 for 10% cap

def compute_dollar_risk(inp: SizingInput) -> float:
    if inp.fixed_dollar_risk is not None:
        if inp.fixed_dollar_risk <= 0:
            raise ValueError("fixed_dollar_risk must be > 0")
        return float(inp.fixed_dollar_risk)

    if inp.risk_pct is None:
        raise ValueError("Provide either fixed_dollar_risk or risk_pct.")
    if not (0 < inp.risk_pct <= 1):
        raise ValueError("risk_pct must be in (0, 1].")

    return float(inp.account_size) * float(inp.risk_pct)

def per_share_risk(inp: SizingInput) -> float:
    # Use worst-case side of the entry zone
    worst_entry = inp.entry_high if inp.direction.lower() == "call" else inp.entry_low

    if inp.direction.lower() == "call":
        r = worst_entry - inp.stop
    elif inp.direction.lower() == "put":
        r = inp.stop - worst_entry
    else:
        raise ValueError("direction must be 'call' or 'put'.")

    if r <= 0:
        raise ValueError(
            "Per-share risk is <= 0. Check your entry zone and stop placement."
        )
    return r

def per_contract_loss_at_stop(inp: SizingInput) -> float:
    """
    Approximate loss per contract when underlying hits the stop.
    """
    r_share = per_share_risk(inp)
    # delta * $ move per share * 100 shares/contract, with buffer
    loss = r_share * float(inp.delta) * 100.0 * float(inp.buffer)
    if loss <= 0:
        raise ValueError("Computed per-contract loss is <= 0; check inputs.")
    return loss

def affordability_ok(inp: SizingInput, contracts: int) -> bool:
    """
    Optional affordability check: if max_premium_per_contract is set and
    est_entry_premium is given, ensure you have enough buying power.
    """
    if inp.max_premium_per_contract is None:
        return True
    if inp.est_entry_premium is None:
        # Can't verify affordability without an estimated premium
        return True
    return inp.est_entry_premium <= inp.max_premium_per_contract


def allowed_per_share_risk_for_cap(per_ct_loss_cap: float, delta: float, buffer: float) -> float:
    """
    Convert a per-contract loss cap into a PER-SHARE loss cap on the underlying.
    per_ct_loss_cap: dollars per contract (e.g., 10% of $250 contract = $25)
    Returns: allowed $ move on the underlying before stop, per share.
    Formula inversion of: per_ct_loss ≈ r_share * delta * 100 * buffer
    => r_share = per_ct_loss_cap / (delta * 100 * buffer)
    """
    if delta <= 0 or buffer <= 0:
        raise ValueError("delta and buffer must be > 0")
    return per_ct_loss_cap / (delta * 100.0 * buffer)

def entry_threshold_for_cap(direction: str, stop: float, est_entry_premium: float, pct_cap: float, delta: float, buffer: float):
    """
    Given a percent drawdown cap (fraction), estimated entry premium (price per share),
    stop on the underlying, and option greeks, compute the ALLOWABLE 'worst-case' entry
    price on the UNDERLYING that keeps the drawdown at the stop ≤ pct_cap.
    
    For calls:  threshold is the MAX entry price (stop + allowed_r_share).
    For puts:   threshold is the MIN entry price (stop - allowed_r_share).
    Returns: (threshold_price, label) where label is 'max' for calls, 'min' for puts.
    """
    if pct_cap <= 0:
        raise ValueError("pct_cap must be > 0 (e.g., 0.10 for 10%).")
    if est_entry_premium <= 0:
        raise ValueError("est_entry_premium must be > 0")

    # Allowed per-contract loss at stop (dollars/contract)
    per_ct_loss_cap = pct_cap * est_entry_premium * 100.0
    # Translate to per-share move on the underlying
    allowed_r_share = allowed_per_share_risk_for_cap(per_ct_loss_cap, delta, buffer)

    d = direction.lower()
    if d == "call":
        threshold = stop + allowed_r_share
        label = "max"
    elif d == "put":
        threshold = stop - allowed_r_share
        label = "min"
    else:
        raise ValueError("direction must be 'call' or 'put'.")
    return threshold, label, allowed_r_share

def size_contracts(inp: SizingInput):
    dollar_risk = compute_dollar_risk(inp)
    per_ct_loss = per_contract_loss_at_stop(inp)

    raw_contracts = dollar_risk / per_ct_loss
    contracts = max(0, floor(raw_contracts))

    result = {
        "direction": inp.direction.lower(),
        "account_size": inp.account_size,
        "risk_pct": inp.risk_pct,
        "fixed_dollar_risk": inp.fixed_dollar_risk,
        "dollar_risk": round(dollar_risk, 2),
        "entry_low": inp.entry_low,
        "entry_high": inp.entry_high,
        "stop": inp.stop,
        "delta": inp.delta,
        "buffer": inp.buffer,
        "per_share_risk": round(per_share_risk(inp), 4),
        "per_contract_loss_at_stop": round(per_ct_loss, 2),
        "raw_contracts": raw_contracts,
        "contracts": contracts,
        "affordability_checked": False,
        "affordable": True,
        "cap_entry_threshold_computed": False,

    }

    # Percent drawdown at stop based on estimated entry premium
    # Entry threshold for % drawdown cap (UNDERLYING price)
    if inp.est_entry_premium is not None and inp.pct_drawdown_cap is not None:
        thr, label, allowed_r_share = entry_threshold_for_cap(
            inp.direction, inp.stop, inp.est_entry_premium, inp.pct_drawdown_cap, inp.delta, inp.buffer
        )
        result["cap_entry_threshold_computed"] = True
        if label == "max":
            result["max_underlying_entry_for_cap"] = round(thr, 4)
            # Check if the planned worst-case entry (entry_high for calls) respects the cap
            result["zone_respects_pct_cap"] = (inp.entry_high <= thr)
        else:
            result["min_underlying_entry_for_cap"] = round(thr, 4)
            # For puts, worst-case is entry_low; must be >= threshold
            result["zone_respects_pct_cap"] = (inp.entry_low >= thr)
        result["allowed_per_share_risk_for_cap"] = round(allowed_r_share, 4)

    if inp.est_entry_premium is not None:
        # est_entry_premium is price per share; contract notional = *100
        pct_drawdown = per_ct_loss / (inp.est_entry_premium * 100.0)  # fraction
        result["est_entry_premium"] = inp.est_entry_premium
        result["pct_drawdown_at_stop"] = round(pct_drawdown * 100.0, 2)  # percent

    # Percent-cap helper: the MINIMUM entry premium needed to keep % drawdown ≤ cap
    if inp.pct_drawdown_cap is not None:
        if inp.pct_drawdown_cap <= 0:
            raise ValueError("pct_drawdown_cap must be > 0 (e.g., 0.10 for 10%).")
        min_prem = per_ct_loss / (inp.pct_drawdown_cap * 100.0)  # price per share
        result["pct_drawdown_cap"] = inp.pct_drawdown_cap
        result["min_entry_premium_for_cap"] = round(min_prem, 4)  # price per share
        result["min_entry_notional_for_cap"] = round(min_prem * 100.0, 2)  # $ per contract

        # If we also have an estimated premium, tell whether it meets the cap
        if inp.est_entry_premium is not None:
            result["meets_pct_cap"] = (inp.est_entry_premium >= min_prem)

    # Optional affordability gate
    if inp.max_premium_per_contract is not None and inp.est_entry_premium is not None:
        result["affordability_checked"] = True
        result["max_premium_per_contract"] = inp.max_premium_per_contract
        result["affordable"] = affordability_ok(inp, contracts)

    return result

def pretty_print(result: dict):
    print("=== Option Position Sizer ===")
    print(f"Contracts (floor)        : {result['contracts']}")
    print(f"Raw contracts            : {result['raw_contracts']:.3f}")
    # Show entry threshold for % cap
    if result.get("cap_entry_threshold_computed"):
        if "max_underlying_entry_for_cap" in result:
            print(f"Max entry (underlying)   : {result['max_underlying_entry_for_cap']}  (to keep drawdown ≤ cap)")
        if "min_underlying_entry_for_cap" in result:
            print(f"Min entry (underlying)   : {result['min_underlying_entry_for_cap']}  (to keep drawdown ≤ cap)")
        print(f"Allowed $/share risk cap : ${result['allowed_per_share_risk_for_cap']:.4f}")
        if "zone_respects_pct_cap" in result:
            print(f"Planned zone within cap? : {'YES' if result['zone_respects_pct_cap'] else 'NO'}")
    print(f"Per-contract loss @ stop : ${result['per_contract_loss_at_stop']:.2f}")
    # Percent drawdown details
    if "est_entry_premium" in result:
        print(f"Est. entry premium       : ${result['est_entry_premium']:.4f}  (~${result['est_entry_premium']*100:.2f} per contract)")
        print(f"Drawdown @ stop          : {result['pct_drawdown_at_stop']:.2f}% of premium")
    if result.get("fixed_dollar_risk") is not None:
        print(f"Risk (fixed)             : ${result['dollar_risk']:.2f}")
    else:
        print(f"Risk (% of account)      : {result['risk_pct']*100:.2f}% -> ${result['dollar_risk']:.2f}")
    print(f"Entry zone (low → high)  : {result['entry_low']} → {result['entry_high']}")
    print(f"Stop (underlying)        : {result['stop']}")
    print(f"Delta (est.)             : {result['delta']:.2f}")
    print(f"Buffer                   : {result['buffer']:.2f}")
    print(f"Per-share risk           : ${result['per_share_risk']:.4f}")
    print(f"Direction                : {result['direction'].upper()}")
    print(f"Account size             : ${result['account_size']:.2f}")

    if "pct_drawdown_cap" in result:
        cap_pct = result['pct_drawdown_cap'] * 100.0
        print(f"Max allowed drawdown     : {cap_pct:.2f}% of premium")
        print(f"Min premium to meet cap  : ${result['min_entry_premium_for_cap']:.4f}  (~${result['min_entry_notional_for_cap']:.2f}/contract)")
        if "meets_pct_cap" in result:
            print(f"Meets drawdown cap?      : {'YES' if result['meets_pct_cap'] else 'NO'}")

    if result.get("affordability_checked"):
        print(f"Affordability checked    : True")
        print(f"  Max premium/contract   : ${result['max_premium_per_contract']:.2f}")
        print(f"  Affordable?            : {'YES' if result['affordable'] else 'NO'}")

def _example():
    # Example aligned with our discussion
    inp = SizingInput(
        account_size=5000,
        risk_pct=0.015,           # 1.5% risk ($75)
        fixed_dollar_risk=None,
        direction="call",
        entry_low=210.20,
        entry_high=210.50,
        stop=209.20,
        delta=0.40,
        buffer=1.10,
        # New:
        est_entry_premium=2.50,         # $2.50 = $250/contract
        pct_drawdown_cap=0.10           # 10% cap
    )
    res = size_contracts(inp)
    pretty_print(res)

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Option Position Sizer (underlying-anchored risk).")
    parser.add_argument("--account", type=float, default=5000, help="Account size in dollars.")
    parser.add_argument("--risk-pct", type=float, default=0.02, help="Risk per trade as a fraction (e.g., 0.02 = 2%%). Ignored if --risk-fixed is set.")
    parser.add_argument("--risk-fixed", type=float, default=None, help="Fixed dollar risk per trade. If set, overrides --risk-pct.")

    parser.add_argument("--direction", choices=["call", "put"], default="call", help="Direction: call or put.")
    parser.add_argument("--entry-low", type=float, required=True, help="Entry zone low on the underlying.")
    parser.add_argument("--entry-high", type=float, required=True, help="Entry zone high on the underlying.")
    parser.add_argument("--stop", type=float, required=True, help="Underlying stop level.")

    parser.add_argument("--delta", type=float, required=True, help="Expected option delta at entry (e.g., 0.40).")
    parser.add_argument("--buffer", type=float, default=1.10, help="Buffer for gamma/vega/slippage (e.g., 1.10 = +10%%).")

    parser.add_argument("--max-premium", type=float, default=None, help="(Optional) Max premium per contract you want to allow (price per share).")
    parser.add_argument("--est-premium", type=float, default=None, help="(Optional) Estimated entry premium (price per share, e.g., 2.50 = $250/contract).")

    # New percent-cap flag
    parser.add_argument("--pct-cap", type=float, default=None, help="(Optional) Max allowed percent drawdown at stop as a fraction (e.g., 0.10 = 10%%).")

    parser.add_argument("--example", action="store_true", help="Run the built-in example.")

    args = parser.parse_args()

    if args.example:
        _example()
    else:
        sizing = SizingInput(
            account_size=args.account,
            risk_pct=None if args.risk_fixed is not None else args.risk_pct,
            fixed_dollar_risk=args.risk_fixed,
            direction=args.direction,
            entry_low=args.entry_low,
            entry_high=args.entry_high,
            stop=args.stop,
            delta=args.delta,
            buffer=args.buffer,
            max_premium_per_contract=args.max_premium,
            est_entry_premium=args.est_premium,
            pct_drawdown_cap=args.pct_cap,
        )
        result = size_contracts(sizing)
        pretty_print(result)
