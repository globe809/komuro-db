# 小室哲哉 作品資料庫

## 技術架構
- **前端**：React + Vite（部署到 Vercel）
- **資料庫**：Firebase Firestore
- **圖片儲存**：Firebase Storage

---

## 部署步驟

### 第一步：建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」，輸入名稱（如：komuro-db）
3. 進入專案後，點左側「Firestore Database」→「建立資料庫」→選「正式環境」
4. 點左側「Storage」→「開始使用」→選「正式環境」
5. 點左上角齒輪圖示→「專案設定」→拉到底找「您的應用程式」→點「</> 網頁應用程式」
6. 複製 firebaseConfig 中的所有設定值

### 第二步：設定 Firebase 規則

**Firestore 規則**（先設定為開放讀寫，之後可再調整）：
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Storage 規則**：
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### 第三步：部署到 Vercel

1. 前往 [Vercel](https://vercel.com/) 並登入（可用 GitHub 帳號）
2. 點「Add New Project」→ 匯入你的 GitHub repo（需先將此資料夾推送到 GitHub）
3. 在 Vercel 的「Environment Variables」頁面新增以下環境變數（從 Firebase 取得）：

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

4. 點「Deploy」即完成！

### 本機開發

```bash
# 安裝套件
npm install

# 複製環境變數範本並填入 Firebase 設定
cp .env.example .env.local

# 啟動開發伺服器
npm run dev
```

---

## 頁面路徑

| 路徑 | 說明 |
|------|------|
| `/` | 首頁（統計 + 最新作品） |
| `/singles` | 單曲列表（可篩選） |
| `/singles/:id` | 單曲詳細頁 |
| `/albums` | 專輯列表（可篩選） |
| `/albums/:id` | 專輯詳細頁（含曲目） |
| `/video-works` | 影像作品列表 |
| `/video-works/:id` | 影像作品詳細頁 |
| `/admin` | 後台總覽 |
| `/admin/artists` | 藝人管理 |
| `/admin/singles` | 單曲 CRUD |
| `/admin/albums` | 專輯 CRUD |
| `/admin/video-works` | 影像作品 CRUD |

---

## Firestore 資料結構

### `artists` 集合
```json
{
  "name": "globe",
  "createdAt": "timestamp"
}
```

### `singles` 集合
```json
{
  "title": "DEPARTURES",
  "artistName": "globe",
  "year": 1996,
  "month": 1,
  "day": 1,
  "type": "physical",
  "lyrics": "小室哲哉",
  "composition": "小室哲哉",
  "arrangement": "小室哲哉",
  "imageUrl": "https://...",
  "imagePath": "singles/xxx.jpg",
  "notes": ""
}
```

### `albums` 集合
```json
{
  "title": "FACES PLACES",
  "artistName": "globe",
  "year": 1996,
  "month": 1,
  "day": 1,
  "albumType": "studio",
  "tracks": [
    {
      "title": "DEPARTURES",
      "lyrics": "小室哲哉",
      "composition": "小室哲哉",
      "arrangement": "小室哲哉"
    }
  ],
  "imageUrl": "",
  "imagePath": "",
  "notes": ""
}
```

### `videoWorks` 集合
```json
{
  "title": "globe clips",
  "artistName": "globe",
  "year": 1997,
  "month": 3,
  "day": 21,
  "format": "DVD",
  "contents": [
    { "title": "DEPARTURES (Music Video)" }
  ],
  "imageUrl": "",
  "imagePath": "",
  "notes": ""
}
```

---

## 專輯類型代碼對照

| 代碼 | 名稱 |
|------|------|
| `studio` | 錄音室專輯 |
| `remix` | 混音專輯 |
| `best` | 精選輯 |
| `project` | 企劃專輯 |
| `box` | BOX |
| `other` | 其他 |

## 影像作品格式

DVD、Blu-ray、VHS、LD（LaserDisc）
