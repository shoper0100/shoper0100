# Vercel Deployment Guide - FiveDollarBNB Frontend

## Prerequisites
- GitHub repository: https://github.com/shoper0100/shoper0100
- Vercel account: https://vercel.com
- Deployed smart contracts on BSC Mainnet (Main + Royalty)

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign in with your GitHub account

2. **Import Repository**
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose: `shoper0100/shoper0100`

3. **Configure Project**
   ```
   Framework Preset: Next.js
   Root Directory: webapp
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Set Environment Variables**
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS = [Your FiveDollarBNB Contract Address]
   NEXT_PUBLIC_ROYALTY_ADDRESS = [Your Royalty Contract Address]
   NEXT_PUBLIC_CHAIN_ID = 56
   NEXT_PUBLIC_RPC_URL = https://bsc-dataseed1.binance.org
   NEXT_PUBLIC_EXPLORER_URL = https://bscscan.com
   NEXT_PUBLIC_DEFAULT_REFER = 36999
   NEXT_PUBLIC_NETWORK_NAME = BSC Mainnet
   NEXT_PUBLIC_PLATFORM_NAME = FiveDollarBNB
   NEXT_PUBLIC_DOMAIN = fivedollar.bnb
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at: `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Root Directory**
   ```bash
   cd f:\ridebnb
   vercel
   ```

4. **Follow Prompts**
   ```
   ? Set up and deploy "f:\ridebnb"? [Y/n] y
   ? Which scope? [Your Vercel Account]
   ? Link to existing project? [N/y] n
   ? What's your project's name? fivedollarbnb
   ? In which directory is your code located? webapp
   ```

5. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
   vercel env add NEXT_PUBLIC_ROYALTY_ADDRESS
   vercel env add NEXT_PUBLIC_CHAIN_ID
   vercel env add NEXT_PUBLIC_RPC_URL
   vercel env add NEXT_PUBLIC_EXPLORER_URL
   vercel env add NEXT_PUBLIC_DEFAULT_REFER
   vercel env add NEXT_PUBLIC_NETWORK_NAME
   vercel env add NEXT_PUBLIC_PLATFORM_NAME
   vercel env add NEXT_PUBLIC_DOMAIN
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Environment Variables Reference

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Your contract address | Main FiveDollarBNB contract on BSC |
| `NEXT_PUBLIC_ROYALTY_ADDRESS` | Your royalty address | Royalty pool contract on BSC |
| `NEXT_PUBLIC_CHAIN_ID` | `56` | BSC Mainnet Chain ID |
| `NEXT_PUBLIC_RPC_URL` | `https://bsc-dataseed1.binance.org` | BSC RPC endpoint |
| `NEXT_PUBLIC_EXPLORER_URL` | `https://bscscan.com` | Block explorer |
| `NEXT_PUBLIC_DEFAULT_REFER` | `36999` | Default referrer ID |
| `NEXT_PUBLIC_NETWORK_NAME` | `BSC Mainnet` | Network display name |
| `NEXT_PUBLIC_PLATFORM_NAME` | `FiveDollarBNB` | Platform branding |
| `NEXT_PUBLIC_DOMAIN` | `fivedollar.bnb` | Platform domain |

## Project Structure

```
ridebnb/
├── webapp/              # Next.js frontend application
│   ├── app/            # App router pages
│   ├── components/     # React components
│   ├── lib/            # Utilities and contracts
│   ├── public/         # Static assets
│   └── package.json
├── contracts/          # Smart contracts (not deployed)
├── presentations/      # Marketing images (not deployed)
├── scripts/            # Deployment scripts (not deployed)
└── vercel.json         # Vercel configuration
```

## Vercel Configuration

The `vercel.json` file at the root configures Vercel to:
- Build from the `webapp` directory
- Use Next.js framework
- Run `npm install` and `npm run build` in webapp folder

## Post-Deployment

After successful deployment:

1. **Get Deployment URL**
   - Your app will be at: `https://your-project-name.vercel.app`
   - Example: `https://fivedollarbnb.vercel.app`

2. **Update Contract Addresses**
   - Deploy your smart contracts first
   - Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in Vercel dashboard
   - Update `NEXT_PUBLIC_ROYALTY_ADDRESS` in Vercel dashboard
   - Redeploy to apply changes

3. **Custom Domain (Optional)**
   - Go to Vercel Dashboard → Project Settings → Domains
   - Add your custom domain (e.g., fivedollar.bnb via DNS provider)
   - Update DNS records as instructed

4. **Test Your Deployment**
   - Visit your Vercel URL
   - Connect MetaMask
   - Verify BSC Mainnet connection
   - Test registration and upgrade flows
   - Test royalty claims

## Automatic Deployments

Once connected to GitHub:
- **Production:** Push to `master` branch → Auto-deploy to production
- **Preview:** Push to any branch → Auto-deploy preview URL
- **Pull Requests:** Each PR gets a unique preview URL

## Monitoring & Analytics

Access from Vercel Dashboard:
- **Analytics:** Page views, performance metrics
- **Logs:** Real-time function logs  
- **Performance:** Web vitals and speed insights

## Troubleshooting

### Build Fails
```bash
# Check build locally first
cd webapp
npm install
npm run build
```

### Environment Variables Not Working
- Ensure all `NEXT_PUBLIC_*` variables are set
- Redeploy after adding new variables
- Check Vercel Dashboard → Settings → Environment Variables

### Wrong Network
- Verify `NEXT_PUBLIC_CHAIN_ID` is `56`
- Verify `NEXT_PUBLIC_RPC_URL` is BSC RPC

### Contract Not Found
- Ensure `NEXT_PUBLIC_CONTRACT_ADDRESS` is correct
- Ensure `NEXT_PUBLIC_ROYALTY_ADDRESS` is correct
- Verify contracts are deployed on BSC Mainnet
- Check BSCScan for contract addresses

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Project Repo:** https://github.com/shoper0100/shoper0100
- **Project Docs:** See CONTRACT_DOCUMENTATION.md, PRESENTATION.md

## Summary

✅ **Repository:** Ready for Vercel deployment
✅ **Framework:** Next.js 15 with TypeScript
✅ **Network:** BSC Mainnet (Chain ID: 56)
✅ **Platform:** FiveDollarBNB (fivedollar.bnb)
✅ **Deploy Time:** ~2-3 minutes
✅ **URL:** https://[your-project].vercel.app

Your FiveDollarBNB frontend is now ready to deploy to Vercel! 🚀
