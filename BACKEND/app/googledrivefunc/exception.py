class DriveAPIError(Exception):
    """Base exception for Drive API related errors"""
    pass

class DriveConnectionError(DriveAPIError):
    """Raised when there's an issue connecting to Google Drive"""
    pass

class FileOperationError(DriveAPIError):
    """Raised when file operations encounter an error"""
    pass