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
- Server-Sent Events (SSE) with Hub broadcast pattern

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

- [Nix](https://nixos.org/download.html) with flakes enabled
- AWS account with credentials

### Local Development

```bash
# Enter dev environment
nix develop

# Install frontend dependencies & build
cd frontend && npm install && npm run build && cd ..

# Run server
go build -o monitor ./cmd/monitor
./monitor
```

Open http://localhost:8080

## Deploy to AWS EC2

### Step 1: Clone and enter environment

```bash
git clone https://github.com/quanghai2k4/mini-btop.git
cd mini-btop
nix develop
```

### Step 2: Configure AWS

```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Region (e.g., ap-southeast-1)
```

### Step 3: Deploy

```bash
make up
```

This will automatically:
1. Create SSH key and upload to AWS
2. Build Go binary and frontend
3. Create EC2 instance with Terraform
4. Deploy application with Ansible

After deployment:
```
==========================================
  Deployment complete!
  URL: http://13.xxx.xxx.xxx
==========================================
```

### Custom SSH Key Name

When deploying from multiple machines to the same AWS account, use different key names:

```bash
make up KEY_NAME=mini-btop-laptop
make up KEY_NAME=mini-btop-work
```

### Destroy Infrastructure

```bash
make down
```

### Delete SSH Key

```bash
make clean-key                      # Delete default key
make clean-key KEY_NAME=mini-btop   # Delete specific key
```

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make up` | Full deployment (key + build + terraform + ansible) |
| `make down` | Destroy EC2 infrastructure |
| `make status` | Check deployment and key status |
| `make setup-key` | Create and upload SSH key to AWS |
| `make clean-key` | Delete SSH key from AWS |
| `make artifact` | Build release package |
| `make tf-apply` | Create infrastructure only |
| `make ans-deploy` | Deploy application only |

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `KEY_NAME` | `mini-btop` | SSH key pair name |

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
│   │   │   ├── NetworkChart.tsx      # Lazy-loaded sparkline
│   │   │   ├── DeploymentStatus.tsx  # Terminal log panel
│   │   │   └── ui/                   # Shadcn components
│   │   ├── hooks/useSystemMetrics.ts
│   │   └── types/metrics.ts
│   └── package.json
├── scripts/
│   ├── setup-key.sh          # SSH key setup script
│   └── clean-key.sh          # SSH key cleanup script
├── terraform/                # AWS EC2 infrastructure
├── ansible/                  # Deployment playbooks
├── nginx/                    # Nginx config
├── systemd/                  # Service file
├── flake.nix                 # Nix dev environment
└── Makefile
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

## Troubleshooting

### SSH into EC2

```bash
ssh -i ~/.ssh/mini-btop ubuntu@<public-ip>
```

### Check service status

```bash
sudo systemctl status mini-btop
sudo journalctl -u mini-btop -f
```

### Key mismatch error

If deploying from a new machine but AWS key already exists:

```bash
# Option 1: Use different key name
make up KEY_NAME=mini-btop-newmachine

# Option 2: Delete old key and recreate
make clean-key
make up
```

## Cost Estimate

| Resource | Cost |
|----------|------|
| EC2 t3.micro | ~$8.5/month (or free tier) |
| EBS 8GB | ~$0.8/month |
| **Total** | **~$9.3/month** |

## License

MIT
