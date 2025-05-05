# Deploying TerraBuild Frontend to Vercel

This guide walks through the process of deploying the TerraBuild frontend application to Vercel.

## Prerequisites

1. [Vercel account](https://vercel.com/signup)
2. [Vercel CLI installed](https://vercel.com/download) (optional, for command-line deployments)
3. GitHub repository with your TerraBuild code
4. Backend API already deployed (e.g., on Fly.io)

## Configuration

The repository includes a `vercel.json` file with the necessary configuration for deployment. You may need to customize it based on your specific needs.

### Environment Variables

Set up the required environment variables in your Vercel project:

1. Go to your project settings in the Vercel dashboard
2. Navigate to the "Environment Variables" tab
3. Add the following variables:

```
REACT_APP_API_URL=https://your-backend-api.fly.dev
REACT_APP_JURISDICTION=Benton County, WA
REACT_APP_REGION=Eastern Washington
```

Make sure to update `REACT_APP_API_URL` to point to your deployed backend API.

## Deployment Methods

### Option 1: Vercel Git Integration (Recommended)

1. Connect your GitHub/GitLab/Bitbucket account to Vercel
2. Import your TerraBuild repository
3. Configure the project:
   - Set the framework preset to "Create React App" or "Vite"
   - Set the root directory to `frontend` if your repository has a monorepo structure
   - Configure build settings if necessary:
     - Build command: `npm run build`
     - Output directory: `build` or `dist`
4. Set your environment variables
5. Click "Deploy"

### Option 2: Vercel CLI Deployment

1. Navigate to your frontend directory:

```bash
cd frontend
```

2. Log in to Vercel:

```bash
vercel login
```

3. Deploy the application:

```bash
vercel
```

4. Follow the interactive prompts to configure your project
5. For production deployment:

```bash
vercel --prod
```

## Continuous Deployment

When using the Git integration, Vercel automatically sets up continuous deployment:

- Each push to the main branch will deploy to production
- Pull requests create preview deployments

To customize this behavior, you can:

1. Go to your project settings in the Vercel dashboard
2. Navigate to the "Git" tab
3. Configure production branch and preview configurations

## Custom Domain Setup

To set up a custom domain for your TerraBuild deployment:

1. Go to your project in the Vercel dashboard
2. Navigate to the "Domains" tab
3. Add your domain
4. Follow the instructions to configure DNS settings
5. Wait for DNS propagation and SSL certificate issuance

## Troubleshooting

- **Build Failures**: Check the build logs in the Vercel dashboard for specific errors
- **API Connection Issues**: Verify your `REACT_APP_API_URL` is correct and accessible
- **Environment Variable Problems**: Make sure variables are properly set and have the correct format
- **Routing Issues**: Check your `vercel.json` configuration for correct route handling

## API Proxying

The included `vercel.json` already contains configuration to proxy API requests to your backend. This is defined in the "routes" section:

```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "https://your-backend-api.fly.dev/api/$1"
  },
  ...
]
```

Make sure to update the destination URL to match your actual backend API.

## Rollbacks

To roll back to a previous deployment:

1. Go to your project in the Vercel dashboard
2. Navigate to the "Deployments" tab
3. Find the deployment you want to roll back to
4. Click the three-dot menu and select "Promote to Production"

## Best Practices

1. Use environment variables for all configuration
2. Take advantage of preview deployments for testing changes
3. Set up GitHub Actions or other CI tools to run tests before deployment
4. Monitor your application's performance with Vercel Analytics
5. Use Vercel's Edge Network for improved global performance