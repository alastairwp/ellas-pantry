#!/usr/bin/env python3
"""
Local AI recipe image generator.

Fetches AI-generated recipes that need images from the database,
generates food photography using Stable Diffusion locally,
and uploads them to the app via API.

Supports two models:
  - sdxl-turbo: Fast (~3-5s/image), lower quality, weak negative prompt support
  - sdxl:       Slower (~30-60s/image), higher quality, strong negative prompt support

Usage:
    python generate-images.py --limit 50 --api-url http://localhost:3003
    python generate-images.py --model sdxl --limit 50 --api-url https://www.ellaspantry.co.uk
    python generate-images.py --slugs thai-green-curry chocolate-lava-cake --api-url http://localhost:3003
    python generate-images.py --limit 10 --save-only  # Just save to generated-images/
    python generate-images.py --watch --api-url http://localhost:3003  # Continuous mode
"""

import argparse
import io
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import psycopg2
import requests
from dotenv import load_dotenv
from PIL import Image

# Load .env from project root
load_dotenv(Path(__file__).parent.parent / ".env")


def get_db_connection(db_url=None):
    """Connect to PostgreSQL using provided URL or DATABASE_URL from .env."""
    url = db_url or os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL not set in .env and --db-url not provided")
        sys.exit(1)
    return psycopg2.connect(url)


def fetch_pending_recipes(conn, limit, slugs=None):
    """Fetch recipes that need images.

    If slugs are provided, fetch those specific recipes.
    Otherwise, fetch recipes with imageStatus = 'pending'.
    """
    cur = conn.cursor()

    if slugs:
        cur.execute(
            """
            SELECT r.id, r.slug, r.title, r.description,
                   ARRAY_AGG(i.name ORDER BY ri."orderIndex") AS ingredients
            FROM "Recipe" r
            LEFT JOIN "RecipeIngredient" ri ON ri."recipeId" = r.id
            LEFT JOIN "Ingredient" i ON i.id = ri."ingredientId"
            WHERE r.slug = ANY(%s)
            GROUP BY r.id
            ORDER BY r.id ASC
            """,
            (slugs,),
        )
    else:
        cur.execute(
            """
            SELECT r.id, r.slug, r.title, r.description,
                   ARRAY_AGG(i.name ORDER BY ri."orderIndex") AS ingredients
            FROM "Recipe" r
            LEFT JOIN "RecipeIngredient" ri ON ri."recipeId" = r.id
            LEFT JOIN "Ingredient" i ON i.id = ri."ingredientId"
            WHERE r."imageStatus" = 'pending'
            GROUP BY r.id
            ORDER BY r.id ASC
            LIMIT %s
            """,
            (limit,),
        )

    rows = cur.fetchall()
    cur.close()
    return [
        {
            "id": row[0],
            "slug": row[1],
            "title": row[2],
            "description": row[3],
            "ingredients": [x for x in (row[4] or []) if x],
        }
        for row in rows
    ]


def fetch_image_gen_settings(conn):
    """Fetch custom prompt settings from the database."""
    cur = conn.cursor()
    cur.execute(
        """SELECT key, value FROM "Setting" WHERE key IN ('image-gen-extra-prompt', 'image-gen-extra-negative', 'image-gen-model')"""
    )
    settings = dict(cur.fetchall())
    cur.close()
    return {
        "extra_prompt": (settings.get("image-gen-extra-prompt") or "").strip(),
        "extra_negative": (settings.get("image-gen-extra-negative") or "").strip(),
        "model": (settings.get("image-gen-model") or "sdxl").strip(),
    }


def build_prompt(title, description, ingredients, extra_prompt=""):
    """Build a Stable Diffusion prompt from recipe data."""
    ing_text = ", ".join(ingredients[:5]) if ingredients else ""
    prompt = (
        f"Professional food photography of {title}, "
        f"beautifully plated and styled"
    )
    if ing_text:
        prompt += f", made with {ing_text}"
    prompt += (
        ", on a rustic wooden table, "
        "natural window lighting, shallow depth of field, "
        "appetizing, high detail, warm tones"
    )
    if extra_prompt:
        prompt += f", {extra_prompt}"
    return prompt


