#!/usr/bin/env python3
"""
從指定的藝人作品列表頁直接抓取曲目資料
策略：discography 頁面 → 標題連結 → 個別單曲/專輯頁 → 曲目表格

用法: python3 scripts/scrape_discography_pages.py [--force]
"""

import json
import re
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

WIKI_BASE     = "https://ja.wikipedia.org"
HEADERS       = {"User-Agent": "komuro-db-scraper/1.0 (https://github.com/globe809/komuro-db)"}
REQUEST_DELAY = 1.2

# ── 藝人作品列表頁 → 對應藝人名稱 ────────────────────
# 格式: (wiki_url, [seed_artistName, ...])
DISCOGRAPHY_PAGES = [
    ("https://ja.wikipedia.org/wiki/TM_NETWORK%E3%81%AE%E4%BD%9C%E5%93%81",
     ["TM NETWORK"]),
    ("https://ja.wikipedia.org/wiki/Hitomi",
     ["hitomi"]),
    ("https://ja.wikipedia.org/wiki/%E8%8F%AF%E5%8E%9F%E6%9C%8B%E7%BE%8E",
     ["華原朋美"]),
    ("https://ja.wikipedia.org/wiki/TRF",
     ["TRF"]),
    ("https://ja.wikipedia.org/wiki/Kiss_Destination",
     ["Kiss Destination", "TRUE KiSS DESTiNATiON"]),
    ("https://ja.wikipedia.org/wiki/%E8%A6%B3%E6%9C%88%E3%81%82%E3%82%8A%E3%81%95",
     ["観月ありさ"]),
    ("https://ja.wikipedia.org/wiki/%E5%B0%8F%E5%AE%A4%E5%93%B2%E5%93%89%E3%81%AE%E4%BD%9C%E5%93%81",
     ["小室哲哉"]),
    ("https://ja.wikipedia.org/wiki/Globe",
     ["globe"]),
    ("https://ja.wikipedia.org/wiki/%E9%88%B4%E6%9C%A8%E4%BA%9C%E7%BE%8E",
     ["鈴木あみ"]),
]

# ── 文字工具 ──────────────────────────────────────────

def normalize(text: str) -> str:
    text = text.replace("　", " ").replace("\xa0", " ")
    return re.sub(r"\s+", " ", text).strip()

def clean_title(text: str) -> str:
    text = normalize(text)
    text = re.sub(r"[「」『』【】〈〉]", "", text)
    text = re.sub(r"^\d+[\.、]\s*", "", text)
    return text.strip()

def clean_credit(text: str) -> str:
    text = normalize(text)
    text = re.sub(r"（[^）]*）|\([^)]*\)", "", text)
    text = re.sub(r"\[.*?\]", "", text)
    return text.strip()

def title_key(text: str) -> str:
    """標準化標題用於比對（小寫、移除空白符號）"""
    text = re.sub(r"[「」『』【】〈〉\(\)（）\[\]\s\-_・]", "", text or "")
    return text.lower()

# ── HTTP 工具 ─────────────────────────────────────────

def fetch(url: str):
    if url.startswith("//"):
        url = "https:" + url
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return None
        return BeautifulSoup(r.text, "lxml")
    except Exception:
        return None

# ── 曲目表格解析（同前一個爬蟲）────────────────────────

def header_to_field(text: str):
    t = text.lower().strip().rstrip("：:")
    if re.search(r"作曲.*編曲|編曲.*作曲", t): return "compose_arrange"
    if re.search(r"^(#|no\.?|曲順|トラック|disc|side)$", t): return "num"
    if re.search(r"タイトル|曲名|title", t): return "title"
    if re.search(r"作詞|lyric", t): return "lyrics"
    if re.search(r"作曲|compos|music", t): return "composition"
    if re.search(r"編曲|arrang", t): return "arrangement"
    if re.search(r"タイアップ", t): return "tieUp"
    return None

_INVALID_PATTERNS = [
    r"^[A-Z]{2,}\d{3,}", r"会場|公演|ライブ|コンサート|ツアー",
    r"^\d{4}年\d{1,2}月", r"備考",
]

def is_valid_tracklist(tracks):
    if not tracks: return False
    invalid = sum(1 for t in tracks
                  if any(re.search(p, t.get("title","")) for p in _INVALID_PATTERNS))
    return invalid / len(tracks) < 0.3

def find_header_row(rows):
    for row in rows[:4]:
        cells = row.find_all(["th","td"])
        texts = [normalize(c.get_text()) for c in cells]
        if any("タイトル" in t or "曲名" in t for t in texts):
            return row, rows[rows.index(row) + 1:]
    return None, []

