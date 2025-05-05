# Deploying TerraBuild Backend to Fly.io

This guide walks through the steps to deploy the TerraBuild backend API to Fly.io.

## Prerequisites

1. [Fly.io account](https://fly.io/app/sign-up)
2. [Fly CLI installed](https://fly.io/docs/hands-on/install-flyctl/)
3. Authenticated with Fly.io (`flyctl auth login`)
4. TerraBuild repository cloned locally

## Configuration

The repository includes a `fly.toml` file with the basic configuration. You may need to customize it for your specific deployment.

### Environment Variables

Set up the required environment variables for your deployment:

```bash
flyctl secrets set ENVIRONMENT=production
flyctl secrets set DATABASE_URL=your_database_connection_string
flyctl secrets set PORT=5001
```

You can use Fly's Postgres database service or connect to an external database.

### Database Setup

If you want to use Fly's Postgres database:

1. Create a Postgres database:

```bash
flyctl postgres create --name terrabuild-db
```

2. Attach the database to your app:

```bash
flyctl postgres attach --app terrabuild-api terrabuild-db
```

This will automatically set the `DATABASE_URL` environment variable.

## Deployment Steps

1. Navigate to the backend directory:

```bash
cd backend
```

2. Initialize a new Fly.io app (if not done already):

```bash
flyctl launch --no-deploy
```

3. This will create or update the `fly.toml` file. Review the file to ensure it's correctly configured.

4. Deploy the application:

```bash
flyctl deploy
```

5. Check the deployment status:

```bash
flyctl status
```

## Accessing the Deployed API

Once deployed, you can access your API at:

```
https://your-app-name.fly.dev
```

The API will be available at paths like:

```
https://your-app-name.fly.dev/api/health
https://your-app-name.fly.dev/api/sessions
```

## Continuous Deployment

For continuous deployment, you can set up a GitHub Actions workflow:

1. Create a Fly API token:

```bash
flyctl auth token
```

2. Add this token as a secret in your GitHub repository settings with the name `FLY_API_TOKEN`.

3. Set up a GitHub Actions workflow file (e.g., `.github/workflows/fly-deploy.yml`):

```yaml
name: Deploy to Fly.io
on:
  push:
    branches:
      - main
jobs:
  deploy:
    name: Deploy backend to Fly.io
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: cd backend && flyctl deploy
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

## Monitoring and Logs

Monitor your deployment and view logs using the Fly.io CLI:

```bash
# View logs
flyctl logs

# Monitor app health
flyctl status
```

## Scaling

Scale your API as needed:

```bash
# Scale to 2 instances
flyctl scale count 2
```

## Troubleshooting

- **Deployment Failures**: Check your logs with `flyctl logs` for specific error details.
- **Database Connection Issues**: Verify your `DATABASE_URL` is set correctly with `flyctl secrets list`.
- **Performance Problems**: Consider scaling up with `flyctl scale vm` to increase resources.
- **Connection Timeouts**: Check if your application is listening on the correct port (should match PORT env var).

## Rolling Back

If you need to roll back to a previous deployment:

```bash
flyctl releases
flyctl deploy --release-command=<release-id>
```