# mini-btop

Real-time web-based system monitor inspired by btop.

![Dashboard Preview](https://img.shields.io/badge/status-online-brightgreen) ![Go](https://img.shields.io/badge/Go-1.25-00ADD8) ![React](https://img.shields.io/badge/React-18-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

## Features

- **Real-time metrics** - CPU, Memory, Disk, Network with live updates
- **Modern dark UI** - Vercel/Linear inspired dashboard design
- **SSE streaming** - Efficient Server-Sent Events for real-time data
- **Deployment terminal** - CRT-style deployment log with scanline effect
- **Lightweight** - Runs on t3.micro (1GB RAM)
- **Complete DevOps** - Nix Flakes, Terraform, Ansible, systemd

## Tech Stack

**Backend:**
- Go + gopsutil for system metrics
- Server-Sent Events (SSE)

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS + Shadcn UI
- Recharts for sparkline graphs

**Infrastructure:**
- Nix Flakes (reproducible dev environment)
- Terraform (AWS EC2)
- Ansible (configuration management)
- Nginx (reverse proxy)
- systemd (service management)

## Quick Start

### Prerequisites

- Nix with flakes enabled
- AWS account (for deployment)

### Development

```bash
# Enter dev environment
nix develop

# Install frontend dependencies
cd frontend && npm install && cd ..

# Build frontend
cd frontend && npm run build && cd ..

# Run server
go build -o monitor ./cmd/monitor
./monitor
```

Open http://localhost:8080

### Production Deployment

```bash
# Configure Terraform
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edit with your AWS key name

# Full deployment
make up
```

## Project Structure

```
mini-btop/
├── cmd/monitor/              # Go server entry point
├── internal/metrics/         # System metrics collector
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main dashboard
│   │   ├── components/
│   │   │   ├── MetricCard.tsx        # Stat card with chart
│   │   │   ├── DeploymentStatus.tsx  # Terminal log panel
│   │   │   └── ui/                   # Shadcn components
│   │   ├── hooks/useSystemMetrics.ts
│   │   └── types/metrics.ts
│   └── package.json
├── static/                   # Built frontend (gitignored)
├── terraform/                # AWS EC2 infrastructure
├── ansible/                  # Deployment playbooks
├── nginx/                    # Nginx config
├── systemd/                  # Service file
├── flake.nix                 # Nix dev environment
└── Makefile
```

## Makefile Commands

```bash
make artifact    # Build release artifact
make tf-apply    # Create EC2 infrastructure
make ans-deploy  # Deploy application
make up          # Full deployment
make down        # Destroy infrastructure
```

## Metrics Collected

| Metric | Description |
|--------|-------------|
| CPU | Total usage percentage |
| Memory | Used / Total with percentage |
| Disk | Root partition usage |
| Network | RX/TX rates with sparkline |
| Uptime | System uptime |
| Load Average | 1/5/15 minute |

## License

MIT
