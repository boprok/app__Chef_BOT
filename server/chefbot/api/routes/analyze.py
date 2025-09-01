"""Recipe analysis routes"""
import base64
import asyncio
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from chefbot.models.schemas import AnalyzeResponse, Recipe
from chefbot.api.routes.auth import get_current_user
from config.settings import settings
import httpx

router = APIRouter(prefix="/api", tags=["analysis"])

def _current_month() -> str:
    """Get current month in YYYY-MM format"""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m")

def _choose_provider() -> str:
    """Choose AI provider based on configuration"""
    if settings.PROVIDER == "auto":
        return "gemini" if settings.GEMINI_API_KEY else "none"
    return settings.PROVIDER

async def check_and_update_usage(user: dict) -> bool:
    """Check if user can make a request and update usage"""
    current_month = _current_month()
    
    # Update usage month if needed
    if user.get("usage_month") != current_month:
        user["monthly_usage"] = 0
        user["usage_month"] = current_month
        
        async with httpx.AsyncClient() as client:
            await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
                headers=settings.SUPABASE_HEADERS,
                json={"monthly_usage": 0, "usage_month": current_month}
            )
    
    # Check usage limits for free tier
    if user.get("plan") == "free":
        if user.get("monthly_usage", 0) >= settings.FREE_MAX_MONTHLY:
            return False
    
    # Increment usage count
    new_usage = user.get("monthly_usage", 0) + 1
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{settings.SUPABASE_URL}/rest/v1/users?id=eq.{user['id']}",
            headers=settings.SUPABASE_HEADERS,
            json={"monthly_usage": new_usage}
        )
    
    user["monthly_usage"] = new_usage
    return True

async def check_rate_limit(user: dict) -> bool:
    """Check rate limiting"""
    # TODO: Implement rate limiting logic
    # For now, just return True
    return True

async def analyze_with_gemini(image_data: bytes, prompt: str = "") -> AnalyzeResponse:
    """Analyze image using Gemini API"""
    try:
        # Encode image to base64
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        
        system_prompt = """You are an expert chef and food analyst. Analyze the image of food ingredients and:

1. **Identify ingredients**: List all visible ingredients you can identify
2. **Suggest recipes**: Provide 2-3 practical recipes using these ingredients
3. **Be specific**: Include cooking times, steps, and quantities when possible
4. **Consider combinations**: Think about how ingredients work together

Format your response as JSON with this structure:
{
  "ingredients": ["ingredient1", "ingredient2", ...],
  "recipes": [
    {
      "title": "Recipe Name",
      "ingredients": ["ingredient with quantity", ...],
      "steps": ["step 1", "step 2", ...],
      "timeMins": 30
    }
  ]
}
"""
        
        if prompt:
            system_prompt += f"\n\nUser's additional request: {prompt}"
        
        # Call Gemini API
        gemini_payload = {
            "contents": [{
                "parts": [
                    {"text": system_prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": image_b64
                        }
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "candidateCount": 1,
                "maxOutputTokens": 2048,
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}",
                json=gemini_payload,
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Gemini API error: {response.status_code}")
            
            result = response.json()
            
            if "candidates" not in result or not result["candidates"]:
                raise HTTPException(status_code=500, detail="No response from Gemini API")
            
            content = result["candidates"][0]["content"]["parts"][0]["text"]
            
            # Try to parse JSON from the response
            import json
            try:
                # Clean up the response text
                content = content.strip()
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
                
                parsed_result = json.loads(content)
                
                # Validate and convert to our model
                recipes = []
                for recipe_data in parsed_result.get("recipes", []):
                    recipe = Recipe(
                        title=recipe_data.get("title", "Unknown Recipe"),
                        ingredients=recipe_data.get("ingredients", []),
                        steps=recipe_data.get("steps", []),
                        timeMins=recipe_data.get("timeMins")
                    )
                    recipes.append(recipe)
                
                return AnalyzeResponse(
                    ingredients=parsed_result.get("ingredients", []),
                    recipes=recipes
                )
                
            except json.JSONDecodeError:
                # Fallback: create a simple response
                return AnalyzeResponse(
                    ingredients=["Unable to identify ingredients"],
                    recipes=[Recipe(
                        title="Analysis Error",
                        ingredients=["Check image quality"],
                        steps=["Please try uploading a clearer image"],
                        timeMins=None
                    )]
                )
                
    except Exception as e:
        print(f"Gemini analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Analysis failed")

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(file: UploadFile = File(...), prompt: str = Form(""), user: dict = Depends(get_current_user)):
    """Analyze uploaded food image and generate recipes"""
    print("ANALYZE endpoint called")
    image_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"
    
    if not (mime_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported.")

    # Check usage limits for free tier
    if not await check_and_update_usage(user):
        print(f"RAISING 429 for user_id={user['id']}")
        raise HTTPException(
            status_code=429, 
            detail=f"Free plan limit reached: {settings.FREE_MAX_MONTHLY} analyses this month. Upgrade to Pro for unlimited usage."
        )

    # Check rate limiting (requests per hour)
    if not await check_rate_limit(user):
        raise HTTPException(
            status_code=429, 
            detail="Rate limit exceeded. Please try again later."
        )

    print(f"ANALYZE: user_id={user['id']} email={user.get('email')} plan={user.get('plan')} monthly_usage={user.get('monthly_usage')} usage_month={user.get('usage_month')}")

    # Add delay for free tier users
    if user.get("plan") == "free" and settings.FREE_DELAY_SECONDS > 0:
        await asyncio.sleep(settings.FREE_DELAY_SECONDS)

    # Perform analysis
    try:
        result = await analyze_with_gemini(image_bytes, prompt)
        print("ANALYZE: Success")
        return result
    except Exception as e:
        print(f"ANALYZE: Error - {str(e)}")
        raise
