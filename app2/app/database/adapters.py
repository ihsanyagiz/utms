from pathlib import Path
import shutil

from flask import current_app
from sqlalchemy.exc import IntegrityError

from .. import db
from ..models import UserORM

from .interfaces import DatabaseControlInterface, DatabaseInterface, UserDataInterface


class SQLAlchemyDatabaseAdapter(DatabaseInterface, DatabaseControlInterface):
    def __init__(self):
        self.connected = False

    def execute_query(self, action_name, payload=None):
        payload = payload or {}

        if action_name == 'find_user_by_email_role':
            return UserORM.query.filter_by(
                email=payload['email'],
                role=payload['role'],
            ).first()

        if action_name == 'find_user_by_id':
            return db.session.get(UserORM, payload['user_id'])

        if action_name == 'create_user':
            if payload.get('check_user_validity', True):
                existing_user = UserORM.query.filter_by(
                    email=payload['email'],
                    role=payload['role'],
                ).first()
                if existing_user:
                    return None

            user = UserORM(email=payload['email'], role=payload['role'])
            user.set_password(payload['password'])
            try:
                db.session.add(user)
                db.session.commit()
                return user
            except IntegrityError:
                db.session.rollback()
                return None

        if action_name == 'list_all_users':
            return UserORM.query.order_by(UserORM.role, UserORM.email).all()

        if action_name == 'update_user_role':
            user = db.session.get(UserORM, payload['user_id'])
            if not user:
                return None
            user.role = payload['new_role']
            try:
                db.session.commit()
                return user
            except Exception:
                db.session.rollback()
                return None

        raise ValueError(f'Unknown database action: {action_name}')

    def safe_execute(self, action_name, payload=None):
        allowed_actions = {
            'find_user_by_email_role',
            'find_user_by_id',
            'create_user',
            'list_all_users',
            'update_user_role',
        }
        if action_name not in allowed_actions:
            raise PermissionError(f'Action not allowed: {action_name}')
        return self.execute_query(action_name=action_name, payload=payload)

    def connect(self):
        self.connected = True

    def disconnect(self):
        if db.session.is_active:
            db.session.remove()
        self.connected = False

    def _db_source(self):
        """Return (source_path, backups_dir) for the SQLite database, or (None, None)."""
        database_uri = current_app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if not database_uri.startswith('sqlite:///'):
            return None, None
        db_relative = database_uri.removeprefix('sqlite:///')
        instance_path = Path(current_app.instance_path)
        source = instance_path / db_relative
        backups_dir = instance_path / 'backups'
        return source, backups_dir

    def backup(self):
        from datetime import datetime as dt
        source, backups_dir = self._db_source()
        if source is None or not source.exists():
            return None
        backups_dir.mkdir(parents=True, exist_ok=True)
        stamp = dt.utcnow().strftime('%Y%m%d_%H%M%S')
        dest = backups_dir / f"{source.stem}_{stamp}.bak"
        shutil.copy2(source, dest)
        return str(dest)

    def list_backups(self):
        """Return backup metadata sorted newest-first."""
        from datetime import datetime as dt
        _, backups_dir = self._db_source()
        if backups_dir is None or not backups_dir.exists():
            return []
        entries = []
        for p in sorted(backups_dir.glob('*.bak'), reverse=True):
            entries.append({
                'filename': p.name,
                'created_at': dt.utcfromtimestamp(p.stat().st_mtime),
                'size_kb': round(p.stat().st_size / 1024, 1),
            })
        return entries

    def restore_backup(self, filename: str):
        """Replace the live database with a backup. Disposes engine so connections refresh."""
        source, backups_dir = self._db_source()
        if source is None:
            return None
        # Guard against path traversal — only bare filenames allowed
        if '/' in filename or '\\' in filename or not filename.endswith('.bak'):
            raise ValueError('Invalid backup filename.')
        backup_path = backups_dir / filename
        if not backup_path.exists():
            raise FileNotFoundError(f'Backup not found: {filename}')
        # Release all pooled connections before swapping the file
        db.engine.dispose()
        shutil.copy2(backup_path, source)
        return str(source)


class SQLAlchemyUserDataService(UserDataInterface):
    def __init__(self, database_adapter):
        self.database_adapter = database_adapter

    def find_by_email_role(self, email, role):
        return self.database_adapter.safe_execute(
            'find_user_by_email_role',
            {'email': email, 'role': role},
        )

    def find_by_email_and_role(self, email: str, role: str):
        return self.database_adapter.safe_execute(
            'find_user_by_email_role',
            {'email': email, 'role': role},
        )

    def create_user(self, email, password, role, check_user_validity: bool = True):
        return self.database_adapter.safe_execute(
            'create_user',
            {
                'email': email,
                'password': password,
                'role': role,
                'check_user_validity': check_user_validity,
            },
        )

    def find_by_id(self, user_id):
        return self.database_adapter.safe_execute(
            'find_user_by_id',
            {'user_id': user_id},
        )

    def list_all_users(self):
        return self.database_adapter.safe_execute('list_all_users')

    def update_user_role(self, user_id: int, new_role: str):
        return self.database_adapter.safe_execute(
            'update_user_role',
            {'user_id': user_id, 'new_role': new_role},
        )
