import os
import json
from groq import AsyncGroq
from prompts.templates import DATA_INSIGHTS_PROMPT, CHAT_PROMPT
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "AIzaSyBfQNxQ8UY6FMvFd7WrbjQ6VVXfp_sflJY") # Fallback to a key if not set, though user keys are provided
client = AsyncGroq(api_key=GROQ_API_KEY)

async def generate_insights(dataset_name: str, columns: list, summary_stats: dict, missing_values: dict):
    prompt = DATA_INSIGHTS_PROMPT.format(
        dataset_name=dataset_name,
        columns=columns,
        summary_stats=json.dumps(summary_stats, default=str),
        missing_values=json.dumps(missing_values, default=str)
    )
    
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a data analyst AI. Always output valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)

async def generate_response(query: str, dataset_context: dict):
    prompt = CHAT_PROMPT.format(
        dataset_context=json.dumps(dataset_context, default=str) if dataset_context else "No dataset context provided.",
        query=query
    )
    
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a helpful data analyst AI."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )
    
    return response.choices[0].message.content
