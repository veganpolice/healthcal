# Setting up Environment Variables in Netlify

## Steps to Configure Your Perplexity API Key in Netlify:

### 1. Access Netlify Dashboard
- Go to [netlify.com](https://netlify.com) and sign in
- Navigate to your HealthSync AI site dashboard

### 2. Configure Environment Variables
- In your site dashboard, go to **Site settings**
- Click on **Environment variables** in the left sidebar
- Click **Add a variable**

### 3. Add Your Perplexity API Key
- **Key**: `VITE_PERPLEXITY_API_KEY`
- **Value**: Your actual Perplexity API key (get it from https://www.perplexity.ai/settings/api)
- **Scopes**: Select "All deploy contexts" or at minimum "Production"

### 4. Redeploy Your Site
After adding the environment variable, you need to trigger a new deployment:
- Go to **Deploys** tab in your Netlify dashboard
- Click **Trigger deploy** → **Deploy site**
- Or push a new commit to your repository to trigger auto-deployment

### 5. Verify the Configuration
Once redeployed, test the file upload feature:
- Upload a PDF document
- Check the browser console for any API key related messages
- The AI analysis should work instead of showing the fallback message

## Important Notes:

1. **Environment Variable Naming**: Make sure the variable name is exactly `VITE_PERPLEXITY_API_KEY` (case-sensitive)

2. **Vite Prefix**: The `VITE_` prefix is required for Vite to expose the variable to the client-side code

3. **Security**: Environment variables with the `VITE_` prefix are exposed to the client-side, so only use this for public API keys

4. **API Key**: Get your Perplexity API key from https://www.perplexity.ai/settings/api

## Alternative: Using Netlify CLI (if you have it installed)
```bash
# Set environment variable via CLI
netlify env:set VITE_PERPLEXITY_API_KEY your_api_key_here

# List all environment variables
netlify env:list
```

## Troubleshooting:
- If the variable still doesn't work, check the browser's Network tab to see if the API calls are being made
- Verify the API key is valid by testing it directly with Perplexity's API
- Check the browser console for any CORS or authentication errors