# HCMUTE TLCN — Registration UI Handoff Pack (FINAL SELECTED VERSION)

Đây là **bản handoff đã cập nhật đúng theo ảnh chốt cuối cùng** mà người dùng xác nhận.

## Source of truth cuối cùng
- `reference/target-registration.png`

Mọi thứ phải bám theo ảnh này.
Nếu có mâu thuẫn giữa file mô tả và ảnh, **luôn ưu tiên ảnh**.

## Upload cho Gemini / Coding Agent
Tối thiểu nên upload các file sau:
- `reference/target-registration.png`
- `reference/target-left-reference.png`
- `reference/target-form-reference.png`
- `PROMPT_GEMINI_PIXEL_MATCH.md`
- `content.json`
- `design-tokens.css`
- `layout-measurements.json`
- `VISUAL_QA.md`

Có thể upload thêm:
- `effects-overlay.svg`
- `assets/background-cinematic.webp`
- `assets/campus-source.png`
- `reference/target-header-reference.png`

## Lưu ý về “giống 100%”
Mức giống 100% tuyệt đối từng pixel giữa ảnh raster AI và trình duyệt thật là không thể bảo đảm tuyệt đối do font rendering, anti-aliasing, trình duyệt và hệ điều hành.

Mục tiêu đúng là:
**pixel-perfect / visually indistinguishable ở viewport chuẩn 1448×1086**.

## Trình tự làm đúng
1. Dựng layout và geometry.
2. Match typography và line-break.
3. Match background mood / crop.
4. Match card, control, border, gradient.
5. Chụp screenshot và so với ảnh chuẩn.
6. Lặp lại cho đến khi sai khác gần như không còn đáng kể.
