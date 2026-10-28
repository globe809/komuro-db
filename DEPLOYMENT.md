# TK WORKS 發布與維護

正式網站：https://tk56.web.app/
管理後台：https://tk56.web.app/#/admin
資料檢查：https://tk56.web.app/#/admin/data-quality

原始專案：`/Users/elvis/komuro-db`。GitHub `main` 應保存可建置的最新版；日常功能先在分支檢查，再合併。

## 本機檢查與發布

```sh
npm ci
npm test
npm run validate:config
npm run build
npm run deploy
```

發布目標是 Firebase project `komuro-db`、Hosting site `tk56`。`npm run deploy` 只發布 Hosting，不發布 Firestore 或 Storage 規則。

`.env.production` 是瀏覽器本來就會收到的 Firebase web 設定，不含管理憑證。`.env.local`、`.firebase/` 和 `gha-creds-*.json` 不提交到 Git。原 GitHub 的 VITE secrets 不再覆蓋正式站設定。

## GitHub Actions

PR 與 main 會執行測試、設定驗證、正式建置，保留 7 天建置產物。只有 main 且 repository variable `HOSTING_DEPLOY_ENABLED` 設為 `true` 時，才會嘗試發布。

目前自動發布保持停用，等待擁有者核准新增的部署身分與 IAM 授權。流程檔已準備好使用以下無長期金鑰的身分聯盟：

- Project number: `836275864567`
- Pool/provider: `tkworks-github/github`
- Service account: `tkworks-hosting-deploy@komuro-db.iam.gserviceaccount.com`
- Google role: `roles/firebasehosting.admin`，僅 Hosting 管理，不提供 Firestore、Storage 資料權限。
- 信任條件必須同時限制 repository 的數字 ID、owner 數字 ID、`refs/heads/main`、`globe809/komuro-db/.github/workflows/deploy.yml@refs/heads/main`。
- Service account 的 `roles/iam.workloadIdentityUser` 只授予上述 repository ID 的 principalSet。

Google 部署帳號、pool/provider 和 IAM 授權尚未建立；自動核准審查要求使用者明確批准後才能進行。完成並確認權限後，才啟用 `HOSTING_DEPLOY_ENABLED` 並驗證實際發布。不要將個人 Firebase refresh token 或 service account 私鑰寫入 Git。

## 瀏覽與資料檢查

單曲、專輯、影像清單提供卡片／表格切換，年份可逐一或全部收合。這些狀態與捲動位置保存在目前分頁的 sessionStorage；作品詳細頁的返回按鈕會保留篩選參數。

資料檢查列出缺封面、日期不完整／無效、缺曲目／內容、缺名稱／藝人和同名版本。可點「編輯」直接開啟該作品。只有年份的發行資訊會標示待補日期，仍保留原資料。

新增與編輯會排除自己後檢查同藝人、同名作品，允許人工確認合理的不同版本。匯入前可執行「只檢查，不匯入」；完全相同資料會去重，日期、格式、曲目或其他內容不同的版本保留。更新曲目若對到多個版本，或同日期 seed 有多種內容，會略過並報告。

完整匯入原有的清除重建流程仍存在，必須由管理員明確確認；本次功能驗證不執行正式資料寫入。

## 後台 UI 隔離驗證

```sh
npx vite build --config tests/qa.vite.config.js
python3 -m http.server 8768 --directory ../improvements-qa
```

開啟 `http://127.0.0.1:8768/tests/admin-qa.html#/admin/data-quality`。僅使用 fixture，所有寫入均拋出測試錯誤；QA 檔案不包含於正式站建置產物。
