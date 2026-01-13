# mini-btop

Real-time Web System Monitor with btop-style TUI interface

## Features

- **Terminal-style UI in browser** - Box-drawing characters, ASCII bars, Unicode sparklines
- **Real-time metrics** - CPU (total + per-core), Memory, Disk, Network
- **Smooth animations** - 60fps updates with interpolation
- **btop-inspired design** - Looks like running btop in terminal
- **Server-Sent Events (SSE)** - Efficient real-time streaming
- **Lightweight** - Runs on t3.micro (1GB RAM)
- **Complete DevOps** - Nix, Terraform, Ansible

## UI Preview

```
┌─ CPU ─────────────────────────────────────────────┐
│ Total:  45.2% ████████████████░░░░░░░░░░░░░░░░░░│
│ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆          │
│ Core  0:  42.1% ████████████████░░░░░░░░░░░░    │
│ Core  1:  48.3% ██████████████████░░░░░░░░░░    │
└───────────────────────────────────────────────────┘

┌─ Memory ──────────────────────────────────────────┐
│ Used: 6.2G / 16.0G (38.8%)                       │
│ ███████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ▁▂▂▃▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂                  │
└───────────────────────────────────────────────────┘
```

## Prerequisites

- Nix with flakes enabled
- AWS account with credentials (for deployment)
- SSH key pair for EC2 access

## Quick Start

### 1. Enter development environment

```bash
nix develop --impure
```

### 2. Run locally (development)

**Option 1: Using helper script (recommended)**
```bash
./run.sh
# Press Ctrl+C to stop
```

**Option 2: Build and run binary**
```bash
go build -o monitor ./cmd/monitor
./monitor
# Press Ctrl+C to stop
```

**Option 3: Direct go run**
```bash
go run ./cmd/monitor
# Note: Ctrl+C may not work with go run
# Use build method above for proper signal handling
```

Then open browser:
```bash
open http://localhost:8080
```

You'll see a btop-style TUI interface with:
- Box-drawing characters (┌─┐│└┘)
- ASCII progress bars (░▒▓█)
- Unicode sparklines (▁▂▃▄▅▆▇█)
- Color-coded metrics (green/yellow/red)
- Real-time smooth updates

### 3. Deploy to AWS (production)

### 3. Deploy to AWS (production)

```bash
# Configure Terraform
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edit terraform.tfvars with your AWS key name

# Full deployment
make up
```

This will:
- Build the Go application
- Create artifact package
- Provision EC2 instance with Terraform
- Deploy application with Ansible

### 4. Access the application

After deployment, open:
```
http://<your-ec2-ip>
```

## Architecture

```
Browser (TUI-style) ← SSE ← Nginx ← Go Backend ← Linux /proc
```

**Why SSE instead of WebSocket?**
- Simpler for one-way data flow
- Auto-reconnect built-in
- Works better with Nginx
- Lower overhead

## Development

### Run locally

```bash
nix develop --impure
go run ./cmd/monitor
# Open http://localhost:8080
```

### Manual Makefile commands

```bash
make artifact    # Build release artifact
make tf-apply    # Create EC2 infrastructure
make ans-deploy  # Deploy application
make up          # Full deployment (all-in-one)
make down        # Destroy infrastructure
make status      # Check deployment status
```

## Tech Stack

**Backend:**
- Go 1.25+ with gopsutil for system metrics
- Server-Sent Events (SSE) for real-time streaming
- ~200-300ms update interval

**Frontend:**
- Pure HTML/CSS/JavaScript (no frameworks)
- Box-drawing characters for TUI look
- requestAnimationFrame for smooth 60fps updates
- Linear interpolation for animation

**Infrastructure:**
- Nix Flakes for reproducible dev environment
- Terraform for AWS EC2 provisioning
- Ansible for configuration management
- systemd for service management
- Nginx as reverse proxy

## Project Structure

```
mini-btop/
├── cmd/monitor/          # Go application entry point
├── internal/metrics/     # System metrics collector
├── static/
│   ├── index.html       # TUI-style interface
│   ├── css/style.css    # Terminal colors & layout
│   └── js/app.js        # SSE client & animations
├── systemd/             # systemd service file
├── nginx/               # Nginx reverse proxy config
├── terraform/           # AWS infrastructure (EC2)
├── ansible/             # Deployment automation
├── flake.nix           # Nix development environment
├── Makefile            # Build & deploy commands
└── README.md
```

## Features Breakdown

**TUI-style Elements:**
- `┌─┐│└┘` Box-drawing characters
- `░▒▓█` Block elements for bars
- `▁▂▃▄▅▆▇█` Unicode sparklines
- Terminal color scheme (GitHub Dark)
- Monospace font rendering

**Metrics Collected:**
- CPU: Total % + per-core %
- Memory: Used/Total with %
- Disk: Usage for / partition
- Network: RX/TX rates in real-time
- Load Average: 1/5/15 minute
- System Uptime

**Performance:**
- Backend collects every ~250ms
- Frontend renders at 60fps
- Smooth interpolation between values
- History graphs (60 samples)
- Optimized for low-resource systems

## Why This Stack?

**No Docker:**
- Lower overhead on t3.micro
- Direct systemd management
- Faster cold starts

**Pure JS (no React/Vue):**
- Minimal bundle size (~10KB)
- Lower memory footprint
- Faster page load
- Direct DOM manipulation for TUI rendering

**SSE over WebSocket:**
- Unidirectional data flow
- Built-in reconnection
- Better Nginx compatibility
- Simpler implementation

## License

MIT
