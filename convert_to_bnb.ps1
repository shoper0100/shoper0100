# This PowerShell script converts FiveDollarRide to BNB version
# Run from f:\ridebnb directory

$file = "f:\ridebnb\contracts\FiveDollarRide_BNB.sol"
$content = Get-Content $file -Raw

# 1. Update contract name and header
$content = $content -replace 'contract FiveDollarRide \{', 'contract FiveDollarRide_BNB {'
$content = $content -replace '@title FiveDollarRide - The \$5 Opportunity Platform', '@title FiveDollarRide_BNB - Native BNB Version'
$content = $content -replace 'USDT-based payments only', 'Native BNB payments (no approval needed!)'

# 2. Replace IERC20 interface with Chainlink
$old_interface = 'interface IERC20 \{[\s\S]*?\}'
$new_interface = @'
interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}
'@
$content = $content -creplace $old_interface, $new_interface

#Save
$content | Set-Content $file -NoNewline

Write-Output "Phase 1 complete - Basic replacements done"
