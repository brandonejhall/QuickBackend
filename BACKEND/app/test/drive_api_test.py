from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import os
from pprint import pprint
import io


class DriveAPITester:
    def __init__(self, credentials_path):
        self.credentials_path = credentials_path
        self.service = None

    def test_connection(self):
        """Test basic connection and credentials"""
        try:
            print("\n1. Testing Google Drive Connection...")

            if not os.path.exists(self.credentials_path):
                print("❌ Credentials file not found at:", self.credentials_path)
                return False

            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_path,
                scopes=['https://www.googleapis.com/auth/drive']
            )

            self.service = build('drive', 'v3', credentials=credentials)

            # Test simple API call
            files = self.service.files().list(pageSize=1).execute()
            print("✅ Successfully connected to Google Drive API!")
            return True

        except Exception as e:
            print(f"❌ Connection failed: {str(e)}")
            return False

    def test_create_folder(self, folder_name="test_folder"):
        """Test folder creation"""
        try:
            print("\n2. Testing Folder Creation...")

            folder_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }

            folder = self.service.files().create(
                body=folder_metadata,
                fields='id, name, webViewLink'
            ).execute()

            print("✅ Folder created successfully!")
            print("📁 Folder details:")
            pprint(folder)
            return folder['id']

        except Exception as e:
            print(f"❌ Folder creation failed: {str(e)}")
            return None

    def test_upload_file(self, folder_id, file_name="test.txt"):
        """Test file upload"""
        try:
            print("\n3. Testing File Upload...")

            # Create a test file
            content = io.BytesIO(b"This is a test file from Python!")

            file_metadata = {
                'name': file_name,
                'parents': [folder_id]
            }

            media = MediaIoBaseUpload(
                content,
                mimetype='text/plain',
                resumable=True
            )

            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, webViewLink'
            ).execute()

            print("✅ File uploaded successfully!")
            print("📄 File details:")
            pprint(file)
            return file['id']

        except Exception as e:
            print(f"❌ File upload failed: {str(e)}")
            return None

    def cleanup(self, file_id=None, folder_id=None):
        """Clean up test files and folders"""
        try:
            print("\n4. Cleaning up test files...")

            if file_id:
                self.service.files().delete(fileId=file_id).execute()
                print(f"✅ Deleted test file: {file_id}")

            if folder_id:
                self.service.files().delete(fileId=folder_id).execute()
                print(f"✅ Deleted test folder: {folder_id}")

        except Exception as e:
            print(f"❌ Cleanup failed: {str(e)}")

    def share_file(self, file_id, email, role='reader'):
        """
        Share a file or folder with a specific user

        Args:
            file_id (str): The ID of the file or folder to share
            email (str): The email address to share with
            role (str): The role to grant ('reader', 'writer', or 'owner')
        """
        try:
            permission = {
                'type': 'user',
                'role': role,
                'emailAddress': email
            }

            # Set up the parameters for the permission creation
            kwargs = {
                'fileId': file_id,
                'body': permission,
                'sendNotificationEmail': True
            }

            # Add transferOwnership parameter if role is owner
            if role == 'owner':
                kwargs['transferOwnership'] = True

            self.service.permissions().create(**kwargs).execute()

            # Get the updated sharing link
            file = self.service.files().get(
                fileId=file_id,
                fields='webViewLink'
            ).execute()

            print(f"✅ Successfully shared with {email}")
            print(f"🔗 Updated sharing link: {file['webViewLink']}")

        except Exception as e:
            print(f"❌ Sharing failed: {str(e)}")

    def share_folder(self, folder_id_tbs, email):
        """
        Share a folder with a specific user with writer permissions
        and create a public sharing link
        """
        try:
            # Share with specific user
            user_permission = {
                'type': 'user',
                'role': 'writer',
                'emailAddress': email
            }

            self.service.permissions().create(
                fileId=folder_id_tbs,
                body=user_permission,
                sendNotificationEmail=True,
                fields='id'
            ).execute()

            # Create anyone-with-link access
            anyone_permission = {
                'type': 'anyone',
                'role': 'reader',
                'allowFileDiscovery': False
            }

            self.service.permissions().create(
                fileId=folder_id_tbs,
                body=anyone_permission,
                fields='id'
            ).execute()

            # Get the shareable link
            folder = self.service.files().get(
                fileId=folder_id_tbs,
                fields='webViewLink'
            ).execute()

            print(f"✅ Successfully shared folder with {email} as writer")
            print(f"✅ Created public sharing link")
            print(f"🔗 Folder access link: {folder['webViewLink']}")

        except Exception as e:
            print(f"❌ Sharing failed: {str(e)}")


# Usage example
if __name__ == "__main__":
    # Update this path to your credentials file location
    load_dotenv()

    CREDENTIALS_PATH = os.getenv('DRIVE_CREDENTIALS')

    tester = DriveAPITester(CREDENTIALS_PATH)

    # Test 1: Connection
    if not tester.test_connection():
        print("🛑 Stopping tests due to connection failure")
        exit(1)

    # Test 2: Create Folder
    folder_id = tester.test_create_folder("test_folder101")
    if not folder_id:
        print("🛑 Stopping tests due to folder creation failure")
        exit(1)

    tester.share_folder(folder_id,'brandonejh7@gmail.com')
    # Test 3: Upload File
    file_id = tester.test_upload_file(folder_id, "test101.txt")
    if not file_id:
        print("🛑 File upload failed")

    #tester.share_file(file_id,'brandonejh7@gmail.com','writer')

    # Clean up
    #tester.cleanup(file_id, folder_id)