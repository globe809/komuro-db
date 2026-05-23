#!/usr/bin/env python3
"""
Wikipedia 爬蟲 - 抓取 komuro-db 專輯、單曲的曲目資料
用法: python3 scripts/scrape_wikipedia.py [--type albums|singles|all] [--force]
"""

import json
import re
import sys
import time
import argparse
import urllib.parse
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ── 設定 ─────────────────────────────────────────────
BASE_DIR     = Path(__file__).parent.parent
SEED_ALBUMS  = BASE_DIR / "src/utils/seedAlbums.json"
SEED_SINGLES = BASE_DIR / "src/utils/seedSingles.json"

WIKI_API      = "https://ja.wikipedia.org/w/api.php"
WIKI_BASE     = "https://ja.wikipedia.org/wiki/"
HEADERS       = {"User-Agent": "komuro-db-scraper/1.0 (https://github.com/globe809/komuro-db)"}
REQUEST_DELAY = 1.5   # 每次請求間隔（秒）

# ── 文字工具 ──────────────────────────────────────────

def normalize(text: str) -> str:
    text = text.replace("　", " ").replace("\xa0", " ")
    return re.sub(r"\s+", " ", text).strip()

def clean_title(text: str) -> str:
    text = normalize(text)
    # 移除所有日文引用符（位置不限）
    text = re.sub(r"[「」『』【】〈〉]", "", text)
    text = re.sub(r"^\d+[\.、]\s*", "", text)
    return text.strip()

def clean_credit(text: str) -> str:
    """移除信用欄位中的注記，如（#5を除く）、[注釈1] 等"""
    text = normalize(text)
    # 移除括號內的注記
    text = re.sub(r"（[^）]*）|\([^)]*\)", "", text)
    # 移除 [注釈n] 之類
    text = re.sub(r"\[.*?\]", "", text)
    return text.strip()

# ── Wikipedia API ─────────────────────────────────────

def search_wikipedia(query: str) -> list:
    params = {
        "action": "query", "list": "search",
        "srsearch": query, "format": "json",
        "srlimit": 5, "srnamespace": 0,
    }
    try:
        r = requests.get(WIKI_API, params=params, headers=HEADERS, timeout=15)
        r.raise_for_status()
        return r.json()["query"]["search"]
    except Exception:
        return []

def fetch_page(title: str):
    url = WIKI_BASE + urllib.parse.quote(title.replace(" ", "_"))
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return BeautifulSoup(r.text, "lxml")
    except Exception:
        return None

# ── 欄位辨識 ──────────────────────────────────────────

def header_to_field(text: str):
    t = text.lower().strip().rstrip("：:")
    if re.search(r"作曲.*編曲|編曲.*作曲", t):
        return "compose_arrange"
    if re.search(r"^(#|no\.?|曲順|トラック|disc|side)$", t):
        return "num"
    if re.search(r"タイトル|曲名|title", t):
        return "title"
    if re.search(r"作詞|lyric", t):
        return "lyrics"
    if re.search(r"作曲|compos|music", t):
        return "composition"
    if re.search(r"編曲|arrang", t):
        return "arrangement"
    if re.search(r"タイアップ", t):
        return "tieUp"
    return None

# ── 表格解析 ──────────────────────────────────────────

def find_header_row(rows):
    """找到含 タイトル 的標題列"""
    for row in rows[:4]:
        cells = row.find_all(["th", "td"])
        texts = [normalize(c.get_text()) for c in cells]
        if any("タイトル" in t or "曲名" in t for t in texts):
            return row, rows[rows.index(row) + 1:]
    return None, []