BASE_NEGATIVE_PROMPT = (
    "text, watermark, logo, blurry, cartoon, illustration, drawing, "
    "ugly, deformed, disfigured, low quality, bad anatomy, "
    "oversaturated, underexposed"
)


def build_negative_prompt(extra_negative=""):
    """Build the full negative prompt."""
    if extra_negative:
        return f"{BASE_NEGATIVE_PROMPT}, {extra_negative}"
    return BASE_NEGATIVE_PROMPT


MODEL_CONFIGS = {
    "sdxl-turbo": {
        "repo": "stabilityai/sdxl-turbo",
        "num_inference_steps": 4,
        "guidance_scale": 1.5,
        "label": "SDXL Turbo (fast, ~3-5s/image)",
    },
    "sdxl": {
        "repo": "stabilityai/stable-diffusion-xl-base-1.0",
        "num_inference_steps": 30,
        "guidance_scale": 7.5,
        "label": "SDXL 1.0 (high quality, ~30-60s/image)",
    },
}


def load_model(model_name):
    """Load a Stable Diffusion model by name."""
    config = MODEL_CONFIGS[model_name]
    print(f"Loading {config['label']} (first run downloads model)...")
    import torch
    from diffusers import AutoPipelineForText2Image

    # Use MPS (Metal Performance Shaders) on Apple Silicon
    if torch.backends.mps.is_available():
        device = "mps"
        dtype = torch.float16
    elif torch.cuda.is_available():
        device = "cuda"
        dtype = torch.float16
    else:
        device = "cpu"
        dtype = torch.float32
        print("WARNING: No GPU detected. Generation will be very slow on CPU.")

    pipe = AutoPipelineForText2Image.from_pretrained(
        config["repo"],
        torch_dtype=dtype,
        variant="fp16" if dtype == torch.float16 else None,
    )
    pipe = pipe.to(device)

    # Disable safety checker for food images (it can false-positive on close-up food)
    pipe.safety_checker = None

    print(f"Model loaded on {device}")
    return pipe


def generate_image(pipe, prompt, negative_prompt, model_name):
    """Generate a single image from a prompt."""
    import torch

    config = MODEL_CONFIGS[model_name]
    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_inference_steps=config["num_inference_steps"],
        guidance_scale=config["guidance_scale"],
        width=768,
        height=1024,  # Portrait orientation (close to 2:3 ratio)
    )
    return result.images[0]


def resize_to_target(image, width=1200, height=1800):
    """Resize image to target dimensions."""
    return image.resize((width, height), Image.LANCZOS)


def save_as_webp(image, path, quality=80):
    """Save image as WebP."""
    image.save(path, "WebP", quality=quality)


def authenticate(api_url, email, password):
    """Authenticate with the app and return session cookies."""
    session = requests.Session()

    # Use NextAuth's credentials sign-in
    csrf_resp = session.get(f"{api_url}/api/auth/csrf")
    if csrf_resp.status_code != 200 or "json" not in csrf_resp.headers.get("content-type", ""):
        print(f"CSRF request failed (status {csrf_resp.status_code})")
        print(f"  URL: {csrf_resp.url}")
        print(f"  Content-Type: {csrf_resp.headers.get('content-type')}")
        print(f"  Body: {csrf_resp.text[:300]}")
        return None
    csrf_token = csrf_resp.json().get("csrfToken", "")

    resp = session.post(
        f"{api_url}/api/auth/callback/credentials",
        data={
            "email": email,
            "password": password,
            "csrfToken": csrf_token,
            "redirect": "false",
            "json": "true",
        },
        allow_redirects=True,
    )

    # Check we got a session cookie (authjs.session-token or __Secure- variant)
    cookie_names = [c.name for c in session.cookies]
    has_session = any("session-token" in name for name in cookie_names)

    if has_session:
        print("Authenticated successfully")
        return session
    else:
        print(f"Authentication failed (status {resp.status_code})")
        print(f"  Cookies received: {cookie_names}")
        # Verify by hitting the session endpoint
        check = session.get(f"{api_url}/api/auth/session")
        print(f"  Session check: {check.text[:200]}")
        return None


