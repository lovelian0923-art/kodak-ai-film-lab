# Apparel mockup asset contract

Add these six transparent-background, front-facing product photographs here:

- `tshirt-cream.png` (final fixed PORTRA frame mockup)
- `tshirt-yellow.png` (final fixed KODAK 400 frame mockup)
- `tshirt-black.png` (final fixed OUR MOMENT frame mockup)
- `hoodie-cream.png` (final fixed PORTRA frame mockup)
- `hoodie-yellow.png` (final fixed KODAK 400 frame mockup)
- `hoodie-black.png` (final fixed OUR MOMENT frame mockup)
- `tumbler-red.png` (ready-made red product)
- `tumbler-yellow.png` (ready-made Kodak yellow product)
- `tumbler-split.png` (ready-made red/yellow split product)

Use the same canvas and garment alignment for every color (recommended: square,
at least 1600 × 1600 px). The garment should be centred, photographed from the
front, and include its natural studio contact shadow within the image.

The application keeps the product photograph separate from the generated Kodak
artwork. Once a file with one of these exact names is present, its matching color
preview loads automatically; no JavaScript or CSS change is required.

Current artwork safe areas, measured as percentages of the full image canvas:

- T-shirt: x 37%, y 26%, width 26%, height 38%
- Hoodie: x 36.5%, y 30%, width 27%, height 32%

These values assume a consistently aligned square canvas. Fine-tune the values in
`PRODUCT_MOCKUP_CONFIG` only if the supplied photography uses different framing.
