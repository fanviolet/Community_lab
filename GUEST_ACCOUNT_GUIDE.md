# Hướng dẫn tạo lại tài khoản Guest

Đã tạo script và SQL để tạo lại tài khoản guest@communitylab.demo

## Cách 1: Sử dụng Script Node.js (Khuyên dùng)

### Bước 1: Cài đặt dependencies
```bash
npm install dotenv
```

### Bước 2: Kiểm tra environment variables
Đảm bảo file `.env.local` có:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Bước 3: Chạy script
```bash
npm run create-guest
```

Script sẽ:
- Xóa profile cũ nếu tồn tại
- Tạo auth user mới với email `guest@communitylab.demo`
- Profile sẽ được auto-create bởi trigger
- Thêm vào default group `community-lab`
- Mật khẩu: `demo123`

## Cách 2: Sử dụng Supabase Dashboard (Khuyên dùng nếu không có Service Role Key)

### Bước 1: Chạy SQL cleanup
Trong Supabase Dashboard > SQL Editor, chạy file:
`supabase/0051_recreate_guest_account.sql`

### Bước 2: Tạo auth user thủ công
1. Vào Supabase Dashboard > Authentication > Users
2. Click "Add User" hoặc "New User"
3. Điền thông tin:
   - Email: `guest@communitylab.demo`
   - Password: `demo123`
   - Auto confirm email: ✅
4. Click "Create User"

### Bước 3: Verify profile
Profile sẽ được auto-create bởi trigger `handle_new_user`. Kiểm tra trong bảng `profiles`.

## Cách 3: Sử dụng API trong Browser Console

Mở browser console và chạy:

```javascript
const { createClient } = supabase;
const client = createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY');

await client.auth.signUp({
  email: 'guest@communitylab.demo',
  password: 'demo123'
});
```

## Thông tin tài khoản

- **Email**: guest@communitylab.demo
- **Password**: demo123
- **Role**: member
- **Display Name**: Guest User
- **Group**: community-lab (default)

## Troubleshooting

### Script báo lỗi thiếu environment variables
- Kiểm tra file `.env.local` có tồn tại
- Đảm bảo có `NEXT_PUBLIC_SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`
- Service Role Key có thể lấy từ Supabase Dashboard > Project Settings > API

### SQL báo lỗi ON CONFLICT
- File SQL đã được sửa để loại bỏ các câu lệnh INSERT gây lỗi
- Chỉ làm cleanup, profile sẽ được tạo bởi trigger khi auth user được tạo

### Profile không được tạo tự động
- Kiểm tra trigger `handle_new_user` có hoạt động
- Kiểm tra RLS policies trên bảng `profiles`
- Có thể tạo profile thủ công qua SQL

### Không thể đăng nhập
- Kiểm tra email đã được confirm
- Kiểm tra password đúng là `demo123`
- Kiểm tra user không bị disabled trong Supabase Auth

## File đã tạo

1. `supabase/0051_recreate_guest_account.sql` - SQL script cleanup (sửa lỗi ON CONFLICT)
2. `scripts/create-guest-account.js` - Node.js script cho automated setup
3. Đã thêm npm script `create-guest` vào package.json
4. Đã cài đặt `dotenv` dependency

## Lưu ý quan trọng

- Service Role Key có quyền admin, chỉ dùng trong server-side scripts
- Không bao giờ expose Service Role Key trong client-side code
- Script sẽ cleanup tài khoản cũ trước khi tạo mới
- SQL script chỉ làm cleanup, không tạo profile trực tiếp (để tránh lỗi ON CONFLICT)
- Profile sẽ được auto-create bởi trigger khi auth user được tạo
- Mật khẩu mặc định là `demo123`, nên thay đổi sau khi đăng nhập lần đầu
