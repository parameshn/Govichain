import secrets

secret_key = secrets.token_urlsafe(32)
print(f"Your SECRET_KEY: {secret_key}")