def parse_track_table(table) -> list:
    rows = table.find_all("tr")
    if len(rows) < 2:
        return []

    header_row, data_rows = find_header_row(rows)
    if header_row is None:
        return []

    col_map = {}
    for i, cell in enumerate(header_row.find_all(["th", "td"])):
        field = header_to_field(normalize(cell.get_text()))
        if field:
            col_map[i] = field

    if "title" not in col_map.values():
        return []

    tracks = []
    auto_no = 0

    for row in data_rows:
        cells = row.find_all(["th", "td"])
        if not cells:
            continue

        raw_texts = [normalize(c.get_text()) for c in cells]
        joined = " ".join(raw_texts)

        if any(kw in joined for kw in ["合計時間", "合計:", "Total time", "全編曲"]):
            continue
        if all(t == "" for t in raw_texts):
            continue
        non_empty = [t for t in raw_texts if t]
        if len(non_empty) == 1 and not any(c in non_empty[0] for c in "0123456789"):
            continue

        track = {
            "trackNo": 0, "title": "",
            "lyrics": "", "composition": "", "arrangement": "", "tieUp": "",
        }

        for col_idx, cell in enumerate(cells):
            field = col_map.get(col_idx)
            if field is None:
                continue
            val = normalize(cell.get_text())
            if field == "num":
                m = re.search(r"\d+", val)
                if m:
                    auto_no = int(m.group())
                track["trackNo"] = auto_no
            elif field == "title":
                track["title"] = clean_title(val)
            elif field == "lyrics":
                track["lyrics"] = clean_credit(val)
            elif field == "composition":
                track["composition"] = clean_credit(val)
            elif field == "compose_arrange":
                track["composition"] = clean_credit(val)
                track["arrangement"] = clean_credit(val)
            elif field == "arrangement":
                track["arrangement"] = clean_credit(val)
            elif field == "tieUp":
                track["tieUp"] = val

        if track["trackNo"] == 0:
            auto_no += 1
            track["trackNo"] = auto_no
        else:
            auto_no = track["trackNo"]

        if track["title"] and track["title"] not in ("タイトル", "曲名"):
            tracks.append(track)

    return tracks

# ── 曲目列表驗證 ─────────────────────────────────────

# 假若 track title 符合這些 pattern，代表這是 catalog 表而非曲目表
_INVALID_TITLE_PATTERNS = [
    r"^[A-Z]{2,}\d{3,}",           # 規格品番，如 AVCD-31098
    r"会場|公演|ライブ|コンサート|ツアー",  # 演唱會場地
    r"^\d{4}年\d{1,2}月",           # 日期格式列
    r"備考",                         # 備注欄
]

def is_valid_tracklist(tracks: list) -> bool:
    if not tracks:
        return False
    invalid = sum(
        1 for t in tracks
        if any(re.search(p, t.get("title", "")) for p in _INVALID_TITLE_PATTERNS)
    )
    return invalid / len(tracks) < 0.3

def _renumber_from_one(tracks: list) -> list:
    """若 track 1 不存在，整體重新編號（從 1 開始）"""
    if not tracks:
        return tracks
    if tracks[0]["trackNo"] == 1:
        return tracks
    for i, t in enumerate(tracks):
        t["trackNo"] = i + 1
    return tracks

def extract_tracks_from_soup(soup) -> list:
    candidates = []
    for tbl in soup.find_all("table"):
        parsed = parse_track_table(tbl)
        if len(parsed) >= 2 and is_valid_tracklist(parsed):
            candidates.append(parsed)
    if not candidates:
        return []
    best = max(candidates, key=len)
    return _renumber_from_one(best)

# ── 搜尋策略 ──────────────────────────────────────────

def _title_key(text: str) -> str:
    """移除空白、符號，取前 8 字做比對鍵"""
    return re.sub(r"[\s\-_\(\)（）]", "", text)[:8].lower()

def _is_artist_page(page_title: str, artist: str) -> bool:
    """判斷是否為藝人主頁（而非單一作品頁）"""
    # 完整藝人名
    if page_title == artist:
        return True
    # 藝人 + の作品 / ディスコグラフィー
    if re.match(rf"^{re.escape(artist)}(の作品|のディスコグラフィ|のシングル|のアルバム)", page_title):
        return True
    return False

