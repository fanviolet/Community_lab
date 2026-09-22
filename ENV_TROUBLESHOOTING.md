# Khắc phục lỗi Environment Variables

## Vấn đề hiện tại

Diagnostic script cho thấy file `.env.local` vẫn chứa placeholder values:
- `NEXT_PUBLIC_SUPABASE_URL=your-project-url`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`
- `GEMINI_API_KEY=your-gemini-api-key`

## Giải pháp

### Cách 1: Cập nhật thủ công (Nếu bạn có API keys)

Vì bạn nói API key của bạn đã đúng, có thể bạn đang sử dụng file cấu hình khác hoặc keys được lưu ở nơi khác. Hãy:

1. **Kiểm tra file khác có thể chứa keys**:
   ```bash
   # Kiểm tra các file env khác
   ls -la | grep env
   cat .env  # nếu tồn tại
   cat .env.production  # nếu tồn tại
   ```

2. **Sao chép keys từ file cấu hình hiện tại của bạn** vào `.env.local`:
   ```bash
   # Nếu bạn có file khác chứa keys
   cp your-env-file .env.local
   ```

3. **Hoặc cập nhật trực tiếp file `.env.local`** với keys thực tế của bạn:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
   GEMINI_API_KEY=your-actual-gemini-key
   ```

### Cách 2: Sử dụng biến môi trường hệ thống

Nếu bạn không muốn sử dụng file `.env.local`, có thể set biến môi trường hệ thống:

**Windows (PowerShell)**:
```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="your-actual-url"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY="your-actual-key"
$env:GEMINI_API_KEY="your-actual-gemini-key"
npm run dev
```

**Windows (CMD)**:
```cmd
set NEXT_PUBLIC_SUPABASE_URL=your-actual-url
set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-key
set GEMINI_API_KEY=your-actual-gemini-key
npm run dev
```

### Cách 3: Kiểm tra Next.js cache

Next.js có thể cache environment variables. Hãy thử:

1. **Xóa cache và restart**:
   ```bash
   # Stop server (Ctrl+C)
   rm -rf .next
   npm run dev
   ```

2. **Hoặc sử dụng flag --turbo** để disable cache:
   ```bash
   npm run dev -- --turbo
   ```

### Cách 4: Debug runtime

Để kiểm tra environment variables tại runtime, tôi đã thêm debug logging vào `src/lib/ai/gemini.ts`.

Kiểm tra console của development server khi bạn gọi AI features - nó sẽ log:
- `GEMINI_API_KEY status: Set/Not set`
- `GEMINI_API_KEY length: xxx`
- `GEMINI_API_KEY prefix: xxx...`

## Diagnostic commands

Chạy các lệnh sau để debug:

```bash
# Kiểm tra environment variables
npm run check-env

# Kiểm tra file .env.local
cat .env.local

# Kiểm tra Next.js có đang đọc env vars không
node -e "require('dotenv').config({path: '.env.local'}); console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set')"
```

## Cấu trúc file .env.local đúng

File phải có format sau (không có BOM, không có khoảng trắng thừa):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
```

## Lưu ý quan trọng

- ⚠️ File `.env.local` đã được fix BOM issue
- ⚠️ Diagnostic script vẫn báo placeholder values
- ⚠️ Bạn cần cập nhật file với keys thực tế của bạn
- ✅ Debug logging đã được thêm để kiểm tra tại runtime
- ✅ Script `npm run check-env` có thể dùng để diagnostic

## Nếu bạn chắc chắn keys đã đúng

Nếu bạn chắc chắn keys đã được cấu hình đúng ở nơi khác, hãy:

1. Cho tôi biết file nào chứa keys thực tế của bạn
2. Hoặc chạy `npm run check-env` và chia sẻ kết quả
3. Kiểm tra console của dev server khi gọi AI features

Tôi sẽ giúp điều chỉnh code để đọc từ đúng location.
