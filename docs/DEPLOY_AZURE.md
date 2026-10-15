# Deploy FE lên Azure Static Web Apps

FE không cần Docker. BE chạy Docker trên Azure Container Apps Consumption; database và Blob giữ nguyên.
Chưa có thao tác tạo tài nguyên, commit/push hoặc publish nào được thực hiện tự động từ máy local.

## 1. Chuẩn bị backend

Deploy BE trước và kiểm `https://<hostname-BE>/health` trả 200.
Ghi lại FQDN thật của Container App; không suy đoán domain từ tên tài nguyên.

## 2. Tạo Static Web App trên Azure Portal

1. Tìm **Static Web Apps → Create**; chọn subscription và resource group của bạn.
2. Đặt tên, ví dụ `hrcms-frontend`; chọn Free nếu phù hợp nhu cầu thử nghiệm/đồ án.
3. Workflow đã được chuẩn bị trong `.github/workflows/azure-static-web-apps.yml`.
   Chọn Deployment source **Other** nếu Portal cho phép, để tạo app và dùng workflow có sẵn mà không sinh thêm workflow.
4. Nếu bạn chọn GitHub: repo `QHao2508/HRCMS-Frontend`, branch `main`, preset React hoặc Custom,
   App location `/`, API location trống, Output location `dist`.
   Azure có thể tạo workflow riêng: chỉ giữ một workflow deploy production để tránh deploy trùng.
   Nếu dùng workflow do Azure sinh, thay phần build/deploy bằng workflow đã chuẩn bị và dùng token của app này.
5. Sau khi tạo xong, sao chép **URL** trong Overview và **deployment token** từ Manage deployment token.
   Không gửi deployment token vào chat hoặc commit vào source.

## 3. Cấu hình GitHub

Repo → **Settings → Secrets and variables → Actions**:

| Loại | Tên | Giá trị |
| --- | --- | --- |
| Repository secret | `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token của Static Web App vừa tạo |
| Repository variable | `VITE_API_BASE_URL` | `https://<hostname-BE-thực-tế>` |
| Repository variable, tùy chọn | `VITE_REALTIME_ENABLED` | `false`, giữ mặc định lúc đầu |

Token này chỉ để workflow publish FE, khác với mật khẩu SQL/SMTP. Các mật khẩu BE vẫn ở Container Apps Secrets.
URL BE không chứa `/api` hoặc dấu `/` cuối. `VITE_` được nhúng công khai vào bundle lúc build.
Đặt biến trong GitHub Actions; chỉ thêm ở Environment variables của Static Web App không tự sửa bundle Vite.

## 4. Publish

Đưa các chỉnh sửa local lên GitHub trước; công cụ chưa commit/push giúp bạn.
Workflow chạy khi push vào `main` hoặc tại **Actions → Deploy frontend to Azure → Run workflow**.
Workflow dùng Node 24, `npm ci`, toàn bộ test và build rồi upload `dist`.
Do đã build ở bước trước, action deploy dùng `app_location: dist`, `skip_app_build: true`, `output_location: ''`.
Đây khác các đường dẫn `/` và `dist` của workflow build tự động do Portal sinh.

`public/staticwebapp.config.json` được Vite copy tới root `dist` để refresh route BrowserRouter không 404.
Không thêm Azure Functions API; FE gọi trực tiếp BE qua HTTPS.

## 5. Kết nối FE với BE

Trong **Container App BE → Containers → Edit and deploy → Environment variables**, đặt:

```text
Cors__Origins__0=https://<domain-FE-thực-tế>.azurestaticapps.net
```

Dùng nguyên origin trong Overview của Static Web App, không thêm `/` cuối. Deploy revision BE với cấu hình mới.
Kiểm login/refresh/logout, OTP, upload/tải ảnh và mở trực tiếp `/login` hoặc `/horses` rồi refresh.
Nếu lỗi: xem workflow logs, browser Network và container logs; không đổi sang wildcard CORS.

Đổi URL BE cần sửa GitHub variable rồi chạy workflow lại. Không cần sửa cấu hình dev hoặc `.env.local`.
Nếu bật realtime sau này: BE cần cấu hình/migration tương ứng, WebSocket và CORS đúng domain;
FE đặt `VITE_REALTIME_ENABLED=true` rồi chạy workflow lại.
Workflow hiện chỉ deploy production, không tạo PR preview cần thêm CORS.

Tài liệu: [build configuration](https://learn.microsoft.com/azure/static-web-apps/build-configuration),
[SPA fallback](https://learn.microsoft.com/azure/static-web-apps/configuration).
