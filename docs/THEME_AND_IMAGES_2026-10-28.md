# Bảng màu và tải ảnh — 28/10/2026

## Giao diện

- Áp dụng bảng màu HorseClub người dùng chọn: sidebar `#1F1712`, primary `#7A4528`, hover `#5F341C`, accent `#C9773F`.
- Nền trang `#F6F4EF`, bề mặt `#FFFFFF`, viền `#E6E1D8`, chữ `#231C16`, chữ phụ `#6B6259`.
- Trạng thái dùng nền nhạt/chữ đậm riêng cho thành công, cảnh báo, lỗi, thông tin và nháp.
- Tiêu đề trang Lora 30px; nội dung Manrope; bo góc control 8px, card 12px. Các thao tác tiếp tục có khung, hover và focus rõ.
- Theme tập trung trong `src/style/equestrian-theme.css`, áp dụng workspace, dashboard, bảng, medical, auth và public.
- Sau đổi bảng màu: lint và production build đạt; build còn cảnh báo kích thước bundle hiện có. Kết quả browser bên dưới thuộc đợt kiểm tra chức năng trước thay bảng màu này.

## Logo

Kiểm tra thực tế backend local: `/api/branding/logo` và `/api/website/assets/Logo` trả HTTP 500. `BrandLogo` trước đây thay ảnh lỗi bằng chữ HRCMS trong khung crop, còn header có thêm tên HRCMS, nên trông như logo lỗi/lặp chữ.

Đã lấy bản logo gốc từ endpoint public của backend deploy, đối soát SHA-256:

`153411c4096984a2e8e5c2e995fdcbb640534a1fcf6076c2cbf359876582de97`

Bản nguyên gốc được kèm trong `public/images/hrcms-logo.png`. Header/footer chỉ hiển thị logo CMS mới nhất. Khi cấu hình chưa tải hoặc ảnh lỗi, để khung trống; không hiện logo kèm sẵn trong repository. Logo CMS được xử lý vùng trắng trung tính nối với mép ảnh bằng canvas, giữ các vùng trắng khép kín và cắt khoảng trống; ảnh hiển thị PNG trong suốt, không ghi đè file gốc. Chờ xử lý xong mới hiện ảnh để tránh lóe nền trắng. Không chỉnh sửa nội dung logo hoặc sao chép ảnh ngựa private vào public assets.

## Ảnh ngựa

Log người dùng cung cấp xác nhận request `AttachmentService.GetHorsePhoto` thất bại ở `AzureBlobStore.OpenRead`: `ManagedIdentityCredential` thử IMDS tại `169.254.169.254` trên máy local. Đây là lỗi xác thực Azure Storage, không phải thiếu CSS hoặc thiếu bảng chứa ảnh.

Backend đã thay đổi: `DefaultAzureCredentialOptions.ExcludeManagedIdentityCredential=true` chỉ trong Development. Production giữ Managed Identity. Chế độ AzureCli và connection string không bị thay đổi. Thay đổi chỉ tránh dò IMDS; không tự cấp quyền vào container private.

Frontend đã tách `HorsePhoto` thành component riêng, giữ API có Authorization, xử lý loading, ảnh chưa được đính kèm, lỗi quyền/storage, ảnh không giải mã được và retry. Khi API lỗi, vùng ảnh không biến mất. Object URL được dọn khi đổi ngựa, đổi phiên bản ảnh hoặc thử lại. Không dùng ảnh ngựa mẫu thay ảnh hồ sơ thật.

## Cần thực hiện trên máy chạy backend

Dừng backend cũ bằng Ctrl+C để nạp DLL mới. Nếu chưa có phiên Azure trong công cụ phát triển có quyền đọc Blob, chạy tại thư mục backend:

```powershell
.\tools\Set-AzureBlobStorage.ps1 -ServiceUri 'https://hrcmsg2.blob.core.windows.net/' -Container 'hrcms-files'
```

Nhập connection string của Storage Account ở prompt ẩn. Script lưu trong User Secrets, không sửa ảnh/metadata hoặc mở container public. Sau đó:

```powershell
dotnet run --project Horse_BackEnd --launch-profile http -- --Email:Provider=DevelopmentFile
```

Chỉ khi backend có credential hợp lệ mới xác nhận được việc tải lại ảnh thật. Frontend không được nhận Storage access key/SAS. Không chuyển Storage sang Local để che lỗi vì file đang ở Azure.

## Kiểm chứng

- Frontend lint và production build đạt.
- Browser production preview: **100 mục đạt, 0 lỗi**, gồm 41 route ở 1440px/390px và 18 kiểm tra tương tác/vai trò. Đã chụp và xem ảnh dashboard/hồ sơ ngựa theo theme mới bằng fixture; không dùng ảnh fixture để thay dữ liệu ngựa thật.
- Unit/SSR frontend: 368 đạt, 1 bỏ qua.
- Backend Release: 8 test AzureBlobStore/EmailConfiguration đạt, gồm Development loại Managed Identity và Production giữ Managed Identity; không cần database test cho các ca này.
- Bộ browser fixture được bổ sung kiểm logo tùy chỉnh lỗi → khung trống, không quay về logo cũ, ảnh ngựa lỗi → retry thành công và photo metadata null → trạng thái chưa có ảnh, không phát request ảnh.
- Favicon mặc định hình tia sét được thay bằng huy hiệu HC nâu/cam đồng; logo trong nội dung/header vẫn là bản logo gốc đã đối soát hash.

Không dừng backend đang chạy của người dùng; kiểm thử backend dùng output Release riêng vì DLL Debug đang bị process giữ. Không tự thay đổi credential hay dữ liệu Azure. Công cụ không được cấp quyền đọc cửa sổ Edge hiện tại; các kiểm tra giao diện dùng browser fixture riêng và không truy cập phiên đăng nhập của người dùng.

## Hoàn thiện cuối ngày 28/10/2026

- Header: tên cổng ở chính giữa, chữ Lora đậm màu đồng; header/sidebar cùng nền nâu đen, nút và focus có tương phản.
- Bộ lọc, tiêu đề bảng, thao tác, trạng thái sự cố dùng nền màu rõ hơn. Khối hướng dẫn dùng kem–nâu; tab đang chọn giữ chữ sáng. Thanh lưu form huấn luyện không đè nội dung.
- Ca làm việc dùng hàng/cột gọn, nhãn trường vẫn có liên kết cho trình đọc màn hình; thêm/xóa ca và khoảng nghỉ giữ nguyên payload. Mobile hiển thị lại nhãn.
- KPI báo cáo dùng grid riêng, padding 16–22px để tránh quy tắc summary-grid làm chữ sát viền.
- Website store tránh response cũ ghi đè cấu hình vừa được quản trị viên cập nhật; request cấu hình yêu cầu revalidate cache.
- Kiểm tra tập trung bằng browser fixture desktop/mobile: ca làm việc thêm/xóa, khoảng nghỉ, padding KPI, tab huấn luyện, khối hướng dẫn và thanh lưu đạt. Kiểm tra public local với cấu hình logo thật: F5 không request logo kèm sẵn, nền ngoài trong suốt và chi tiết trắng trong logo được giữ.
