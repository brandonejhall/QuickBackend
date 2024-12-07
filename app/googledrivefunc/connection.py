import os
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build


class DriveConnection:
    def __init__(self, credentials_path=None):
        """
        Initialize Google Drive connection

        Args:
            credentials_path (str, optional): Path to service account credentials.
            If None, tries to load from environment variable.
        """
        # Load environment variables
        load_dotenv()

        # Use provided path or get from environment
        self.credentials_path = credentials_path or os.getenv('DRIVE_CREDENTIALS')

        if not self.credentials_path:
            raise ValueError("No credentials path provided. Set DRIVE_CREDENTIALS env var or pass path.")

        self.service = None
        self._establish_connection()

    def _establish_connection(self):
        """
        Establish connection to Google Drive API

        Raises:
            FileNotFoundError: If credentials file doesn't exist
            Exception: For any connection errors
        """
        if not os.path.exists(self.credentials_path):
            raise FileNotFoundError(f"Credentials file not found at: {self.credentials_path}")

        try:
            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_path,
                scopes=['https://www.googleapis.com/auth/drive']
            )

            self.service = build('drive', 'v3', credentials=credentials)

        except Exception as e:
            raise ConnectionError(f"Failed to connect to Google Drive API: {str(e)}")

    def get_service(self):
        """
        Get the Google Drive service instance

        Returns:
            googleapiclient.discovery.Resource: Drive service instance
        """
        if not self.service:
            self._establish_connection()
        return self.service