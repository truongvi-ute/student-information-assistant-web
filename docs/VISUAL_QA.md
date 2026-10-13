# Visual QA — FINAL SELECTED VERSION

## Viewport chuẩn bắt buộc
`1448 × 1086`

## Ảnh chuẩn
- `reference/target-registration.png`

## Thứ tự kiểm tra
1. Background crop và overall mood.
2. Header baseline và spacing.
3. Hero badge, H1, body copy.
4. 3 benefit item.
5. Gate cluster / cổng trường.
6. Form card position / width / height.
7. Form title và subtitle.
8. Role selector.
9. Input label / field height / icon alignment.
10. Checkbox row.
11. CTA gradient.
12. Separator + social buttons.

## Screenshot loop
Nếu agent có Playwright:

```ts
await page.setViewportSize({ width: 1448, height: 1086 });
await page.goto('http://localhost:3000/register');
await page.screenshot({ path: 'artifacts/register-1448x1086.png', fullPage: true });
```

So `artifacts/register-1448x1086.png` với `reference/target-registration.png`.

## Definition of done
- Lật nhanh qua lại giữa ảnh reference và screenshot mà không thấy sai khác lớn.
- H1 cùng line-break.
- Card ở đúng vùng bên phải, cùng kích thước cảm nhận.
- Background giữ đúng cảm giác cinematic xanh tím với cổng HCMUTE sáng ấm.
- Không có scrollbar dọc ở desktop.
- Không có thành phần thừa/thiếu.
