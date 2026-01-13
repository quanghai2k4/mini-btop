.PHONY: help artifact clean setup-key clean-key tf-init tf-plan tf-apply tf-destroy ans-deploy up down status

VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
KEY_NAME ?= mini-btop
KEY_PATH = $(HOME)/.ssh/$(KEY_NAME)
BINARY_NAME = monitor
ARTIFACT_NAME = mini-btop-web_$(VERSION)_linux_amd64.tar.gz

help:
	@echo "mini-btop Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make up              - Full deployment (key + artifact + terraform + ansible)"
	@echo "  make down            - Destroy infrastructure"
	@echo "  make status          - Check deployment status"
	@echo ""
	@echo "  make setup-key       - Create and upload SSH key to AWS"
	@echo "  make clean-key       - Delete SSH key from AWS"
	@echo "  make artifact        - Build and package application"
	@echo "  make tf-apply        - Apply Terraform and create infrastructure"
	@echo "  make ans-deploy      - Deploy application using Ansible"
	@echo ""
	@echo "Options:"
	@echo "  KEY_NAME=name        - SSH key name (default: mini-btop)"
	@echo ""
	@echo "Examples:"
	@echo "  make up                           # Deploy with default key"
	@echo "  make up KEY_NAME=mini-btop-work   # Deploy with custom key"
	@echo "  make clean-key KEY_NAME=mini-btop # Delete specific key"

# SSH Key management
setup-key:
	@chmod +x scripts/setup-key.sh
	@./scripts/setup-key.sh $(KEY_NAME)

clean-key:
	@chmod +x scripts/clean-key.sh
	@./scripts/clean-key.sh $(KEY_NAME)

# Build Go binary and create artifact
artifact:
	@echo "==> Building frontend..."
	cd frontend && npm install && npm run build
	@echo "==> Building Go binary..."
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o $(BINARY_NAME) -ldflags "-X main.Version=$(VERSION)" ./cmd/monitor
	@echo "==> Creating artifact..."
	@mkdir -p dist/mini-btop-web
	@cp $(BINARY_NAME) dist/mini-btop-web/
	@cp -r static dist/mini-btop-web/
	@cp -r systemd dist/mini-btop-web/
	@cp -r nginx dist/mini-btop-web/
	@cd dist && tar czf ../$(ARTIFACT_NAME) mini-btop-web/
	@rm -rf dist
	@rm -f $(BINARY_NAME)
	@echo "==> Artifact created: $(ARTIFACT_NAME)"

# Clean build artifacts
clean:
	@rm -f $(BINARY_NAME)
	@rm -f mini-btop-web_*.tar.gz
	@rm -rf dist

# Terraform commands
tf-init:
	@echo "==> Initializing Terraform..."
	cd terraform && terraform init

tf-plan: tf-init
	@echo "==> Planning Terraform changes..."
	cd terraform && terraform plan -var="key_name=$(KEY_NAME)"

tf-apply: tf-init
	@echo "==> Applying Terraform configuration..."
	cd terraform && terraform apply -var="key_name=$(KEY_NAME)" -auto-approve
	@echo "==> Updating Ansible inventory..."
	@echo "[mini_btop]" > ansible/hosts.ini
	@cd terraform && terraform output -raw public_ip >> ../ansible/hosts.ini
	@echo " ansible_user=ubuntu ansible_ssh_private_key_file=$(KEY_PATH)" >> ansible/hosts.ini
	@echo ""
	@echo "==> Infrastructure created!"
	@echo "    Public IP: $$(cd terraform && terraform output -raw public_ip)"

tf-destroy:
	@echo "==> Destroying infrastructure..."
	cd terraform && terraform destroy -var="key_name=$(KEY_NAME)" -auto-approve

# Ansible deployment
ans-deploy:
	@if [ ! -f "$(ARTIFACT_NAME)" ]; then \
		echo "Error: Artifact not found. Run 'make artifact' first."; \
		exit 1; \
	fi
	@if [ ! -f "$(KEY_PATH)" ]; then \
		echo "Error: SSH key not found at $(KEY_PATH). Run 'make setup-key' first."; \
		exit 1; \
	fi
	@echo "==> Deploying with Ansible..."
	cd ansible && ANSIBLE_HOST_KEY_CHECKING=False VERSION=$(VERSION) ansible-playbook -i hosts.ini deploy.yml --private-key=$(KEY_PATH)

# Full deployment
up: setup-key artifact tf-apply
	@echo "==> Waiting for instance to be ready (30s)..."
	@sleep 30
	@$(MAKE) ans-deploy KEY_NAME=$(KEY_NAME)
	@echo ""
	@echo "=========================================="
	@echo "  Deployment complete!"
	@echo "  URL: http://$$(cd terraform && terraform output -raw public_ip)"
	@echo "=========================================="

# Destroy everything
down: tf-destroy
	@echo "==> Infrastructure destroyed"

# Check status
status:
	@echo "==> Checking status..."
	@if [ -f "terraform/terraform.tfstate" ]; then \
		echo ""; \
		echo "Infrastructure:"; \
		cd terraform && terraform output 2>/dev/null || echo "  No outputs"; \
		echo ""; \
		echo "SSH Key: $(KEY_NAME)"; \
		if [ -f "$(KEY_PATH)" ]; then \
			echo "  Local: $(KEY_PATH) (exists)"; \
		else \
			echo "  Local: $(KEY_PATH) (not found)"; \
		fi; \
		if aws ec2 describe-key-pairs --key-names "$(KEY_NAME)" &>/dev/null; then \
			echo "  AWS: $(KEY_NAME) (exists)"; \
		else \
			echo "  AWS: $(KEY_NAME) (not found)"; \
		fi; \
	else \
		echo "No infrastructure found"; \
	fi