def upload_image(session, api_url, recipe_id, image_bytes, max_retries=3):
    """Upload image to the app via API with retry logic."""
    for attempt in range(1, max_retries + 1):
        try:
            files = {"file": ("image.webp", image_bytes, "image/webp")}
            data = {"recipeId": str(recipe_id)}

            resp = session.post(
                f"{api_url}/api/admin/upload-image-by-id",
                files=files,
                data=data,
                timeout=30,
            )

            if resp.status_code == 200:
                return resp.json()
            else:
                print(f"  Upload failed (attempt {attempt}/{max_retries}): {resp.status_code} {resp.text[:200]}")
        except requests.exceptions.RequestException as e:
            print(f"  Upload connection error (attempt {attempt}/{max_retries}): {e}")

        if attempt < max_retries:
            wait = attempt * 2
            print(f"  Retrying in {wait}s...")
            time.sleep(wait)

    return None


def main():
    parser = argparse.ArgumentParser(description="Generate recipe images locally")
    parser.add_argument("--limit", type=int, default=50, help="Max recipes to process")
    parser.add_argument("--api-url", type=str, help="App URL for auto-upload")
    parser.add_argument("--db-url", type=str, help="Database URL (overrides DATABASE_URL from .env)")
    parser.add_argument("--email", type=str, help="Admin email for auth")
    parser.add_argument("--password", type=str, help="Admin password for auth")
    parser.add_argument("--slugs", nargs="+", help="Specific recipe slugs to process")
    parser.add_argument("--model", type=str, choices=list(MODEL_CONFIGS.keys()), help="Model to use (overrides admin setting)")
    parser.add_argument("--save-only", action="store_true", help="Save to folder, don't upload")
    parser.add_argument("--output-dir", type=str, default="generated-images", help="Output directory")
    parser.add_argument("--watch", action="store_true", help="Continuous mode: process one at a time, poll every 60s when idle")
    parser.add_argument("--poll-interval", type=int, default=60, help="Seconds between polls in watch mode (default: 60)")
    args = parser.parse_args()

    # Ensure output directory exists
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)

    # Log file
    log_path = output_dir / "generation-log.jsonl"

    # Connect to database
    print("Connecting to database...")
    conn = get_db_connection(args.db_url)

    # Fetch pending recipes (skip in watch mode — it polls continuously)
    recipes = []
    if not args.watch:
        recipes = fetch_pending_recipes(conn, args.limit, slugs=args.slugs)
        print(f"Found {len(recipes)} recipes needing images")

        if not recipes:
            print("No recipes need images. Done!")
            conn.close()
            return

    # Set up auto-upload if requested
    session = None
    if args.api_url and not args.save_only:
        email = args.email or os.environ.get("ADMIN_EMAIL") or input("Admin email: ")
        password = args.password or os.environ.get("ADMIN_PASSWORD") or input("Admin password: ")
        session = authenticate(args.api_url, email, password)
        if not session:
            print("Failed to authenticate. Falling back to save-only mode.")

    # Fetch custom prompt settings from the admin panel
    gen_settings = fetch_image_gen_settings(conn)
    negative_prompt = build_negative_prompt(gen_settings["extra_negative"])
    model_name = args.model or gen_settings["model"]
    if model_name not in MODEL_CONFIGS:
        print(f"Unknown model '{model_name}', falling back to 'sdxl'")
        model_name = "sdxl"
    print(f"Model: {MODEL_CONFIGS[model_name]['label']}")
    if gen_settings["extra_prompt"]:
        print(f"Extra prompt: {gen_settings['extra_prompt']}")
    if gen_settings["extra_negative"]:
        print(f"Extra negative: {gen_settings['extra_negative']}")

    # Load the model
    pipe = load_model(model_name)

    # Generate images
    success = 0
    failed = 0

    def process_recipe(recipe, counter_label=""):
        """Process a single recipe. Returns True on success, False on failure."""
        nonlocal success, failed
        print(f"\n[{counter_label}] {recipe['title']}")

        try:
            # Build prompt
            prompt = build_prompt(
                recipe["title"],
                recipe["description"],
                recipe["ingredients"],
                extra_prompt=gen_settings["extra_prompt"],
            )
            print(f"  Prompt: {prompt[:100]}...")

            # Generate
            start = time.time()
            image = generate_image(pipe, prompt, negative_prompt, model_name)
            elapsed = time.time() - start
            print(f"  Generated in {elapsed:.1f}s")

            # Resize to target
            image = resize_to_target(image)

            # Save locally
            local_path = output_dir / f"{recipe['slug']}.webp"
            save_as_webp(image, local_path)
            print(f"  Saved: {local_path}")

            # Upload if session available
            result = None
            if session and args.api_url:
                buf = io.BytesIO()
                image.save(buf, "WebP", quality=80)
                buf.seek(0)
                result = upload_image(session, args.api_url, recipe["id"], buf.read())
                if result:
                    print(f"  Uploaded: {result.get('path')}")
                else:
                    print("  Upload failed, image saved locally")

            # Note: imageStatus is now set to 'generated' by the upload API endpoint.
            # For save-only mode, update the DB directly.
            if not session or not args.api_url:
                update_cur = conn.cursor()
                update_cur.execute(
                    """UPDATE "Recipe" SET "imageStatus" = 'generated' WHERE id = %s""",
                    (recipe["id"],),
                )
                conn.commit()
                update_cur.close()

            # Log success
            log_entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "id": recipe["id"],
                "slug": recipe["slug"],
                "title": recipe["title"],
                "status": "success",
                "file": str(local_path),
                "generation_time": round(elapsed, 1),
                "uploaded": bool(session and args.api_url and result),
            }
            with open(log_path, "a") as f:
                f.write(json.dumps(log_entry) + "\n")

            success += 1
            return True

        except Exception as e:
            print(f"  ERROR: {e}")
            # Log failure
            log_entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "id": recipe["id"],
                "slug": recipe["slug"],
                "title": recipe["title"],
                "status": "failed",
                "error": str(e),
            }
            with open(log_path, "a") as f:
                f.write(json.dumps(log_entry) + "\n")

            failed += 1
            return False

    if args.watch:
        # Watch mode: process one at a time, poll when idle
        print(f"\nWatch mode: processing one at a time, polling every {args.poll_interval}s when idle")
        print("Press Ctrl+C to stop\n")
        try:
            while True:
                recipe_batch = fetch_pending_recipes(conn, limit=1)
                if recipe_batch:
                    process_recipe(recipe_batch[0], counter_label=f"{success + failed + 1}")
                else:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] No pending recipes. Waiting {args.poll_interval}s...")
                    time.sleep(args.poll_interval)
        except KeyboardInterrupt:
            print(f"\n\nStopped. Generated: {success}, Failed: {failed}")
    else:
        # Batch mode: process all fetched recipes
        for i, recipe in enumerate(recipes):
            process_recipe(recipe, counter_label=f"{i + 1}/{len(recipes)}")
        print(f"\nDone! Generated: {success}, Failed: {failed}")

    conn.close()
    print(f"Images saved to: {output_dir}/")


if __name__ == "__main__":
    main()