def parse_track_table(table) -> list:
    rows = table.find_all("tr")
    if len(rows) < 2: return []
    header_row, data_rows = find_header_row(rows)
    if header_row is None: return []

    col_map = {}
    for i, cell in enumerate(header_row.find_all(["th","td"])):
        field = header_to_field(normalize(cell.get_text()))
        if field: col_map[i] = field
    if "title" not in col_map.values(): return []

    tracks = []; auto_no = 0
    for row in data_rows:
        cells = row.find_all(["th","td"])
        if not cells: continue
        joined = " ".join(normalize(c.get_text()) for c in cells)
        if any(kw in joined for kw in ["合計時間","合計:","Total time","全編曲"]): continue
        if all(normalize(c.get_text()) == "" for c in cells): continue
        non_empty = [normalize(c.get_text()) for c in cells if normalize(c.get_text())]
        if len(non_empty) == 1 and not any(ch.isdigit() for ch in non_empty[0]): continue

        track = {"trackNo":0,"title":"","lyrics":"","composition":"","arrangement":"","tieUp":""}
        for col_idx, cell in enumerate(cells):
            field = col_map.get(col_idx)
            if not field: continue
            val = normalize(cell.get_text())
            if field == "num":
                m = re.search(r"\d+", val)
                if m: auto_no = int(m.group())
                track["trackNo"] = auto_no
            elif field == "title": track["title"] = clean_title(val)
            elif field == "lyrics": track["lyrics"] = clean_credit(val)
            elif field == "composition": track["composition"] = clean_credit(val)
            elif field == "compose_arrange":
                track["composition"] = track["arrangement"] = clean_credit(val)
            elif field == "arrangement": track["arrangement"] = clean_credit(val)
            elif field == "tieUp": track["tieUp"] = val

        if track["trackNo"] == 0: auto_no += 1; track["trackNo"] = auto_no
        else: auto_no = track["trackNo"]
        if track["title"] and track["title"] not in ("タイトル","曲名"):
            tracks.append(track)
    return tracks

def _parse_credits_from_ul(ul_tags) -> dict:
    """從 <ul> 元素解析全域作詞/作曲/編曲"""
    credits = {"lyrics": "", "composition": "", "arrangement": ""}
    for ul in ul_tags:
        text = normalize(ul.get_text())
        # 作詞・作曲・編曲：X
        m = re.match(r"作詞[・・]作曲[・・]編曲[：:]\s*(.+)", text)
        if m:
            val = clean_credit(m.group(1).split("MIX")[0].strip())
            credits["lyrics"] = credits["composition"] = credits["arrangement"] = val
            continue
        # 作詞：A　作曲：B　編曲：C（各種分隔符）
        for field, patterns in [
            ("lyrics",      [r"作詞[：:]\s*([^　\s作編]+)"]),
            ("composition", [r"作曲[：:]\s*([^　\s作編]+)"]),
            ("arrangement", [r"編曲[：:]\s*([^　\s作編]+)"]),
        ]:
            for pat in patterns:
                m2 = re.search(pat, text)
                if m2:
                    credits[field] = clean_credit(m2.group(1))
    return credits

def _extract_tracks_from_ol(soup) -> list:
    """從 <ol> 格式解析曲目（hitomi/華原朋美/TRF 等頁面）"""
    # 找収録曲 section
    section_node = None
    for tag in soup.find_all(["h2", "h3"]):
        if "収録曲" in tag.get_text():
            section_node = tag.parent
            break
    if section_node is None:
        return []

    tracks = []
    track_no = 0

    # 往下掃描 section siblings，收集 ul(credits) 和 ol(曲目)
    current_credits = {"lyrics": "", "composition": "", "arrangement": ""}
    for sib in section_node.find_next_siblings():
        if sib.name in ["h2", "h3"]:
            break
        if sib.name == "ul":
            current_credits = _parse_credits_from_ul([sib])
        elif sib.name == "dl":
            pass  # 通常是 MIX 資訊，略過
        elif sib.name == "ol":
            for li in sib.find_all("li"):
                track_no += 1
                title = clean_title(li.get_text())
                tracks.append({
                    "trackNo": track_no,
                    "title": title,
                    "lyrics": current_credits["lyrics"],
                    "composition": current_credits["composition"],
                    "arrangement": current_credits["arrangement"],
                    "tieUp": "",
                })
        # ol 也可能嵌在 div/p 裡
        if hasattr(sib, "find_all"):
            for ul in sib.find_all("ul", recursive=False):
                current_credits = _parse_credits_from_ul([ul])
            for ol in sib.find_all("ol", recursive=False):
                for li in ol.find_all("li"):
                    track_no += 1
                    title = clean_title(li.get_text())
                    tracks.append({
                        "trackNo": track_no,
                        "title": title,
                        "lyrics": current_credits["lyrics"],
                        "composition": current_credits["composition"],
                        "arrangement": current_credits["arrangement"],
                        "tieUp": "",
                    })

    return tracks

def extract_tracks(soup) -> list:
    # 先試 table 格式
    candidates = []
    for tbl in soup.find_all("table"):
        parsed = parse_track_table(tbl)
        if len(parsed) >= 2 and is_valid_tracklist(parsed):
            candidates.append(parsed)
    if candidates:
        best = max(candidates, key=len)
        if best and best[0]["trackNo"] != 1:
            for i, t in enumerate(best): t["trackNo"] = i + 1
        return best

    # fallback：試 ol 格式
    ol_tracks = _extract_tracks_from_ol(soup)
    if len(ol_tracks) >= 1:
        return ol_tracks

    return []

