# Hướng dẫn cài đặt Kho lưu trữ cộng đồng (Community Archive)

## Tổng quan
Đã khôi phục và tạo mới chức năng Kho lưu trữ cộng đồng cho CPL, bao gồm:
- Page Community Archive tại `/dashboard/groups/archive`
- Chức năng Archive/Restore groups
- Hệ thống hướng dẫn sử dụng (User Guide)
- Navigation link trong sidebar
- **Fallback behavior**: Ứng dụng hoạt động bình thường ngay cả khi migration chưa chạy

## Các thay đổi

### 1. Database Migration (Tùy chọn)
- **File**: `supabase/0050_add_groups_status.sql`
- **Thay đổi**: Thêm column `status` vào bảng `groups` với các giá trị: `active`, `archived`
- **RPC functions**: `archive_group()`, `restore_group()`
- **RLS policies**: Cập nhật để xử lý archived groups

### 2. Backend Actions
- **File**: `src/app/dashboard/groups/actions.ts`
- **Functions**: `archiveGroup()`, `restoreGroup()`
- **Fallback**: Tự động fallback khi migration chưa chạy
- **Type updates**: GroupSummary và GroupById support status field

### 3. Frontend Pages
- **File**: `src/app/dashboard/groups/archive/page.tsx`
- **Feature**: Hiển thị danh sách groups đã lưu trữ với thống kê
- **Fallback**: Hiển thị rỗng khi migration chưa chạy
- **File**: `src/app/dashboard/groups/[id]/page.tsx`
- **Feature**: Thêm nút Archive/Restore cho group leaders
- **Conditional**: Chỉ hiển thị khi migration đã chạy

### 4. Navigation
- **File**: `src/lib/dashboard-nav.ts`
- **Thay đổi**: Thêm link "Kho lưu trữ cộng đồng" vào sidebar

### 5. User Guide System
- **File**: `src/components/guide/UserGuide.tsx`
- **Feature**: Hệ thống hướng dẫn dạng popup với Next/Back/Skip
- **File**: `src/components/layout/AppShell.tsx`
- **Thay đổi**: Tích hợp UserGuide component

## Cài đặt

### Bước 1: (Tùy chọn) Chạy Migration SQL

**⚠️ QUAN TRỌNG**: Ứng dụng đã được thiết kế với fallback behavior - sẽ hoạt động bình thường ngay cả khi không chạy migration.

Nếu muốn kích hoạt đầy đủ chức năng archive, chạy migration SQL sau:

```bash
# Trong Supabase dashboard SQL Editor hoặc thông qua CLI
# Chạy nội dung file: supabase/0050_add_groups_status.sql
```

Hoặc nếu sử dụng Supabase CLI:

```bash
supabase db push
```

### Bước 2: Khởi động Development Server

```bash
npm run dev
```

### Bước 3: Truy cập và Test

1. **Mở Community Archive**:
   - Truy cập: `http://localhost:3000/dashboard/groups/archive`
   - Hoặc click vào "Kho lưu trữ cộng đồng" trong sidebar
   - **Nếu migration chưa chạy**: Sẽ hiển thị thông báo "Không tìm thấy cộng đồng đã lưu trữ"

2. **Test Archive Function** (sau khi chạy migration):
   - Vào một group detail page (như Leader)
   - Click nút "Archive" để lưu trữ group
   - Group sẽ chuyển sang status "archived"

3. **Test Restore Function** (sau khi chạy migration):
   - Vào Community Archive page
   - Click vào group đã lưu trữ
   - Click nút "Restore" để khôi phục group

4. **Test User Guide**:
   - Mở trang Community Archive lần đầu
   - Popup hướng dẫn sẽ tự động hiển thị sau 1 giây
   - Điều hướng qua các bước với Next/Back/Skip
   - Nút hướng dẫn (?) ở góc dưới bên phải để xem lại

## Flow Test

Để test hoàn chỉnh flow như yêu cầu:

```
1. Mở Kho lưu trữ (/dashboard/groups/archive)
   → Xem danh sách groups đã lưu trữ (hoặc rỗng nếu chưa chạy migration)
   → Hiển thị thống kê (thành viên, dự án)

2. Truy cập cộng đồng
   → Click "Xem cộng đồng" trên card
   → Xem chi tiết group đã lưu trữ
   → Thấy badge "Archived" (nếu migration đã chạy)

3. Mở Hướng dẫn
   → Nút (?) ở góc dưới bên phải
   → Hoặc tự động hiển thị khi lần đầu truy cập

4. Chuyển các bước
   → Click "Tiếp" để đi tiếp
   → Click "Quay lại" để quay lại bước trước
   → Click "Bỏ qua" để đóng hướng dẫn

5. Đóng hướng dẫn
   → Click "X" hoặc "Bỏ qua"
   → Nút hướng dẫn vẫn hiển thị để xem lại
```

## Chi tiết User Guide

### Pages có hướng dẫn:
- `/dashboard/groups/archive` - 4 bước
- `/dashboard/groups` - 4 bước
- `/dashboard/groups/[id]` - 3 bước
- `/dashboard` - 2 bước

### Features:
- **Auto-show**: Tự động hiển thị khi lần đầu truy cập page
- **Remember state**: Lưu trạng thái đã xem trong localStorage
- **Manual trigger**: Nút (?) để xem lại bất cứ lúc nào
- **Progress indicator**: Thanh tiến trình hiển thị bước hiện tại
- **Responsive**: Hoạt động tốt trên mobile và desktop

## Fallback Behavior

Ứng dụng đã được thiết kế để hoạt động bình thường ngay cả khi migration chưa chạy:

### Database Level:
- `getGroupById()`: Tự động fallback khi column `status` không tồn tại
- `archiveGroup()`/`restoreGroup()`: Hiển thị thông báo thân thiện khi column không tồn tại
- Archive page: Hiển thị danh sách rỗng thay vì crash

### UI Level:
- Nút Archive/Restore chỉ hiển thị khi migration đã chạy
- Badge "Archived" chỉ hiển thị khi migration đã chạy
- User Guide hoạt động bình thường independent của migration

## Troubleshooting

### Migration không chạy được
- Kiểm tra quyền Supabase user
- Đảm bảo không có conflicts với existing data
- Xem logs trong Supabase dashboard
- **Note**: Ứng dụng vẫn hoạt động bình thường nếu không chạy migration

### Page không hiển thị
- Kiểm tra server đã chạy migration chưa
- Xem console logs của browser
- Kiểm tra RBAC permissions
- **Fallback**: Sẽ hiển thị thông báo thay vì crash

### User Guide không hiển thị
- Xóa localStorage key `guide_seen_[pathname]` để reset
- Kiểm tra Dialog component đã import đúng chưa
- Xem console errors

### Lỗi "column groups.status does not exist"
- Đây là bình thường nếu migration chưa chạy
- Ứng dụng đã có fallback để xử lý
- Chạy migration nếu muốn kích hoạt đầy đủ chức năng

## Notes

- **Fallback behavior**: Ứng dụng hoạt động bình thường ngay cả khi migration chưa chạy
- Archived groups không hiển thị trong danh sách groups công khai (khi migration đã chạy)
- Chỉ group members và admins có thể xem archived groups (khi migration đã chạy)
- Archive/Restore chỉ có thể thực hiện bởi group leaders (khi migration đã chạy)
- User Guide sử dụng localStorage để track trạng thái
- Build đã test thành công với TypeScript
- **Migration là tùy chọn**: Không bắt buộc để ứng dụng hoạt động
