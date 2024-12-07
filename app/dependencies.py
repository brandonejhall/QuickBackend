from .googledrivefunc import DriveFileOperations, DriveConnection

def get_drive_file_ops():
    drive_connection = DriveConnection()
    return DriveFileOperations(drive_connection.service)

