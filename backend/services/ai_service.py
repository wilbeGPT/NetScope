import google.generativeai as genai
import os

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

def ask_gemini(query: str, context: str = "") -> str:
    """
    Sends a query to Gemini 1.5 Flash using context from the current investigation.
    """
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        Eres un asistente experto en redes llamado 'Gemini NetScope'. Estás analizando mediciones de RIPE Atlas en El Salvador para detectar path inflation.
        
        Contexto actual de la investigación de red:
        {context if context else 'No hay datos cargados todavía.'}
        
        Pregunta del usuario: {query}
        
        Por favor, responde de forma técnica pero concisa (máximo 2-3 párrafos).
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error al contactar a Gemini: {str(e)}"
