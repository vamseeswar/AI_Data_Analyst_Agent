from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.groq_service import generate_response
from database.vector_db import get_memory_db

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    dataset_context: dict = None

@router.post("/chat")
async def chat_with_data(request: ChatRequest):
    try:
        # 1. Search memory for context
        memory_db = get_memory_db()
        past_interactions = memory_db.search_memory(request.query, k=2)
        
        # 2. Build extended context
        extended_context = {
            "current_dataset": request.dataset_context,
            "past_relevant_interactions": [m["data"] for m in past_interactions] if past_interactions else []
        }
        
        # 3. Generate Response
        response = await generate_response(request.query, extended_context)
        
        # 4. Save to memory
        memory_db.add_memory(request.query, response, request.dataset_context)
        
        return {"status": "success", "response": response}
    except Exception as e:
        import traceback
        with open("chat_error_log.txt", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
