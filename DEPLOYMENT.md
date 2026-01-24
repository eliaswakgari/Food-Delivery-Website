# Deployment Guide

This guide will help you deploy your Food Delivery application to Vercel (frontend) and Render (backend).

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Render account (sign up at https://render.com)
- Push your code to a GitHub repository

## Backend Deployment (Render)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Setup for deployment"
git push origin main
```

### Step 2: Deploy on Render

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect the `render.yaml` file
5. Configure environment variables in Render Dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `GOOGLE_CALLBACK_URL`: https://YOUR-RENDER-URL.onrender.com/api/user/auth/google/callback
   - `FRONTEND_ORIGIN`: https://YOUR-VERCEL-URL.vercel.app
   - `NODE_ENV`: production
   - `PORT`: 10000

6. Click "Create Web Service"
7. Wait for deployment to complete
8. Copy your Render URL (e.g., https://your-app.onrender.com)

### Step 3: Update Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://YOUR-RENDER-URL.onrender.com/api/order/webhook`
3. Select events: `checkout.session.completed`
4. Copy the webhook signing secret and update `STRIPE_WEBHOOK_SECRET` in Render

## Frontend Deployment (Vercel)

### Step 1: Update Frontend Environment Variables

Before deploying, you need to create a production environment file or configure in Vercel:

**Environment Variables for Vercel:**
- `VITE_API_BASE_URL`: Your Render backend URL (e.g., https://your-app.onrender.com)
- `VITE_SOCKET_URL`: Your Render backend URL (e.g., https://your-app.onrender.com)
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

### Step 2: Deploy on Vercel

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables:
   - `VITE_API_BASE_URL`
   - `VITE_SOCKET_URL`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
6. Click "Deploy"
7. Wait for deployment to complete
8. Copy your Vercel URL

### Step 3: Update Backend CORS

Go back to Render and update the `FRONTEND_ORIGIN` environment variable with your Vercel URL:
- `FRONTEND_ORIGIN`: https://your-app.vercel.app

Then redeploy the backend service.

## Post-Deployment Checklist

- [ ] Backend is running on Render
- [ ] Frontend is running on Vercel
- [ ] Environment variables are set correctly on both platforms
- [ ] CORS is configured with correct frontend URL
- [ ] Google OAuth callback URL is updated in Google Console
- [ ] Stripe webhook is configured with Render URL
- [ ] Test the application end-to-end

## Troubleshooting

### Backend Issues
- Check Render logs for errors
- Verify all environment variables are set
- Ensure MongoDB connection string is correct
- Check if Render service is running

### Frontend Issues
- Check Vercel deployment logs
- Verify environment variables start with `VITE_`
- Clear browser cache and test again
- Check browser console for API connection errors

### CORS Issues
- Ensure `FRONTEND_ORIGIN` in Render matches your Vercel URL exactly
- Include protocol (https://) in the URL
- Redeploy backend after updating CORS settings

## Automatic Deployments

Both Vercel and Render support automatic deployments:
- **Vercel**: Automatically deploys on every push to main branch
- **Render**: Automatically deploys on every push to main branch

To enable:
1. Connect your GitHub repository to both platforms
2. Enable auto-deploy in settings
3. Push changes to trigger deployment

## Custom Domains (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Render
1. Go to Service Settings → Custom Domain
2. Add your custom domain
3. Update DNS records as instructed

## Support

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
