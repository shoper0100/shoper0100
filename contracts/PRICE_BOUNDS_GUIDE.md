# FiveDollarRide BNB - Price Bounds Management

## ✅ Feature: Adjustable Price Bounds

Admin can now update the BNB price bounds to adapt to market conditions.

### Default Values:
- **Minimum**: $100 (100e8)
- **Maximum**: $10,000 (10000e8)

### Admin Function:

```solidity
function setPriceBounds(uint _minPrice, uint _maxPrice) external onlyOwner
```

**Parameters:**
- `_minPrice`: Minimum BNB price in 8 decimals (e.g., 100e8 = $100)
- `_maxPrice`: Maximum BNB price in 8 decimals (e.g., 10000e8 = $10,000)

**Validation:**
- Min must be > 0
- Max must exceed min
- Min must be >= $10 (10e8)
- Max must be <= $100,000 (100000e8)

**Event Emitted:**
```solidity
event PriceBoundsUpdated(uint newMin, uint newMax, uint timestamp);
```

### Usage on BSCScan:

**1. Check Current Bounds:**
```
Read Contract → minBNBPrice
Read Contract → maxBNBPrice
```

**2. Update Bounds (Owner Only):**
```
Write Contract → setPriceBounds
_minPrice: 50000000000 (for $500)
_maxPrice: 2000000000000 (for $20,000)
```

### Example Scenarios:

**Scenario 1: BNB Price Surge**
If BNB goes above $10,000:
```solidity
setPriceBounds(100e8, 50000e8) // $100 - $50,000
```

**Scenario 2: Market Crash**
If BNB drops below $100:
```solidity
setPriceBounds(10e8, 10000e8) // $10 - $10,000
```

**Scenario 3: Tighten Security**
For more restrictive validation:
```solidity
setPriceBounds(200e8, 5000e8) // $200 - $5,000
```

### Security Features:
- ✅ Only owner can update
- ✅ Validates reasonable bounds
- ✅ Event logged for transparency
- ✅ Cannot set invalid ranges

### Gas Cost:
~45,000 gas to update bounds
