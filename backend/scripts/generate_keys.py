#!/usr/bin/env python3
"""Generate all required secret keys for .env file."""
import secrets

from cryptography.fernet import Fernet


def main():
    print("# Generated secret keys for .env file\n")
    print(f"JWT_SECRET_KEY={secrets.token_hex(32)}")
    print(f"JWT_REFRESH_SECRET_KEY={secrets.token_hex(32)}")
    print(f"HMAC_SECRET_KEY={secrets.token_hex(32)}")
    print(f"CSRF_SECRET_KEY={secrets.token_hex(32)}")
    print(f"JITSI_JWT_SECRET={secrets.token_hex(32)}")
    print(f"FERNET_ENCRYPTION_KEY={Fernet.generate_key().decode()}")
    print(f"MINIO_SECRET_KEY={secrets.token_hex(16)}")


if __name__ == "__main__":
    main()