# ── 從 discography 頁提取 (title, wiki_href) ──────────

def extract_disc_links(soup) -> list:
    """
    掃描頁面所有 wikitable，找到「タイトル」欄位，
    回傳 [(title_text, wiki_href), ...] 清單。
    wiki_href 可能是 None（沒有連結）。
    """
    result = []
    for tbl in soup.find_all("table", class_="wikitable"):
        rows = tbl.find_all("tr")
        if not rows: continue

        # 找 タイトル 欄位的 index
        title_col = None
        for row in rows[:3]:
            cells = row.find_all(["th","td"])
            for i, cell in enumerate(cells):
                if "タイトル" in normalize(cell.get_text()) or "曲名" in normalize(cell.get_text()):
                    title_col = i
                    break
            if title_col is not None: break
        if title_col is None: continue

        for row in rows[1:]:
            cells = row.find_all(["th","td"])
            if len(cells) <= title_col: continue
            cell = cells[title_col]
            text = normalize(cell.get_text())
            if not text or text in ("タイトル","曲名"): continue
            link = cell.find("a", href=True)
            href = link["href"] if link else None
            # 只要 Wikipedia 作品連結（排除 #cite、外部連結等）
            if href and not href.startswith("/wiki/"):
                if href.startswith("//ja.wikipedia.org/wiki/"):
                    href = href[len("//ja.wikipedia.org"):]
                else:
                    href = None
            if href and "#cite" in href: href = None
            result.append((text, href))

    return result

# ── 比對 seed 資料 ─────────────────────────────────────

def build_index(data: list) -> dict:
    """以 title_key(title) 為 key，建立索引"""
    idx = {}
    for item in data:
        k = title_key(item.get("title",""))
        if k: idx.setdefault(k, []).append(item)
    return idx

def find_seed_item(idx: dict, disc_title: str, artists: list):
    """在 seed 資料中找到匹配的項目"""
    k = title_key(disc_title)
    candidates = idx.get(k, [])
    # 優先完全匹配藝人名
    for item in candidates:
        if item.get("artistName","") in artists:
            return item
    # 藝人名不限
    if candidates:
        return candidates[0]
    return None

# ── 主流程 ────────────────────────────────────────────

def process_discography_page(page_url: str, artists: list,
                              singles_data: list, albums_data: list,
                              force: bool):
    singles_idx = build_index(singles_data)
    albums_idx  = build_index(albums_data)

    print(f"\n── {artists} ──")
    print(f"  頁面：{page_url}")
    soup = fetch(page_url)
    if not soup:
        print("  ❌ 頁面載入失敗")
        return 0, 0
    time.sleep(REQUEST_DELAY)

    disc_links = extract_disc_links(soup)
    print(f"  找到 {len(disc_links)} 個作品條目")

    updated_s = updated_a = 0

    for disc_title, href in disc_links:
        # 找對應的 seed 項目
        seed_single = find_seed_item(singles_idx, disc_title, artists)
        seed_album  = find_seed_item(albums_idx,  disc_title, artists)

        targets = []
        if seed_single: targets.append(("single", seed_single))
        if seed_album:  targets.append(("album",  seed_album))
        if not targets: continue

        # 檢查是否已有曲目
        need_fetch = any(
            not item.get("tracks") or len(item.get("tracks",[])) == 0 or force
            for _, item in targets
        )
        if not need_fetch:
            continue

        # 從 href 抓曲目
        if href:
            track_soup = fetch(WIKI_BASE + href)
            time.sleep(REQUEST_DELAY)
        else:
            track_soup = None

        tracks = extract_tracks(track_soup) if track_soup else []

        for kind, item in targets:
            if item.get("tracks") and not force: continue
            if tracks:
                item["tracks"] = tracks
                sym = "🎵" if kind == "single" else "💿"
                print(f"  {sym} ✅ {item['artistName']} - {item['title']} ({len(tracks)} 首)")
                if kind == "single": updated_s += 1
                else: updated_a += 1
            else:
                print(f"  ⚪ 無曲目：{item['artistName']} - {item['title']}")

    return updated_s, updated_a


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="強制重新抓取")
    args = parser.parse_args()

    singles_data = json.loads(SEED_SINGLES.read_text(encoding="utf-8"))
    albums_data  = json.loads(SEED_ALBUMS.read_text(encoding="utf-8"))

    total_s = total_a = 0

    for page_url, artists in DISCOGRAPHY_PAGES:
        us, ua = process_discography_page(
            page_url, artists, singles_data, albums_data, args.force
        )
        total_s += us
        total_a += ua
        # 每個藝人處理完就儲存
        SEED_SINGLES.write_text(json.dumps(singles_data, ensure_ascii=False, indent=2), encoding="utf-8")
        SEED_ALBUMS.write_text(json.dumps(albums_data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n=== 完成 ===")
    print(f"  單曲更新：{total_s} 首")
    print(f"  專輯更新：{total_a} 張")
    print("已儲存。請確認後 push 到 GitHub。")


if __name__ == "__main__":
    main()
