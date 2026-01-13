.PHONY: help artifact clean tf-init tf-plan tf-apply tf-destroy ans-deploy up down status

VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BINARY_NAME = monitor
ARTIFACT_NAME = mini-btop-web_$(VERSION)_linux_amd64.tar.gz

help:
	@echo "mini-btop Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make artifact      - Build and package application"
	@echo "  make tf-init       - Initialize Terraform"
	@echo "  make tf-plan       - Plan Terraform changes"
	@echo "  make tf-apply      - Apply Terraform and create infrastructure"
	@echo "  make tf-destroy    - Destroy infrastructure"
	@echo "  make ans-deploy    - Deploy application using Ansible"
	@echo "  make up            - Full deployment (artifact + terraform + ansible)"
	@echo "  make down          - Destroy infrastructure"
	@echo "  make status        - Check deployment status"
	@echo "  make clean         - Clean build artifacts"

# Build Go binary and create artifact
artifact:
	@echo "Building Go binary..."
	cd cmd/monitor && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o ../../$(BINARY_NAME) -ldflags "-X main.Version=$(VERSION)"
	@echo "Creating artifact..."
	@mkdir -p dist/mini-btop-web
	@cp $(BINARY_NAME) dist/mini-btop-web/
	@cp -r static dist/mini-btop-web/
	@cp -r systemd dist/mini-btop-web/
	@cp -r nginx dist/mini-btop-web/
	@cd dist && tar czf ../$(ARTIFACT_NAME) mini-btop-web/
	@rm -rf dist
	@rm -f $(BINARY_NAME)
	@echo "Artifact created: $(ARTIFACT_NAME)"

# Clean build artifacts
clean:
	@rm -f $(BINARY_NAME)
	@rm -f mini-btop-web_*.tar.gz
	@rm -rf dist

# Terraform commands
tf-init:
	@echo "Initializing Terraform..."
	cd terraform && terraform init

tf-plan: tf-init
	@echo "Planning Terraform changes..."
	cd terraform && terraform plan

tf-apply: tf-init
	@echo "Applying Terraform configuration..."
	cd terraform && terraform apply -auto-approve
	@echo "Updating Ansible inventory..."
	@echo "[mini_btop]" > ansible/hosts.ini
	@cd terraform && terraform output -raw public_ip >> ../ansible/hosts.ini
	@echo " ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/your-key.pem" >> ansible/hosts.ini
	@echo "Infrastructure created!"
	@echo "Public IP: $$(cd terraform && terraform output -raw public_ip)"

tf-destroy:
	@echo "Destroying infrastructure..."
	cd terraform && terraform destroy -auto-approve

# Ansible deployment
ans-deploy:
	@if [ ! -f "$(ARTIFACT_NAME)" ]; then \
		echo "Artifact not found. Run 'make artifact' first."; \
		exit 1; \
	fi
	@echo "Deploying with Ansible..."
	cd ansible && VERSION=$(VERSION) ansible-playbook -i hosts.ini deploy.yml

# Full deployment
up: artifact tf-apply
	@echo "Waiting for instance to be ready..."
	@sleep 30
	@$(MAKE) ans-deploy
	@echo ""
	@echo "Deployment complete!"
	@echo "Access your application at: http://$$(cd terraform && terraform output -raw public_ip)"

# Destroy everything
down: tf-destroy
	@echo "Infrastructure destroyed"

# Check status
status:
	@echo "Checking status..."
	@if [ -f "terraform/terraform.tfstate" ]; then \
		cd terraform && terraform show; \
	else \
		echo "No infrastructure found"; \
	fi
