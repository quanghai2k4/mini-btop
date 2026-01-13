{
  description = "mini-btop development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { 
          inherit system;
          config.allowUnfree = true;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Go development
            go
            gopls
            gotools
            go-tools

            # Node.js development
            nodejs_20
            nodePackages.npm
            nodePackages.pnpm

            # DevOps tools
            terraform
            ansible
            awscli2

            # Build tools
            gnumake
            git

            # Utilities
            jq
            curl
          ];

          shellHook = ''
            echo "mini-btop development environment"
            echo "Go version: $(go version)"
            echo "Node.js version: $(node --version)"
            echo "Terraform version: $(terraform version | head -n1)"
            echo "Ansible version: $(ansible --version | head -n1)"
            echo ""
            echo "Available commands:"
            echo "  make artifact   - Build release artifact"
            echo "  make tf-apply   - Create EC2 infrastructure"
            echo "  make ans-deploy - Deploy application"
            echo "  make up         - Full deployment"
            echo "  make down       - Destroy infrastructure"
          '';
        };
      }
    );
}
