import modal
import os

MODEL_INSTRUCT = "Qwen/Qwen3-4B-Instruct-2507"
MODEL_THINKING = "Qwen/Qwen3-4B-Thinking-2507"
MODEL_MULTIMODAL_INSTRUCT = "Qwen/Qwen3-VL-4B-Instruct"
MODEL_MULTIMODAL_THINKING = "Qwen/Qwen3-VL-4B-Thinking"

GPU_CONFIG_TIER_1 = "T4"
GPU_CONFIG_TIER_2 = "L4"
GPU_CONFIG_TIER_3 = "A10G"
GPU_CONFIG_TIER_4 = "L40S"
GPU_CONFIG_TIER_5 = "A100-40GB"
GPU_CONFIG_TIER_6 = "A100-80GB"
GPU_CONFIG_TIER_7 = "H100"
GPU_CONFIG_TIER_8 = "H200"
GPU_CONFIG_TIER_9 = "B200"
VLLM_PORT = 8000
VLLM_MAX_MODEL_LENGTH = 5000
MINUTES = 60
BASE_CUDA_IMAGE = "nvidia/cuda:12.8.0-devel-ubuntu22.04"
PYTHON_VERSION = "3.12"
FAST_BOOT = True
MIN_CONTAINERS = 0
SCALEDOWN_WINDOW = 15 * MINUTES
ENABLE_MEMORY_SNAPSHOT = True

MAX_INPUTS_MODEL_INSTRUCT = 16
MAX_INPUTS_MODEL_THINKING = 16
MAX_INPUTS_MULTIMODEL_INSTRUCT = 16
MAX_INPUTS_MULTIMODEL_THINKING = 16

vllm_image = (
    modal.Image.from_registry(BASE_CUDA_IMAGE, add_python=PYTHON_VERSION)
    .entrypoint([])
    .uv_pip_install(
        "vllm",
        "huggingface-hub",
        "flashinfer-python",
    )
    .env({"HF_XET_HIGH_PERFORMANCE": "1"})
)

app = modal.App("culturistas-llm")

hf_cache_vol = modal.Volume.from_name("culturistas-hf-cache", create_if_missing=True)
vllm_cache_vol = modal.Volume.from_name("culturistas-vllm-cache", create_if_missing=True)

# Context windows
# 8192 for the text models seems fine!
# 5088 for the T4 is the max for multimodal, using 5000 instead.
def build_vllm_command(model_name: str, api_key: str) -> list[str]:
    """
    Builds the vLLM command.
    """
    cmd = [
        "vllm",
        "serve",
        "--uvicorn-log-level=info",
        model_name,
        "--served-model-name",
        model_name,
        "--host",
        "0.0.0.0",
        "--port",
        str(VLLM_PORT),
        "--max-model-len",
        str(VLLM_MAX_MODEL_LENGTH),
        "--trust-remote-code",
        "--dtype",
        "float16",
        "--gpu-memory-utilization",
        "0.90",
        "--api-key",
        api_key,
    ]
    if FAST_BOOT:
        cmd.append("--enforce-eager")
    return cmd

"""
# Server 1: Instruct
@app.function(
    image=vllm_image,
    gpu=GPU_CONFIG_TIER_1,
    min_containers=MIN_CONTAINERS,
    scaledown_window=SCALEDOWN_WINDOW,
    timeout=10 * MINUTES,
    enable_memory_snapshot=ENABLE_MEMORY_SNAPSHOT,
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
        "/root/.cache/vllm": vllm_cache_vol,
    },
    secrets=[modal.Secret.from_name("llm-secret")],
)
@modal.concurrent(
    max_inputs=32
)
@modal.web_server(port=VLLM_PORT, startup_timeout=10 * MINUTES)
def serve_instruct():
    import subprocess
    api_key = os.environ.get("VLLM_API_KEY", "super-secret-token-default")
    cmd = build_vllm_command(MODEL_INSTRUCT, api_key)
    print(f"Starting vLLM for {MODEL_INSTRUCT}...")
    print(" ".join(cmd))
    subprocess.Popen(" ".join(cmd), shell=True)
"""

"""
# Server 2: Thinking
@app.function(
    image=vllm_image,
    gpu=GPU_CONFIG_TIER_1,
    min_containers=MIN_CONTAINERS,
    scaledown_window=SCALEDOWN_WINDOW,
    timeout=10 * MINUTES,
    enable_memory_snapshot=ENABLE_MEMORY_SNAPSHOT,
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
        "/root/.cache/vllm": vllm_cache_vol,
    },
    secrets=[modal.Secret.from_name("llm-secret")],
)
@modal.concurrent(
    max_inputs=16
)
@modal.web_server(port=VLLM_PORT, startup_timeout=10 * MINUTES)
def serve_thinking():
    import subprocess
    api_key = os.environ.get("VLLM_API_KEY", "super-secret-token-default")
    cmd = build_vllm_command(MODEL_THINKING, api_key)
    print(f"Starting vLLM for {MODEL_THINKING}...")
    print(" ".join(cmd))
    subprocess.Popen(" ".join(cmd), shell=True)
"""

# Server 3: Instruct Multimodal
@app.function(
    image=vllm_image,
    gpu=GPU_CONFIG_TIER_1,
    min_containers=MIN_CONTAINERS,
    scaledown_window=SCALEDOWN_WINDOW,
    timeout=10 * MINUTES,
    enable_memory_snapshot=ENABLE_MEMORY_SNAPSHOT,
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
        "/root/.cache/vllm": vllm_cache_vol,
    },
    secrets=[modal.Secret.from_name("llm-secret")],
)
@modal.concurrent(
    max_inputs=MAX_INPUTS_MULTIMODEL_INSTRUCT
)
@modal.web_server(port=VLLM_PORT, startup_timeout=15 * MINUTES)
def serve_multimodal_instruct():
    import subprocess
    api_key = os.environ.get("VLLM_API_KEY", "super-secret-token-default")
    cmd = build_vllm_command(MODEL_MULTIMODAL_INSTRUCT, api_key)
    print(f"Starting vLLM for {MODEL_MULTIMODAL_INSTRUCT}...")
    print(" ".join(cmd))
    subprocess.Popen(" ".join(cmd), shell=True)

# Server 4: Thinking Multimodal
@app.function(
    image=vllm_image,
    gpu=GPU_CONFIG_TIER_1,
    min_containers=MIN_CONTAINERS,
    scaledown_window=SCALEDOWN_WINDOW,
    timeout=10 * MINUTES,
    enable_memory_snapshot=ENABLE_MEMORY_SNAPSHOT,
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
        "/root/.cache/vllm": vllm_cache_vol,
    },
    secrets=[modal.Secret.from_name("llm-secret")],
)
@modal.concurrent(
    max_inputs=MAX_INPUTS_MULTIMODEL_THINKING
)
@modal.web_server(port=VLLM_PORT, startup_timeout=15 * MINUTES)
def serve_multimodal_thinking():
    import subprocess
    api_key = os.environ.get("VLLM_API_KEY", "super-secret-token-default")
    cmd = build_vllm_command(MODEL_MULTIMODAL_THINKING, api_key)
    print(f"Starting vLLM for {MODEL_MULTIMODAL_THINKING}...")
    print(" ".join(cmd))
    subprocess.Popen(" ".join(cmd), shell=True)