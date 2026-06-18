#!/bin/sh
set -e

# Create default admin account if the database is fresh (idempotent — safe to run every boot)
FLASK_APP=run.py flask init-admin

exec python run.py
