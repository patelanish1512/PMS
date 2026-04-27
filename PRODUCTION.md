# Production Notes

## Required Backend Configuration

Set these values with environment variables, user secrets, or a secure deployment secret store:

```powershell
MongoDb__ConnectionString=<mongodb connection string>
MongoDb__DatabaseName=ProgressMonitoringSystem
Jwt__Key=<minimum 32 character secret>
Jwt__Issuer=ProgressMonitoringApi
Jwt__Audience=ProgressMonitoringClient
Cors__AllowedOrigins__0=https://your-frontend-domain.example
SeedData__Enabled=false
```

Never deploy with demo credentials or enable seed data in production unless you are provisioning a controlled staging environment.

## Local Development

The checked-in development defaults expect MongoDB on `mongodb://localhost:27017`, backend on `http://localhost:5203`, and Vite on `http://127.0.0.1:5173`.

```powershell
dotnet run --project .\ProgressMonitoringBackend\ProgressMonitoringBackend --launch-profile http
cd .\ProgressMonitoringWebApp
npm run dev -- --host 127.0.0.1
```

## Verification

Run these before release:

```powershell
dotnet build .\ProgressMonitoringBackend
cd .\ProgressMonitoringWebApp
npm run lint
npm run build
```
