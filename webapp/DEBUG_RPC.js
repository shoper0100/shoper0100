// DEBUG: RPC Configuration Test
// Add this temporarily to income/page.tsx to debug

console.log('=== RPC DEBUG INFO ===');
console.log('NEXT_PUBLIC_RPC_URL:', process.env.NEXT_PUBLIC_RPC_URL);
console.log('NEXT_PUBLIC_CONTRACT_ADDRESS:', process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
console.log('All env vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')));
console.log('======================');

// This will show you:
// 1. If the env var is being read
// 2. What value it has
// 3. All other NEXT_PUBLIC_ vars available

// TO USE:
// 1. Add these console.logs to the top of loadTreeData() function
// 2. Refresh the page
// 3. Check browser console for output
// 4. Send me the output so I can debug
