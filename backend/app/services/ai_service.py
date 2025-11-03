import os
import httpx
from typing import Optional, Dict, List

class AIService:
    """Service for AI-powered code analysis using OpenRouter and Relace."""
    
    def __init__(self):
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.relace_api_key = os.getenv("RELACE_API_KEY")
        
        if not self.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY must be set")
        
        self.openrouter_base_url = "https://openrouter.ai/api/v1"
        self.relace_base_url = "https://api.relace.ai/v1"
    
    async def analyze_code(
        self,
        repo_full_name: str,
        base_sha: str,
        head_sha: str,
        diff_data: Dict,
        rubric: Optional[str] = None
    ) -> Dict:
        """
        Analyze candidate's code using AI.
        
        Args:
            repo_full_name: GitHub repository name
            base_sha: Base commit SHA
            head_sha: Head commit SHA
            diff_data: Diff information from GitHub
            rubric: Optional custom rubric for evaluation
        
        Returns:
            Dictionary with AI summary and score
        """
        try:
            # Build context from diff
            code_context = self._build_code_context(diff_data)
            
            # Use Relace if available for semantic code search
            if self.relace_api_key:
                semantic_context = await self._get_semantic_context(repo_full_name, rubric or "code quality")
                code_context += f"\n\n### Semantic Analysis:\n{semantic_context}"
            
            # Generate AI analysis using OpenRouter
            analysis = await self._generate_analysis(code_context, rubric)
            
            return analysis
        except Exception as e:
            raise Exception(f"Failed to analyze code: {str(e)}")
    
    def _build_code_context(self, diff_data: Dict) -> str:
        """Build a text context from diff data."""
        context_parts = []
        
        # Add commit information
        context_parts.append("### Commits:")
        for commit in diff_data.get('commits', []):
            context_parts.append(f"- {commit['message']} (by {commit['author']})")
        
        context_parts.append(f"\n### Changes Summary:")
        context_parts.append(f"Total commits: {diff_data.get('total_commits', 0)}")
        context_parts.append(f"Files changed: {len(diff_data.get('files', []))}")
        
        # Add file changes
        context_parts.append("\n### Files Modified:")
        for file in diff_data.get('files', [])[:10]:  # Limit to first 10 files
            context_parts.append(f"\n**{file['filename']}** ({file['status']})")
            context_parts.append(f"  +{file['additions']} -{file['deletions']}")
            
            if file.get('patch'):
                # Truncate large patches
                patch = file['patch']
                if len(patch) > 1000:
                    patch = patch[:1000] + "\n... (truncated)"
                context_parts.append(f"```diff\n{patch}\n```")
        
        return "\n".join(context_parts)
    
    async def _get_semantic_context(self, repo_name: str, query: str) -> str:
        """Get semantic code context using Relace (if available)."""
        if not self.relace_api_key:
            return ""
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.relace_base_url}/search",
                    headers={
                        "Authorization": f"Bearer {self.relace_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "repo": repo_name,
                        "query": query,
                        "top_k": 5
                    }
                )
                
                if response.status_code == 200:
                    results = response.json()
                    # Format results into text
                    context_parts = []
                    for result in results.get('results', []):
                        context_parts.append(f"- {result.get('file', 'unknown')}: {result.get('content', '')[:200]}")
                    return "\n".join(context_parts)
        except Exception as e:
            print(f"Relace API error: {str(e)}")
        
        return ""
    
    async def _generate_analysis(self, code_context: str, rubric: Optional[str] = None) -> Dict:
        """Generate AI analysis using OpenRouter."""
        
        default_rubric = """
        Evaluate the code submission on the following criteria:
        1. Code Quality: Is the code clean, readable, and well-organized?
        2. Functionality: Does it meet the requirements and work correctly?
        3. Best Practices: Are best practices followed (error handling, testing, etc.)?
        4. Documentation: Is the code well-documented?
        5. Creativity: Are there any innovative solutions or approaches?
        
        Provide:
        - A brief summary (2-3 sentences)
        - Score for each criterion (0-20 points each)
        - Total score (0-100)
        - Key strengths and areas for improvement
        """
        
        evaluation_rubric = rubric or default_rubric
        
        prompt = f"""You are a senior software engineer reviewing a coding assessment submission.

{evaluation_rubric}

Here is the candidate's work:

{code_context}

Please provide your evaluation in the following JSON format:
{{
    "summary": "Brief 2-3 sentence overview",
    "scores": {{
        "code_quality": <0-20>,
        "functionality": <0-20>,
        "best_practices": <0-20>,
        "documentation": <0-20>,
        "creativity": <0-20>
    }},
    "total_score": <0-100>,
    "strengths": ["strength 1", "strength 2", ...],
    "improvements": ["area 1", "area 2", ...],
    "recommendation": "hire|maybe|pass"
}}
"""
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.openrouter_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openrouter_api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://afterquery.com",
                        "X-Title": "AfterQuery Assessment Platform"
                    },
                    json={
                        "model": "openai/gpt-4o-mini",  # Fast and cost-effective
                        "messages": [
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "response_format": { "type": "json_object" }
                    }
                )
                
                if response.status_code != 200:
                    raise Exception(f"OpenRouter API error: {response.text}")
                
                result = response.json()
                ai_response = result['choices'][0]['message']['content']
                
                # Parse the JSON response
                import json
                analysis = json.loads(ai_response)
                
                # Format as markdown for storage
                summary_md = f"""## AI Analysis Summary

{analysis.get('summary', 'No summary available')}

### Scores
- **Code Quality**: {analysis.get('scores', {}).get('code_quality', 0)}/20
- **Functionality**: {analysis.get('scores', {}).get('functionality', 0)}/20
- **Best Practices**: {analysis.get('scores', {}).get('best_practices', 0)}/20
- **Documentation**: {analysis.get('scores', {}).get('documentation', 0)}/20
- **Creativity**: {analysis.get('scores', {}).get('creativity', 0)}/20

**Total Score**: {analysis.get('total_score', 0)}/100

### Strengths
{chr(10).join(f"- {s}" for s in analysis.get('strengths', []))}

### Areas for Improvement
{chr(10).join(f"- {i}" for i in analysis.get('improvements', []))}

### Recommendation
**{analysis.get('recommendation', 'unknown').upper()}**
"""
                
                return {
                    "ai_summary_md": summary_md,
                    "auto_score": analysis.get('total_score', 0),
                    "raw_analysis": analysis
                }
                
        except Exception as e:
            raise Exception(f"Failed to generate AI analysis: {str(e)}")

# Singleton instance
ai_service = AIService()

