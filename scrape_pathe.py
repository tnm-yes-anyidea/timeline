import json
import os
import re
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import yt_dlp

START_YEAR = 1896
END_YEAR = 1980
MAX_WORKERS = 4
MAX_DURATION = 900
JSON_OUTPUT = "british_pathe_by_year.json"

YEAR_REGEX = re.compile(r"\((\d{4})(?:-\d{4})?\)")
lock = threading.Lock()


def load_firefox_cookiejar():
    print("[1/3] Reading Firefox cookies into memory...")
    try:
        from yt_dlp.cookies import extract_cookies_from_browser
        jar = extract_cookies_from_browser("firefox")
        print(f"      Loaded {len(jar)} cookies from Firefox!")
        return jar
    except Exception as e:
        print(f"      Warning: Could not read Firefox cookies ({e}). Continuing without cookies...")
        return None


def scrape_year(year: int, shared_cookiejar) -> list[dict]:
    url = f"https://www.youtube.com/@britishpathe/search?query=%28{year}%29"

    ydl_opts = {
        "extract_flat": True,
        "quiet": True,
        "no_warnings": True,
        "ignoreerrors": True,
        "retries": 15,
        "extractor_retries": 15,
        "sleep_interval_requests": 0.2,
        "retry_sleep_functions": {
            "http": lambda n: min(2 ** n, 60),
            "extractor": lambda n: min(2 ** n, 60),
        },
    }

    results = []
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        if shared_cookiejar is not None:
            with lock:
                ydl.cookiejar = shared_cookiejar

        info = ydl.extract_info(url, download=False)
        if not info or "entries" not in info:
            return results

        for entry in info["entries"]:
            if not entry:
                continue
            vid_id = entry.get("id")
            title = entry.get("title") or ""
            duration = entry.get("duration")

            match = YEAR_REGEX.search(title)
            if not vid_id or not match:
                continue

            if duration is not None and duration > MAX_DURATION:
                continue

            extracted_year = int(match.group(1))
            clean_title = YEAR_REGEX.sub("", title).replace("| British Pathé", "").strip()

            results.append({
                "id": vid_id,
                "year": extracted_year,
                "title": title,
                "cleanTitle": clean_title,
                "duration": duration,
                "url": f"https://www.youtube.com/watch?v={vid_id}",
                "thumbnail": f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg"
            })

    return results


def save_json(grouped_by_year: dict):
    sorted_output = {}
    for yr in sorted(grouped_by_year.keys(), key=lambda y: int(y)):
        sorted_output[yr] = sorted(
            grouped_by_year[yr],
            key=lambda v: v["cleanTitle"]
        )
    temp_file = JSON_OUTPUT + ".tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(sorted_output, f, ensure_ascii=False, indent=2)
    os.replace(temp_file, JSON_OUTPUT)


def main():
    grouped_by_year: dict[str, list[dict]] = {}
    seen_ids = set()

    if os.path.exists(JSON_OUTPUT):
        try:
            with open(JSON_OUTPUT, "r", encoding="utf-8") as f:
                grouped_by_year = json.load(f)
            for yr, vids in grouped_by_year.items():
                for v in vids:
                    seen_ids.add(v["id"])
            print(f"[Resume] Loaded {len(seen_ids)} existing newsreels from {JSON_OUTPUT}")
        except Exception:
            grouped_by_year = {}

    cookiejar = load_firefox_cookiejar()
    years = [y for y in range(START_YEAR, END_YEAR + 1) if str(y) not in grouped_by_year]

    if not years:
        print("All years (1896–1980) are already in the JSON file!")
        return

    print(f"[2/3] Scraping {len(years)} remaining years across {MAX_WORKERS} parallel workers...")

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_year = {executor.submit(scrape_year, y, cookiejar): y for y in years}
        for count, future in enumerate(as_completed(future_to_year), 1):
            yr = future_to_year[future]
            try:
                videos = future.result()
                added = 0
                with lock:
                    grouped_by_year.setdefault(str(yr), [])
                    for v in videos:
                        if v["id"] not in seen_ids:
                            seen_ids.add(v["id"])
                            target_yr = str(v["year"])
                            grouped_by_year.setdefault(target_yr, []).append(v)
                            added += 1
                    save_json(grouped_by_year)
                print(f"  [{count}/{len(years)}] Year ({yr}) saved -> +{added} newsreels (Total: {len(seen_ids)})")
            except Exception as exc:
                print(f"  [{count}/{len(years)}] Year ({yr}) error: {exc}")

    print(f"[3/3] Done! {len(seen_ids)} total newsreels saved to {JSON_OUTPUT}.")


if __name__ == "__main__":
    main()