def find_tracks(artist: str, title: str, item_type: str = "album"):
    """
    item_type: "album" 或 "single"
    回傳 (tracks, wiki_page_title)
    """
    suffix = "アルバム" if item_type == "album" else "シングル"
    tkey = _title_key(title)

    queries = [
        f"{title} {suffix}",                   # e.g. "SWEET 19 BLUES アルバム"
        f"{title} {artist}",                    # e.g. "SWEET 19 BLUES 安室奈美恵"
        f"{title}",
        f"{title} ({suffix})",
    ]

    tried_pages: set = set()

    for query in queries:
        results = search_wikipedia(query)
        time.sleep(REQUEST_DELAY)

        for result in results[:3]:
            page_title = result["title"]
            if page_title in tried_pages:
                continue
            tried_pages.add(page_title)

            # 跳過藝人主頁
            if _is_artist_page(page_title, artist):
                continue

            # 確認 page_title 與 title 有足夠重疊
            # 去除括號後取核心鍵，要求前 4 字元必須出現在對方中
            pkey = _title_key(page_title)
            title_core = _title_key(re.sub(r"\(.*?\)|（.*?）", "", title))
            page_core  = _title_key(re.sub(r"\(.*?\)|（.*?）", "", page_title))
            if len(title_core) >= 4 and title_core[:4] not in pkey:
                continue

            soup = fetch_page(page_title)
            time.sleep(REQUEST_DELAY)
            if soup is None:
                continue

            tracks = extract_tracks_from_soup(soup)
            if tracks:
                return tracks, page_title

    return [], None

# ── 處理函式 ──────────────────────────────────────────

def process_collection(json_path: Path, label: str, item_type: str, force: bool):
    data = json.loads(json_path.read_text(encoding="utf-8"))
    updated = skipped = failed = 0

    for i, item in enumerate(data):
        title  = item.get("title", "")
        artist = item.get("artistName", "")
        existing = item.get("tracks", [])
        prefix = f"  [{i+1:>3}/{len(data)}]"

        if existing and not force:
            print(f"{prefix} ⏭  跳過（已有 {len(existing)} 首）：{artist} - {title}")
            skipped += 1
            continue

        print(f"{prefix} 搜尋：{artist} - {title}")
        tracks, wiki_title = find_tracks(artist, title, item_type)

        if tracks:
            item["tracks"] = tracks
            print(f"         ✅ {len(tracks)} 首（{wiki_title}）")
            updated += 1
        else:
            print(f"         ❌ 找不到曲目")
            failed += 1

        # 每 10 筆自動儲存
        if (i + 1) % 10 == 0:
            json_path.write_text(
                json.dumps(data, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )

    json_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"\n{label} 完成：更新 {updated}、跳過 {skipped}、失敗 {failed}\n")
    return updated

# ── 主程式 ────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Wikipedia 爬蟲 - 抓取曲目資料")
    parser.add_argument("--type", choices=["albums", "singles", "all"], default="all")
    parser.add_argument("--force", action="store_true", help="強制重新抓取（含已有曲目的項目）")
    parser.add_argument(
        "--limit", type=int, default=0,
        help="只處理前 N 筆（測試用，會輸出到 *_test.json）"
    )
    args = parser.parse_args()

    print("=== komuro-db Wikipedia 爬蟲 ===")
    print(f"類型：{args.type}，強制：{args.force}，限制：{args.limit or '無'}\n")

    def target_path(base_path: Path) -> Path:
        if args.limit:
            data = json.loads(base_path.read_text(encoding="utf-8"))
            test_path = base_path.parent / (base_path.stem + "_test.json")
            # 優先選沒有曲目的項目
            no_tracks = [d for d in data if not d.get("tracks")]
            sample = (no_tracks + [d for d in data if d.get("tracks")])[:args.limit]
            test_path.write_text(
                json.dumps(sample, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
            return test_path
        return base_path

    if args.type in ("albums", "all"):
        print("── 處理專輯 ──")
        process_collection(target_path(SEED_ALBUMS), "專輯", "album", force=args.force)

    if args.type in ("singles", "all"):
        print("── 處理單曲 ──")
        process_collection(target_path(SEED_SINGLES), "單曲", "single", force=args.force)

    print("完成！請確認 JSON 後再 push 到 GitHub。")

if __name__ == "__main__":
    main()
