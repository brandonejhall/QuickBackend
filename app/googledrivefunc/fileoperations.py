import io
from googleapiclient.http import MediaIoBaseUpload


class DriveFileOperations:
    def __init__(self, drive_service):
        """
        Initialize file operations with a Google Drive service

        Args:
            drive_service (googleapiclient.discovery.Resource): Google Drive service instance
        """
        self.service = drive_service

    def check_and_save_file(self, file_name, content, folder_name=None):
        """
        Check if a folder exists. If it doesn't, create the folder.
        Then save the file to that folder.

        Args:
            file_name (str): Name of the file to save
            content (io.BytesIO): File content to upload
            folder_name (str, optional): Name of the folder to save file in

        Returns:
            dict: Details of the created file and folder
        """
        try:
            folder_id = None

            # If folder name is provided, check if folder exists
            if folder_name:
                # Search for existing folder
                folder_query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
                folders = self.service.files().list(
                    q=folder_query,
                    spaces='drive',
                    fields='files(id, name)'
                ).execute()

                existing_folders = folders.get('files', [])

                # If folder doesn't exist, create it
                if not existing_folders:
                    print(f"ℹ️ Folder '{folder_name}' not found. Creating new folder.")
                    folder_metadata = {
                        'name': folder_name,
                        'mimeType': 'application/vnd.google-apps.folder'
                    }

                    folder = self.service.files().create(
                        body=folder_metadata,
                        fields='id, name'
                    ).execute()

                    folder_id = folder['id']
                    print(f"✅ Created new folder: {folder_name}")
                else:
                    # Use the first matching folder
                    folder_id = existing_folders[0]['id']
                    print(f"ℹ️ Using existing folder: {folder_name}")

            # Prepare file metadata
            file_metadata = {
                'name': file_name,
                'parents': [folder_id] if folder_id else []
            }

            # Upload file
            media = MediaIoBaseUpload(
                content,
                mimetype='text/plain',  # You might want to detect mimetype dynamically
                resumable=True
            )

            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, webViewLink, parents'
            ).execute()

            print(f"✅ File saved: {file_name}")

            # Return comprehensive result
            return {
                'file': {
                    'id': file.get('id'),
                    'name': file.get('name'),
                    'web_link': file.get('webViewLink')
                },
                'folder': {
                    'id': folder_id,
                    'name': folder_name
                } if folder_name else None
            }

        except Exception as e:
            print(f"❌ Operation failed: {str(e)}")
            return None

    def find_and_delete_files(self, file_name, folder_name=None):
        """
        Find and delete files based on their name and optional folder name.

        Args:
            file_name (str): Name of the file to delete
            folder_name (str, optional): Name of the parent folder. Defaults to None.

        Returns:
            int: Number of files deleted
        """
        try:
            # Construct the query to find files
            query = f"name = '{file_name}' and trashed = false"

            # If folder_name is provided, find the folder ID first
            if folder_name:
                folder_query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
                folders = self.service.files().list(
                    q=folder_query,
                    spaces='drive',
                    fields='files(id)'
                ).execute()

                folder_ids = [folder['id'] for folder in folders.get('files', [])]

                if folder_ids:
                    # Add folder parent condition to the file search
                    folder_conditions = " or ".join([f"'{folder_id}' in parents" for folder_id in folder_ids])
                    query += f" and ({folder_conditions})"
                else:
                    print(f"❌ No folder found with name: {folder_name}")
                    return 0

            # Search for files matching the query
            results = self.service.files().list(
                q=query,
                spaces='drive',
                fields='files(id, name)'
            ).execute()

            files = results.get('files', [])

            # Delete found files
            deleted_count = 0
            for file in files:
                try:
                    self.service.files().delete(fileId=file['id']).execute()
                    print(f"✅ Deleted file: {file['name']} (ID: {file['id']})")
                    deleted_count += 1
                except Exception as delete_error:
                    print(f"❌ Failed to delete file {file['name']}: {str(delete_error)}")

            if deleted_count == 0:
                print(f"ℹ️ No files found matching the search criteria.")

            return deleted_count

        except Exception as e:
            print(f"❌ Search and delete operation failed: {str(e)}")
            return 0