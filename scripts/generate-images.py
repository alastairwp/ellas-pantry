#!/usr/bin/env python3
"""
Local AI recipe image generator.

Fetches AI-generated recipes that need images from the database,
generates food photography using Stable Diffusion SDXL Turbo locally,
and uploads them to the app via API.

Usage:
    python generate-images.py --limit 50 --api-url http://localhost:3003
    python generate-images.py --limit 50 --api-url https://ellaspantry.com
    python generate-images.py --slugs thai-green-curry chocolate-lava-cake --api-url http://localhost:3003
    python generate-images.py --limit 10 --save-only  # Just save to generated-images/
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


def get_db_connection():
    """Connect to PostgreSQL using DATABASE_URL from .env."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL not set in .env")
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


def build_prompt(title, description, ingredients):
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
        "overhead angle, appetizing, high detail, warm tones"
    )
    return prompt


NEGATIVE_PROMPT = (
    "text, watermark, logo, blurry, cartoon, illustration, drawing, "
    "ugly, deformed, disfigured, low quality, bad anatomy, "
    "oversaturated, underexposed"
)


def load_model():
    """Load SDXL Turbo model for Apple Silicon (MPS)."""
    print("Loading SDXL Turbo model (first run downloads ~5GB)...")
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
        "stabilityai/sdxl-turbo",
        torch_dtype=dtype,
        variant="fp16" if dtype == torch.float16 else None,
    )
    pipe = pipe.to(device)

    # Disable safety checker for food images (it can false-positive on close-up food)
    pipe.safety_checker = None

    print(f"Model loaded on {device}")
    return pipe


def generate_image(pipe, prompt):
    """Generate a single image from a prompt."""
    import torch

    result = pipe(
        prompt=prompt,
        negative_prompt=NEGATIVE_PROMPT,
        num_inference_steps=4,  # SDXL Turbo needs only 1-4 steps
        guidance_scale=0.0,  # SDXL Turbo works best with 0 guidance
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
        allow_redirects=False,
    )

    if resp.status_code in (200, 302):
        print("Authenticated successfully")
        return session
    else:
        print(f"Authentication failed: {resp.status_code}")
        return None


def upload_image(session, api_url, recipe_id, image_bytes):
    """Upload image to the app via API."""
    files = {"file": ("image.webp", image_bytes, "image/webp")}
    data = {"recipeId": str(recipe_id)}

    resp = session.post(
        f"{api_url}/api/admin/upload-image-by-id",
        files=files,
        data=data,
    )

    if resp.status_code == 200:
        return resp.json()
    else:
        print(f"  Upload failed: {resp.status_code} {resp.text[:200]}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Generate recipe images locally")
    parser.add_argument("--limit", type=int, default=50, help="Max recipes to process")
    parser.add_argument("--api-url", type=str, help="App URL for auto-upload")
    parser.add_argument("--email", type=str, help="Admin email for auth")
    parser.add_argument("--password", type=str, help="Admin password for auth")
    parser.add_argument("--slugs", nargs="+", help="Specific recipe slugs to process")
    parser.add_argument("--save-only", action="store_true", help="Save to folder, don't upload")
    parser.add_argument("--output-dir", type=str, default="generated-images", help="Output directory")
    args = parser.parse_args()

    # Ensure output directory exists
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)

    # Log file
    log_path = output_dir / "generation-log.jsonl"

    # Connect to database
    print("Connecting to database...")
    conn = get_db_connection()

    # Fetch pending recipes
    recipes = fetch_pending_recipes(conn, args.limit, slugs=args.slugs)
    print(f"Found {len(recipes)} recipes needing images")

    if not recipes:
        print("No recipes need images. Done!")
        conn.close()
        return

    # Set up auto-upload if requested
    session = None
    if args.api_url and not args.save_only:
        email = args.email or input("Admin email: ")
        password = args.password or input("Admin password: ")
        session = authenticate(args.api_url, email, password)
        if not session:
            print("Failed to authenticate. Falling back to save-only mode.")

    # Load the model
    pipe = load_model()

    # Generate images
    success = 0
    failed = 0

    for i, recipe in enumerate(recipes):
        print(f"\n[{i + 1}/{len(recipes)}] {recipe['title']}")

        try:
            # Build prompt
            prompt = build_prompt(
                recipe["title"],
                recipe["description"],
                recipe["ingredients"],
            )
            print(f"  Prompt: {prompt[:100]}...")

            # Generate
            start = time.time()
            image = generate_image(pipe, prompt)
            elapsed = time.time() - start
            print(f"  Generated in {elapsed:.1f}s")

            # Resize to target
            image = resize_to_target(image)

            # Save locally
            local_path = output_dir / f"{recipe['slug']}.webp"
            save_as_webp(image, local_path)
            print(f"  Saved: {local_path}")

            # Upload if session available
            if session and args.api_url:
                buf = io.BytesIO()
                image.save(buf, "WebP", quality=80)
                buf.seek(0)
                result = upload_image(session, args.api_url, recipe["id"], buf.read())
                if result:
                    print(f"  Uploaded: {result.get('path')}")
                else:
                    print("  Upload failed, image saved locally")

            # Mark as generated in database
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

    conn.close()
    print(f"\nDone! Generated: {success}, Failed: {failed}")
    print(f"Images saved to: {output_dir}/")


if __name__ == "__main__":
    main()
