"""
Session Management Service for TerraBuild API

Handles the storage and retrieval of valuation sessions.
"""
import json
import os
from datetime import datetime
from typing import Dict, Optional, Any

class SessionManager:
    """
    Manages valuation sessions for the TerraBuild platform.
    In a production environment, this would use a database.
    """
    
    def __init__(self, storage_dir: str = None):
        """
        Initialize the session manager.
        
        Args:
            storage_dir: Directory to store session files
        """
        self.storage_dir = storage_dir or os.path.join(os.getcwd(), "data", "sessions")
        os.makedirs(self.storage_dir, exist_ok=True)
    
    def get_session_path(self, session_id: str) -> str:
        """
        Get the file path for a session.
        
        Args:
            session_id: Unique identifier for the session
            
        Returns:
            str: Path to the session file
        """
        return os.path.join(self.storage_dir, f"{session_id}.json")
    
    def save_session(self, session_id: str, data: Dict[str, Any]) -> bool:
        """
        Save a session to storage.
        
        Args:
            session_id: Unique identifier for the session
            data: Session data to save
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Add metadata if not present
            if "metadata" not in data:
                data["metadata"] = {}
            
            # Update timestamps
            data["metadata"]["last_updated"] = datetime.now().isoformat()
            if "created_at" not in data["metadata"]:
                data["metadata"]["created_at"] = datetime.now().isoformat()
            
            # Save to file
            with open(self.get_session_path(session_id), "w") as f:
                json.dump(data, f, indent=2)
            
            return True
        except Exception as e:
            print(f"Error saving session {session_id}: {str(e)}")
            return False
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a session from storage.
        
        Args:
            session_id: Unique identifier for the session
            
        Returns:
            Dict or None: Session data if found, None otherwise
        """
        try:
            file_path = self.get_session_path(session_id)
            
            if not os.path.exists(file_path):
                return None
            
            with open(file_path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error retrieving session {session_id}: {str(e)}")
            return None
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session from storage.
        
        Args:
            session_id: Unique identifier for the session
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            file_path = self.get_session_path(session_id)
            
            if not os.path.exists(file_path):
                return False
            
            os.remove(file_path)
            return True
        except Exception as e:
            print(f"Error deleting session {session_id}: {str(e)}")
            return False
    
    def list_sessions(self) -> Dict[str, Dict[str, Any]]:
        """
        List all sessions with their metadata.
        
        Returns:
            Dict: Dictionary of session_id to metadata
        """
        try:
            sessions = {}
            
            for filename in os.listdir(self.storage_dir):
                if filename.endswith(".json"):
                    session_id = os.path.splitext(filename)[0]
                    session_data = self.get_session(session_id)
                    
                    if session_data and "metadata" in session_data:
                        sessions[session_id] = session_data["metadata"]
            
            return sessions
        except Exception as e:
            print(f"Error listing sessions: {str(e)}")
            return {}