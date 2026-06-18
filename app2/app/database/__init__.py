from flask import current_app

from .adapters import SQLAlchemyDatabaseAdapter, SQLAlchemyUserDataService
from .application_repository import ApplicationRepository
from .intibak_repository import IntibakRepository


def init_database_interfaces(app):
    database_interface = SQLAlchemyDatabaseAdapter()
    database_interface.connect()
    user_data_interface = SQLAlchemyUserDataService(database_interface)

    app.extensions['database_interface'] = database_interface
    app.extensions['user_data_interface'] = user_data_interface


def get_database_interface():
    return current_app.extensions['database_interface']


def get_user_data_interface():
    return current_app.extensions['user_data_interface']


def get_application_repository():
    """Get application repository (data access layer for applications)."""
    return ApplicationRepository


def get_user_repository():
    """Get user data service (user management operations)."""
    return current_app.extensions['user_data_interface']


def get_intibak_repository():
    """Get the intibak repository (course equivalency operations)."""
    return IntibakRepository

