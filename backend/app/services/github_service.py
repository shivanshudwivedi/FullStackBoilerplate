import os
from github import Github, GithubException
from typing import Optional, Dict, List
import base64

class GitHubService:
    def __init__(self):
        """Initialize GitHub service with authentication."""
        from dotenv import load_dotenv
        load_dotenv()
        self.token = os.getenv("GITHUB_MACHINE_USER_TOKEN")
        if not self.token:
            raise ValueError("GITHUB_MACHINE_USER_TOKEN must be set")
        
        self.client = Github(self.token)
        self.user = self.client.get_user()
    
    def get_latest_main_sha(self, repo_url: str) -> str:
        """
        Get the latest SHA from the main branch of a repository.
        
        Args:
            repo_url: GitHub repository URL (e.g., https://github.com/user/repo)
        
        Returns:
            SHA of the latest commit on main branch
        """
        try:
            # Extract owner and repo name from URL
            parts = repo_url.rstrip('/').split('/')
            owner = parts[-2]
            repo_name = parts[-1].replace('.git', '')
            
            repo = self.client.get_repo(f"{owner}/{repo_name}")
            main_branch = repo.get_branch("main")
            
            return main_branch.commit.sha
        except GithubException as e:
            raise Exception(f"Failed to get latest SHA: {e.data.get('message', str(e))}")
    
    def create_private_repo_from_seed(
        self, 
        seed_repo_url: str, 
        new_repo_name: str,
        pinned_sha: str
    ) -> dict:
        """
        Create a new private repository from a seed repository at a specific commit.
        
        Args:
            seed_repo_url: URL of the seed repository
            new_repo_name: Name for the new repository
            pinned_sha: Commit SHA to use as the starting point
        
        Returns:
            Dictionary with 'repo_full_name' and 'initial_commit_sha' from the NEW repo
        """
        try:
            # Extract owner and repo from seed URL
            parts = seed_repo_url.rstrip('/').split('/')
            seed_owner = parts[-2]
            seed_repo_name = parts[-1].replace('.git', '')
            
            seed_repo = self.client.get_repo(f"{seed_owner}/{seed_repo_name}")
            
            # Create new empty private repository
            new_repo = self.user.create_repo(
                name=new_repo_name,
                private=True,
                description=f"Assessment repository (forked from {seed_repo.full_name})",
                auto_init=False
            )
            
            # Get the tree at the pinned SHA
            commit = seed_repo.get_commit(pinned_sha)
            tree = commit.commit.tree
            
            # Create a new commit in the new repo with the same tree
            # First, we need to copy all files from the seed repo
            self._copy_repo_contents(seed_repo, new_repo, pinned_sha)
            
            # CRITICAL FIX: Get the initial commit SHA from the NEW repo
            # The seed repo SHA doesn't exist in the new repo!
            # We need to wait a moment for GitHub to update
            import time
            time.sleep(2)  # Give GitHub a moment to process
            
            # Refresh the repo object to get latest state
            new_repo = self.client.get_repo(new_repo.full_name)
            
            # Get all commits and find the first (oldest) one
            try:
                commits_list = list(new_repo.get_commits())
                if commits_list:
                    # The last commit in the list is the initial commit
                    initial_commit_sha = commits_list[-1].sha
                else:
                    # Fallback: use HEAD
                    initial_commit_sha = new_repo.get_branch("main").commit.sha
            except Exception as e:
                print(f"Warning: Could not get commit history: {e}")
                # Fallback: use HEAD
                initial_commit_sha = new_repo.get_branch("main").commit.sha
            
            print(f"✅ Created repo {new_repo.full_name}")
            print(f"✅ Initial commit SHA (for diff base): {initial_commit_sha}")
            
            return {
                "repo_full_name": new_repo.full_name,
                "initial_commit_sha": initial_commit_sha
            }
        except GithubException as e:
            raise Exception(f"Failed to create repo: {e.data.get('message', str(e))}")
    
    def _copy_repo_contents(self, source_repo, dest_repo, sha: str):
        """Helper to copy repository contents at a specific SHA."""
        try:
            # Get all files from source at the given SHA
            contents = source_repo.get_contents("", ref=sha)
            
            files_to_create = []
            
            while contents:
                file_content = contents.pop(0)
                if file_content.type == "dir":
                    contents.extend(source_repo.get_contents(file_content.path, ref=sha))
                else:
                    # Read file content
                    file_data = source_repo.get_contents(file_content.path, ref=sha)
                    files_to_create.append({
                        "path": file_content.path,
                        "content": file_data.decoded_content.decode('utf-8') if file_data.encoding == 'base64' else file_data.content
                    })
            
            # Create all files in destination repo
            for file_info in files_to_create:
                try:
                    dest_repo.create_file(
                        path=file_info["path"],
                        message=f"Initialize from seed repo",
                        content=file_info["content"],
                        branch="main"
                    )
                except GithubException:
                    # File might already exist or there might be binary content issues
                    # Try with raw content
                    pass
                    
        except Exception as e:
            raise Exception(f"Failed to copy repo contents: {str(e)}")
    
    def validate_username(self, username: str) -> bool:
        """
        Check if a GitHub username is valid and exists.
        
        Args:
            username: GitHub username to validate
            
        Returns:
            True if username exists, False otherwise
        """
        try:
            self.client.get_user(username)
            return True
        except GithubException:
            return False
    
    def add_collaborator(self, repo_full_name: str, username: str, permission: str = "push"):
        """
        Add a collaborator to a repository.
        
        Args:
            repo_full_name: Full repository name (owner/repo)
            username: GitHub username to add
            permission: Permission level (pull, push, admin)
        """
        try:
            repo = self.client.get_repo(repo_full_name)
            repo.add_to_collaborators(username, permission=permission)
        except GithubException as e:
            raise Exception(f"Failed to add collaborator: {e.data.get('message', str(e))}")
    
    def remove_collaborator(self, repo_full_name: str, username: str):
        """Remove a collaborator from a repository."""
        try:
            repo = self.client.get_repo(repo_full_name)
            repo.remove_from_collaborators(username)
        except GithubException as e:
            raise Exception(f"Failed to remove collaborator: {e.data.get('message', str(e))}")
    
    def set_repo_private(self, repo_full_name: str, private: bool = True):
        """Set repository visibility."""
        try:
            repo = self.client.get_repo(repo_full_name)
            repo.edit(private=private)
        except GithubException as e:
            raise Exception(f"Failed to set repo privacy: {e.data.get('message', str(e))}")
    
    def archive_repo(self, repo_full_name: str):
        """Archive a repository."""
        try:
            repo = self.client.get_repo(repo_full_name)
            repo.edit(archived=True)
        except GithubException as e:
            raise Exception(f"Failed to archive repo: {e.data.get('message', str(e))}")
    
    def get_head_sha(self, repo_full_name: str, branch: str = "main") -> str:
        """Get the latest commit SHA from a repository branch."""
        try:
            repo = self.client.get_repo(repo_full_name)
            branch_obj = repo.get_branch(branch)
            return branch_obj.commit.sha
        except GithubException as e:
            raise Exception(f"Failed to get head SHA: {e.data.get('message', str(e))}")
    
    def compare_commits(self, repo_full_name: str, base_sha: str, head_sha: str) -> Dict:
        """
        Compare two commits and return the diff.
        
        Returns:
            Dictionary with files and their diffs
        """
        try:
            print(f"DEBUG compare_commits:")
            print(f"  Repo: {repo_full_name}")
            print(f"  Base SHA: {base_sha}")
            print(f"  Head SHA: {head_sha}")
            
            repo = self.client.get_repo(repo_full_name)
            print(f"  Repo found: {repo.full_name}, Private: {repo.private}")
            
            comparison = repo.compare(base_sha, head_sha)
            print(f"  Comparison successful: {len(comparison.files)} files changed")
            
            files = []
            for file in comparison.files:
                files.append({
                    "filename": file.filename,
                    "status": file.status,
                    "additions": file.additions,
                    "deletions": file.deletions,
                    "changes": file.changes,
                    "patch": file.patch if hasattr(file, 'patch') else None,
                    "blob_url": file.blob_url
                })
            
            return {
                "ahead_by": comparison.ahead_by,
                "behind_by": comparison.behind_by,
                "total_commits": comparison.total_commits,
                "files": files,
                "commits": [
                    {
                        "sha": commit.sha,
                        "message": commit.commit.message,
                        "author": commit.commit.author.name,
                        "date": commit.commit.author.date.isoformat()
                    }
                    for commit in comparison.commits
                ]
            }
        except GithubException as e:
            print(f"DEBUG GitHub API Error:")
            print(f"  Status: {e.status}")
            print(f"  Data: {e.data}")
            print(f"  Message: {e.data.get('message', 'No message')}")
            raise Exception(f"Failed to compare commits: {e.data.get('message', str(e))}")
    
    def get_repo_info(self, repo_full_name: str) -> Dict:
        """Get basic repository information."""
        try:
            repo = self.client.get_repo(repo_full_name)
            return {
                "name": repo.name,
                "full_name": repo.full_name,
                "private": repo.private,
                "clone_url": repo.clone_url,
                "html_url": repo.html_url,
                "default_branch": repo.default_branch
            }
        except GithubException as e:
            raise Exception(f"Failed to get repo info: {e.data.get('message', str(e))}")

# Singleton instance
github_service = GitHubService()

