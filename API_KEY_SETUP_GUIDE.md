# Hướng dẫn cấu hình API Keys

Đã tạo file `.env.local` và cập nhật thông báo lỗi thân thiện hơn.

## Cấu hình hiện tại

File `.env.local` đã được tạo với các biến môi trường cần thiết:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key
```

## Cách lấy API Keys

### 1. Supabase Keys

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** > **API**
4. Copy các keys:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY` (chỉ dùng server-side)

### 2. Gemini API Key

1. Đăng nhập vào [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Create API Key**
3. Copy API key generated
4. Paste vào `GEMINI_API_KEY`

**Lưu ý**: Gemini API Key có thể miễn phí với quota giới hạn.

## Cập nhật file .env.local

Thay thế các placeholder bằng keys thực tế:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

## Khởi động lại server

Sau khi cập nhật `.env.local`, khởi động lại development server:

```bash
# Stop server (Ctrl+C)
# Start lại
npm run dev
```

## Troubleshooting

### Lỗi "GEMINI_API_KEY is not configured"

1. Kiểm tra file `.env.local` có tồn tại trong root directory
2. Đảm bảo `GEMINI_API_KEY` đã được điền đúng giá trị
3. Khởi động lại server sau khi cập nhật file
4. Kiểm tra không có khoảng trắng thừa xung quanh key

### Lỗi "Supabase is not configured"

1. Kiểm tra `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Đảm bảo URL format đúng: `https://xxx.supabase.co`
3. Kiểm tra keys không bị truncate

### AI features không hoạt động

Nếu không muốn sử dụng AI features, có thể:
- Để `GEMINI_API_KEY` trống
- Các tính năng AI sẽ hiển thị thông báo thân thiện thay vì crash
- Các tính năng khác của ứng dụng vẫn hoạt động bình thường

## Security Notes

- ⚠️ **KHÔNG** commit file `.env.local` vào git
- ⚠️ **KHÔNG** chia sẻ API keys với người khác
- ⚠️ **KHÔNG** sử dụng Service Role Key trong client-side code
- ✅ File `.env.local` đã được thêm vào `.gitignore` (nếu chưa, hãy thêm)

## Thêm vào .gitignore

Nếu chưa có, thêm dòng sau vào `.gitignore`:

```
.env.local
.env.*.local
```

## Test cấu hình

Sau khi cấu hình, test bằng cách:

1. Kiểm tra AI features không còn báo lỗi
2. Kiểm tra Supabase kết nối hoạt động
3. Test authentication flow
4. Test database operations

## File đã tạo/sửa

1. ✅ `.env.local` - File cấu hình môi trường mới
2. ✅ `src/lib/ai/gemini.ts` - Cập nhật thông báo lỗi thân thiện hơn
3. ✅ `API_KEY_SETUP_GUIDE.md` - Hướng dẫn này
