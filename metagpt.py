"""
轻量级多代理开发助手
用法: python metagpt.py "你的需求"
"""
import sys
import io
import os
import json
from pathlib import Path
from datetime import datetime

import httpx
import yaml

# Windows UTF-8
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

CONFIG_PATH = Path.home() / ".metagpt" / "config2.yaml"
PROJECT_ROOT = Path(__file__).parent
OUTPUT_DIR = PROJECT_ROOT / "metagpt-output"

def load_config():
    with open(CONFIG_PATH, encoding='utf-8') as f:
        return yaml.safe_load(f)

def call_llm(config, messages):
    base = config['llm']['base_url'].rstrip('/')
    api_type = config['llm'].get('api_type', 'openai')

    if api_type == 'anthropic':
        url = f"{base}/v1/messages"
        system_msg = ""
        user_msgs = []
        for m in messages:
            if m["role"] == "system":
                system_msg = m["content"]
            else:
                user_msgs.append(m)
        headers = {
            "x-api-key": config['llm']['api_key'],
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        body = {
            "model": config['llm']['model'],
            "max_tokens": 4096,
            "system": system_msg,
            "messages": user_msgs
        }
    else:
        url = f"{base}/chat/completions"
        headers = {
            "Authorization": f"Bearer {config['llm']['api_key']}",
            "Content-Type": "application/json"
        }
        body = {
            "model": config['llm']['model'],
            "messages": messages,
            "max_tokens": 4096
        }

    resp = httpx.post(url, headers=headers, json=body, timeout=120)
    if resp.status_code != 200:
        print(f"API 错误 {resp.status_code}: {resp.text[:500]}")
        sys.exit(1)

    data = resp.json()
    return data["content"][0]["text"] if api_type == 'anthropic' else data["choices"][0]["message"]["content"]

def get_project_context():
    context_parts = []
    for fp in ["client/src/types/index.ts", "client/src/router/index.ts", "supabase/schema.sql", "server/src/index.ts"]:
        full = PROJECT_ROOT / fp
        if full.exists():
            context_parts.append(f"=== {fp} ===\n{full.read_text(encoding='utf-8')[:1500]}")
    return "\n\n".join(context_parts)

AGENTS = {
    "pm": {"name": "产品经理", "system": "你是产品经理，分析需求输出功能列表和验收标准。用中文，简洁明了。考虑现有架构（Vue3+Express+Supabase）。"},
    "architect": {"name": "架构师", "system": "你是架构师，设计技术方案。用中文，列出需修改的文件、数据变更、实现步骤。简洁。"},
    "engineer": {"name": "工程师", "system": "你是全栈工程师，写代码。用中文注释，遵循项目风格（Vue3 Composition API + Pinia + TypeScript）。每个文件用 ```filepath 标注。完整代码不省略。"},
    "reviewer": {"name": "审查员", "system": "你是代码审查员。用中文，检查bug/安全/性能问题。没问题直接说审查通过。"}
}

def run(task, save=True):
    config = load_config()
    context = get_project_context()
    results = {}

    steps = [
        ("pm", task, context),
        ("architect", None, context),
        ("engineer", None, context),
        ("reviewer", None, context),
    ]

    for i, (role, user_msg, ctx) in enumerate(steps):
        agent = AGENTS[role]
        print(f"\n[{i+1}/4] {agent['name']}...")

        if role == "architect":
            user_msg = f"需求:\n{results['pm']}\n\n请设计实现方案"
        elif role == "engineer":
            user_msg = f"设计方案:\n{results['architect']}\n\n请编写完整代码"
        elif role == "reviewer":
            user_msg = f"代码:\n{results['engineer']}\n\n请审查"

        messages = [
            {"role": "system", "content": agent["system"]},
            {"role": "user", "content": f"项目上下文:\n{ctx}\n\n{user_msg}"}
        ]

        result = call_llm(config, messages)
        results[role] = result
        print(f"    完成 ({len(result)} 字)")

    # 保存到文件
    if save:
        OUTPUT_DIR.mkdir(exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        outfile = OUTPUT_DIR / f"{ts}.md"
        with open(outfile, "w", encoding="utf-8") as f:
            f.write(f"# {task}\n\n")
            for role in ["pm", "architect", "engineer", "reviewer"]:
                f.write(f"## {AGENTS[role]['name']}\n\n{results[role]}\n\n---\n\n")
        print(f"\n结果已保存: {outfile}")

    return results

def main():
    task = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else None

    if not task:
        task = input("请输入需求: ").strip()
        if not task:
            print("不能为空")
            sys.exit(1)

    print(f"任务: {task}")
    run(task)

if __name__ == "__main__":
    main()
