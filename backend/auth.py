"""Firebase ID token verification.

The frontend signs in with Google through Firebase and sends the resulting ID
token on every API call. Firebase ID tokens are RS256 JWTs signed by Google, so
they can be verified against Google's public keys without any service-account
credentials on this server - only the (public) project id is needed.

Domain restriction lives here as well as in the frontend. The frontend copy
decides what the user sees; this one decides what the API will answer.
"""
import os

import jwt
from jwt import PyJWKClient

FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "dashboard-edelvives")

ALLOWED_DOMAINS = tuple(
    domain.strip().lower()
    for domain in os.environ.get(
        "ALLOWED_EMAIL_DOMAINS", "edelvives.es,fundacionedelvives.org"
    ).split(",")
    if domain.strip()
)

# Google's public keys for Firebase ID tokens, in JWK form.
JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
ISSUER = f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}"

_jwk_client = None


class AuthError(Exception):
    """Raised when a request cannot be authenticated."""

    def __init__(self, detail):
        super().__init__(detail)
        self.detail = detail


def _client():
    """The JWKS client, created lazily so import never does network I/O."""
    global _jwk_client
    if _jwk_client is None:
        _jwk_client = PyJWKClient(JWKS_URL)
    return _jwk_client


def _email_allowed(email):
    return any(email.endswith(f"@{domain}") for domain in ALLOWED_DOMAINS)


def verify_bearer_token(header_value):
    """Verify an `Authorization: Bearer <token>` header.

    Returns the token claims. Raises AuthError for anything not verifiably a
    current Firebase ID token from an allowed domain - including any failure to
    reach Google, so a network problem denies access rather than granting it.
    """
    if not header_value or not header_value.lower().startswith("bearer "):
        raise AuthError("Missing bearer token")

    token = header_value.split(" ", 1)[1].strip()
    if not token:
        raise AuthError("Missing bearer token")

    try:
        signing_key = _client().get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=ISSUER,
        )
    except Exception as exc:
        raise AuthError(f"Invalid token: {exc}")

    if not claims.get("sub"):
        raise AuthError("Token has no subject")

    if not claims.get("email_verified", False):
        raise AuthError("Email not verified")

    email = (claims.get("email") or "").lower()
    if not _email_allowed(email):
        raise AuthError("Email domain not allowed")

    return claims
