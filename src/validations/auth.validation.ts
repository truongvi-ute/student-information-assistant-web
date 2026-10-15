// Biểu thức chính quy kiểm tra định dạng email tiêu chuẩn
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Kiểm tra định dạng email hợp lệ
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

// Kiểm tra tính hợp lệ dữ liệu đăng nhập
export function validateLoginForm(identifier: string, password: string): string | null {
  const trimmed = identifier.trim();

  if (!trimmed) {
    return "Vui lòng nhập Email sinh viên hoặc Mã số sinh viên (MSSV).";
  }

  if (!password) {
    return "Vui lòng nhập mật khẩu.";
  }

  if (password.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  return null;
}

// Kiểm tra tính hợp lệ dữ liệu đăng ký tài khoản
export function validateRegisterForm(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
  consent: boolean
): string | null {
  if (!consent) {
    return "Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.";
  }

  if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
    return "Vui lòng nhập đầy đủ thông tin bắt buộc.";
  }

  if (!isValidEmail(email)) {
    return "Địa chỉ email không đúng định dạng.";
  }

  if (password.length < 8) {
    return "Mật khẩu phải có ít nhất 8 ký tự.";
  }

  if (password !== confirmPassword) {
    return "Mật khẩu xác nhận không khớp.";
  }

  return null;
}

// Kiểm tra mã OTP gồm 6 chữ số
export function validateOtp(otp: string): string | null {
  const trimmed = otp.trim();
  if (!trimmed || trimmed.length < 6) {
    return "Vui lòng nhập đầy đủ 6 chữ số mã OTP.";
  }
  return null;
}

// Kiểm tra dữ liệu đặt lại mật khẩu mới
export function validateResetPassword(
  newPassword: string,
  confirmPassword: string
): string | null {
  if (!newPassword || !confirmPassword) {
    return "Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.";
  }

  if (newPassword.length < 8) {
    return "Mật khẩu phải có ít nhất 8 ký tự.";
  }

  if (newPassword !== confirmPassword) {
    return "Mật khẩu xác nhận không khớp nhau.";
  }

  return null;
}
