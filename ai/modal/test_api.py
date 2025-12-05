import requests
import json
import time
import sys
import re
import base64
from pathlib import Path

# ------------------------------------------------------------------
# 1. Configuración de la prueba
# ------------------------------------------------------------------
API_KEY = "c8bdac91eded7c38d3eda5f299502337d2dc9fdc1d19259dd4d96058642ee046faf7cd0f29b39d5fcd7e2dc1989adc09430ce6b88e15f14c541944a85508438a"

# URLs Base (de Modal) - ACTUALIZA ESTAS URLs DESPUÉS DEL DEPLOY
BASE_URL_MULTIMODAL_INSTRUCT = "https://cubedcraftnetwork--culturistas-llm-serve-multimodal-instruct.modal.run"
BASE_URL_MULTIMODAL_THINKING = "https://cubedcraftnetwork--culturistas-llm-serve-multimodal-thinking.modal.run"

# Endpoint de la API compatible con OpenAI
API_ENDPOINT = "/v1/chat/completions"

# ------------------------------------------------------------------
# 2. Función para cargar imágenes
# ------------------------------------------------------------------
def encode_image_to_base64(image_path: str) -> str:
    """Convierte una imagen a base64 para enviar a la API."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def build_message_with_image(prompt: str, image_path: str = None) -> dict:
    """
    Construye un mensaje que puede incluir texto e imagen.
    
    Formato esperado por la API:
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Describe esta imagen"},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
        ]
    }
    """
    if image_path is None:
        return {"role": "user", "content": prompt}
    
    # Determinar el tipo MIME de la imagen
    ext = Path(image_path).suffix.lower()
    mime_type_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    }
    mime_type = mime_type_map.get(ext, 'image/jpeg')
    
    # Codificar imagen
    base64_image = encode_image_to_base64(image_path)
    
    return {
        "role": "user",
        "content": [
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{base64_image}"
                }
            }
        ]
    }


# ------------------------------------------------------------------
# 3. Función para extraer contenido thinking
# ------------------------------------------------------------------
def extract_thinking_content(text: str) -> dict:
    """
    Extrae el contenido de los tags <think> y <o> si existen.
    Retorna un dict con 'thinking' y 'output'.
    """
    thinking_match = re.search(r'<think>(.*?)</think>', text, re.DOTALL)
    output_match = re.search(r'<o>(.*?)</o>', text, re.DOTALL)
    
    result = {
        'has_thinking': bool(thinking_match),
        'thinking': thinking_match.group(1).strip() if thinking_match else None,
        'output': output_match.group(1).strip() if output_match else text,
        'raw': text
    }
    
    return result


# ------------------------------------------------------------------
# 4. Función para consultar información del modelo
# ------------------------------------------------------------------
def get_model_info(base_url: str, server_name: str) -> dict:
    """
    Consulta la información del modelo desde el endpoint /v1/models.
    Retorna la metadata del modelo si está disponible.
    """
    print(f"\n{'='*60}")
    print(f"Consultando info del modelo: {server_name}")
    print(f"{'='*60}")
    
    try:
        # Endpoint para listar modelos
        headers = {
            "Authorization": f"Bearer {API_KEY}"
        }
        response = requests.get(f"{base_url}/v1/models", headers=headers, timeout=3600)
        
        if response.status_code == 200:
            data = response.json()
            
            if 'data' in data and len(data['data']) > 0:
                model_info = data['data'][0]
                
                print(f"\n[INFO] Modelo encontrado:")
                print(f"  ID: {model_info.get('id', 'N/A')}")
                print(f"  Object: {model_info.get('object', 'N/A')}")
                print(f"  Created: {model_info.get('created', 'N/A')}")
                print(f"  Owned by: {model_info.get('owned_by', 'N/A')}")
                
                # Mostrar capacidades si están disponibles
                if 'capabilities' in model_info:
                    print(f"  Capacidades: {model_info['capabilities']}")
                
                # Mostrar formato de entrada esperado
                if 'input_format' in model_info:
                    print(f"  Formato de entrada: {model_info['input_format']}")
                
                return model_info
            else:
                print("[AVISO] No se encontró información del modelo")
                return {}
        else:
            print(f"[ERROR] Error {response.status_code} al consultar modelo")
            print(f"Respuesta: {response.text}")
            return {}
            
    except requests.exceptions.Timeout:
        print(f"[ERROR] Timeout al consultar información del modelo")
        return {}
    except Exception as e:
        print(f"[ERROR] Error al consultar modelo: {e}")
        return {}


def inspect_chat_completions_schema(base_url: str, server_name: str, model_name: str) -> None:
    """
    Hace una petición de prueba al endpoint de chat para ver qué formato acepta.
    Esto es útil para entender la estructura esperada.
    """
    print(f"\n{'='*60}")
    print(f"Inspeccionando schema de chat: {server_name}")
    print(f"{'='*60}")
    
    url = base_url + API_ENDPOINT
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    # Petición mínima con el nombre correcto del modelo
    test_data = {
        "model": model_name,
        "messages": [{"role": "user", "content": "test"}],
        "max_tokens": 1
    }
    
    try:
        response = requests.post(url, headers=headers, json=test_data, timeout=3600)
        
        # Cualquier respuesta nos da pistas sobre el formato
        if response.status_code in [200, 400, 422]:
            print(f"\n[INFO] El servidor acepta peticiones en {url}")
            
            # Si hay error de validación, muestra qué espera
            if response.status_code in [400, 422]:
                error_data = response.json()
                print(f"[INFO] Formato esperado (basado en error de validación):")
                print(json.dumps(error_data, indent=2))
            else:
                print(f"[OK] El formato básico de mensajes es correcto")
                print(f"[INFO] Formato de mensaje estándar:")
                print(f"  - role: 'user' | 'assistant' | 'system'")
                print(f"  - content: string | array de objetos")
                print(f"\n[INFO] Para imágenes (multimodal), usar:")
                print(f"  content: [")
                print(f"    {{\"type\": \"text\", \"text\": \"...\"}}"),
                print(f"    {{\"type\": \"image_url\", \"image_url\": {{\"url\": \"data:image/...;base64,...\"}}}}")
                print(f"  ]")
        else:
            print(f"[ERROR] Error {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Error al inspeccionar: {e}")


# ------------------------------------------------------------------
# 5. Función para hacer health check
# ------------------------------------------------------------------
def health_check(base_url: str, server_name: str) -> bool:
    """Verifica si el servidor está activo."""
    print(f"\n{'='*60}")
    print(f"Health check: {server_name}")
    print(f"{'='*60}")
    
    try:
        response = requests.get(f"{base_url}/health", timeout=3600)
        if response.status_code == 200:
            print(f"[OK] {server_name} esta ACTIVO")
            return True
        else:
            print(f"[ERROR] {server_name} respondio con codigo: {response.status_code}")
            return False
    except requests.exceptions.Timeout:
        print(f"[ERROR] {server_name} no responde (timeout)")
        return False
    except Exception as e:
        print(f"[ERROR] Error al conectar con {server_name}: {e}")
        return False


# ------------------------------------------------------------------
# 6. Función para probar el modelo con streaming
# ------------------------------------------------------------------
def test_model_stream(base_url: str, model_name: str, prompt: str, 
                      image_path: str = None,
                      show_thinking: bool = False, 
                      show_raw: bool = False) -> bool:
    """Prueba el modelo con una consulta en modo streaming."""
    
    url = base_url + API_ENDPOINT
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    # Construir mensaje (con o sin imagen)
    message = build_message_with_image(prompt, image_path)
    
    data = {
        "model": model_name,
        "messages": [message],
        "temperature": 0.7,
        "stream": True
    }
    
    print(f"\n{'='*60}")
    print(f"Probando modelo: {model_name}")
    print(f"Prompt: {prompt}")
    if image_path:
        print(f"Imagen: {image_path}")
    print(f"{'='*60}")
    
    if show_raw:
        print("\n[MODO RAW - Mostrando respuesta sin procesar]")
    
    print("\nRespuesta del modelo:")
    print("-" * 60)
    
    start_time = time.time()
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=3600, stream=True)
        
        if response.status_code == 200:
            full_response = ""
            in_thinking = False
            
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    
                    # Procesar líneas con formato SSE
                    if line_str.startswith("data: "):
                        data_str = line_str[6:]  # Quitar "data: "
                        
                        # Detectar fin del stream
                        if data_str.strip() == "[DONE]":
                            break
                        
                        try:
                            chunk = json.loads(data_str)
                            
                            # Extraer contenido del delta
                            if 'choices' in chunk and len(chunk['choices']) > 0:
                                delta = chunk['choices'][0].get('delta', {})
                                content = delta.get('content', '')
                                
                                if content:
                                    full_response += content
                                    
                                    # Modo RAW muestra TODO (incluyendo reasoning)
                                    if show_raw:
                                        print(content, end="", flush=True)
                                    else:
                                        # Detectar tags de thinking
                                        if '<think>' in content:
                                            in_thinking = True
                                        
                                        if in_thinking:
                                            if show_thinking:
                                                print(content, end="", flush=True)
                                        else:
                                            print(content, end="", flush=True)
                                        
                                        if '</think>' in content:
                                            in_thinking = False
                                    
                        except json.JSONDecodeError as e:
                            print(f"\n[JSON Error: {e}]", end="")
            
            elapsed = time.time() - start_time
            print("\n" + "-" * 60)
            
            # Analizar respuesta
            parsed = extract_thinking_content(full_response)
            
            if parsed['has_thinking'] and not show_raw:
                print(f"\n[INFO] Respuesta contiene reasoning (<think> tags)")
                print(f"  Reasoning: {len(parsed['thinking'])} chars")
                print(f"  Output: {len(parsed['output'])} chars")
            
            print(f"[OK] Respuesta completa recibida")
            print(f"  Tiempo: {elapsed:.2f}s")
            print(f"  Longitud total: {len(full_response)} caracteres")
            return True
            
        else:
            elapsed = time.time() - start_time
            print(f"\n[ERROR] Error {response.status_code} (tiempo: {elapsed:.2f}s)")
            print(f"Respuesta: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"\n[ERROR] Timeout despues de 3600 segundos")
        return False
    except Exception as e:
        print(f"\n[ERROR] Error inesperado: {e}")
        return False


# ------------------------------------------------------------------
# 7. Función para probar sin streaming
# ------------------------------------------------------------------
def test_model_no_stream(base_url: str, model_name: str, prompt: str,
                         image_path: str = None,
                         show_thinking: bool = False, 
                         show_raw: bool = False) -> bool:
    """Prueba el modelo sin streaming (respuesta completa)."""
    
    url = base_url + API_ENDPOINT
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    # Construir mensaje (con o sin imagen)
    message = build_message_with_image(prompt, image_path)
    
    data = {
        "model": model_name,
        "messages": [message],
        "temperature": 0.7,
        "stream": False
    }
    
    print(f"\n{'='*60}")
    print(f"Probando modelo (sin stream): {model_name}")
    print(f"Prompt: {prompt}")
    if image_path:
        print(f"Imagen: {image_path}")
    print(f"{'='*60}")
    
    if show_raw:
        print("\n[MODO RAW - Mostrando respuesta sin procesar]")
    
    start_time = time.time()
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=3600)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                
                print("\nRespuesta del modelo:")
                print("-" * 60)
                
                # Modo RAW muestra TODO (incluyendo reasoning)
                if show_raw:
                    print(content)
                else:
                    parsed = extract_thinking_content(content)
                    
                    if parsed['has_thinking']:
                        if show_thinking:
                            print(f"\n[THINKING]\n{parsed['thinking']}\n")
                        print(f"[OUTPUT]\n{parsed['output']}")
                    else:
                        print(content)
                
                print("-" * 60)
                
                # Analizar respuesta
                parsed = extract_thinking_content(content)
                if parsed['has_thinking']:
                    print(f"\n[INFO] Respuesta contiene reasoning (<think> tags)")
                    print(f"  Reasoning: {len(parsed['thinking'])} chars")
                    print(f"  Output: {len(parsed['output'])} chars")
                
                print(f"[OK] Respuesta recibida")
                print(f"  Tiempo: {elapsed:.2f}s")
                print(f"  Tokens usados: {result.get('usage', {})}")
                return True
            else:
                print(f"[ERROR] Respuesta sin contenido: {result}")
                return False
        else:
            print(f"\n[ERROR] Error {response.status_code} (tiempo: {elapsed:.2f}s)")
            print(f"Respuesta: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"\n[ERROR] Timeout despues de 3600 segundos")
        return False
    except Exception as e:
        print(f"\n[ERROR] Error inesperado: {e}")
        return False


# ------------------------------------------------------------------
# 8. Script principal
# ------------------------------------------------------------------
def main():
    print("\n" + "="*60)
    print("TEST DE SERVIDORES MODAL - CULTURISTAS LLM")
    print("="*60)
    
    # Seleccionar qué probar
    print("\nSelecciona que servidor probar:")
    print("1. Multimodal Instruct (Qwen3-VL-4B-Instruct)")
    print("2. Multimodal Thinking (Qwen3-VL-4B-Thinking)")
    print("3. Ambos")
    print("4. Solo inspeccionar formato de modelos")
    
    choice = input("\nElige una opcion (1/2/3/4): ").strip()
    
    servers_to_test = []
    
    if choice == "1":
        servers_to_test = [(BASE_URL_MULTIMODAL_INSTRUCT, "Qwen/Qwen3-VL-4B-Instruct", "Multimodal Instruct")]
    elif choice == "2":
        servers_to_test = [(BASE_URL_MULTIMODAL_THINKING, "Qwen/Qwen3-VL-4B-Thinking", "Multimodal Thinking")]
    elif choice == "3":
        servers_to_test = [
            (BASE_URL_MULTIMODAL_INSTRUCT, "Qwen/Qwen3-VL-4B-Instruct", "Multimodal Instruct"),
            (BASE_URL_MULTIMODAL_THINKING, "Qwen/Qwen3-VL-4B-Thinking", "Multimodal Thinking")
        ]
    elif choice == "4":
        # Solo inspeccionar
        print("\n[MODO INSPECCION] Solo consultando formato de modelos")
        for base_url, model_name, server_name in [
            (BASE_URL_MULTIMODAL_INSTRUCT, "Qwen/Qwen3-VL-4B-Instruct", "Multimodal Instruct"),
            (BASE_URL_MULTIMODAL_THINKING, "Qwen/Qwen3-VL-4B-Thinking", "Multimodal Thinking")
        ]:
            print(f"\n{'#'*60}")
            print(f"# INSPECCIONANDO: {server_name}")
            print(f"{'#'*60}")
            
            if health_check(base_url, server_name):
                get_model_info(base_url, server_name)
                inspect_chat_completions_schema(base_url, server_name, model_name)
        return
    else:
        print("Opcion invalida. Saliendo...")
        sys.exit(1)
    
    # Antes de las pruebas, inspeccionar el modelo
    print("\n" + "="*60)
    print("INSPECCION DE MODELOS")
    print("="*60)
    
    for base_url, model_name, server_name in servers_to_test:
        if health_check(base_url, server_name):
            get_model_info(base_url, server_name)
            inspect_chat_completions_schema(base_url, server_name, model_name)
    
    # Continuar con las pruebas normales
    input("\n[ENTER] Presiona ENTER para continuar con las pruebas...")
    
    # Opciones de visualización
    print("\nOpciones de visualizacion:")
    print("1. Normal (ocultar reasoning en Thinking)")
    print("2. Mostrar reasoning")
    print("3. Mostrar RAW (sin procesar - incluye reasoning)")
    
    view_choice = input("\nElige visualizacion (1/2/3, default=1): ").strip() or "1"
    
    show_thinking = view_choice == "2"
    show_raw = view_choice == "3"
    
    # Preguntar si quiere probar con imagen
    test_with_image = input("\nQuieres probar con imagen? (s/n, default=n): ").strip().lower() == 's'
    image_path = None
    
    if test_with_image:
        image_path = input("Ruta de la imagen: ").strip()
        if not Path(image_path).exists():
            print(f"[ERROR] Imagen no encontrada: {image_path}")
            return
    
    servers_to_test = []
    
    if choice == "1":
        servers_to_test = [(BASE_URL_MULTIMODAL_INSTRUCT, "Qwen/Qwen3-VL-4B-Instruct", "Multimodal Instruct")]
    elif choice == "2":
        servers_to_test = [(BASE_URL_MULTIMODAL_THINKING, "Qwen/Qwen3-VL-4B-Thinking", "Multimodal Thinking")]
    elif choice == "3":
        servers_to_test = [
            (BASE_URL_MULTIMODAL_INSTRUCT, "Qwen/Qwen3-VL-4B-Instruct", "Multimodal Instruct"),
            (BASE_URL_MULTIMODAL_THINKING, "Qwen/Qwen3-VL-4B-Thinking", "Multimodal Thinking")
        ]
    else:
        print("Opcion invalida. Saliendo...")
        sys.exit(1)
    
    # Prompts de prueba
    if test_with_image:
        test_prompts = [
            "Describe brevemente que ves en esta imagen",
            "Analiza esta imagen en detalle y describe todos los elementos que observas"
        ]
    else:
        test_prompts = [
            "Hola, responde solo con una frase: Estas funcionando?",
            "Resuelve este problema paso a paso: Si tengo 5 manzanas y compro 3 mas, cuantas tengo?"
        ]
    
    results = {}
    
    for base_url, model_name, server_name in servers_to_test:
        print(f"\n\n{'#'*60}")
        print(f"# PROBANDO: {server_name}")
        print(f"{'#'*60}")
        
        # Health check
        is_healthy = health_check(base_url, server_name)
        
        if not is_healthy:
            print(f"\n[AVISO] {server_name} no esta disponible. Saltando pruebas...")
            results[server_name] = "No disponible"
            continue
        
        # Pruebas con streaming
        print("\n[STREAMING] Pruebas con STREAMING")
        stream_success = test_model_stream(
            base_url, model_name, test_prompts[0],
            image_path=image_path,
            show_thinking=show_thinking, 
            show_raw=show_raw
        )
        
        time.sleep(1)
        
        # Pruebas sin streaming
        print("\n[NO-STREAM] Pruebas sin STREAMING")
        no_stream_success = test_model_no_stream(
            base_url, model_name, test_prompts[1],
            image_path=image_path,
            show_thinking=show_thinking, 
            show_raw=show_raw
        )
        
        results[server_name] = "OK" if (stream_success and no_stream_success) else "FALLOS"
    
    # Resumen final
    print("\n\n" + "="*60)
    print("RESUMEN DE PRUEBAS")
    print("="*60)
    for server, status in results.items():
        prefix = "[OK]" if status == "OK" else "[ERROR]"
        print(f"{prefix} {server}: {status}")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()