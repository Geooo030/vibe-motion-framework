# 实际生成提示词

工具：内置 image_gen。输入 1 为本期已生成封面；清理步骤输入为第一轮角色立绘。

## 角色提取与立绘

```text
Use case: identity-preserve / background-extraction.
Input image 1 is the existing video cover, and the GREY-AND-WHITE PIXEL CAT on its right is the exact character identity reference. Create one reusable master character asset of THAT SAME CAT, not a new cat and not the classic Tom and Jerry character.
Output: a single centered full-body pixel-art character on a genuinely TRANSPARENT RGBA background, ideally square 1024x1024. NO checkerboard drawn into the art, no opaque background, no floor, no cast shadow, no text, no title, no game scenery or UI. Leave generous empty transparent padding around both ears, feet and tail.
Identity to preserve precisely from the cover: cute stocky chibi proportions, broad grey/lavender tabby head, dark charcoal stepped pixel outline, triangular ears with pink interiors, three darker forehead markings, white central forehead blaze running into a white muzzle, white cheeks/chest/belly and paws, golden amber irises, narrow dark pupils, slightly cheeky lowered brows, tiny pink nose, expressive friendly open smile with a little pink tongue. Match the cover's grey/lavender and warm off-white fur palette, face shape and cheek tufts. Tail curls toward the viewer's right, grey with dark bands.
Pose: neutral reusable standing pose, face and torso mostly facing camera with only a subtle three-quarter turn matching the reference; two arms relaxed slightly away from the torso, BOTH empty paws clearly visible, two feet planted at one level. Remove the controller and the victory fist pose so the mascot can be reused for science/technology explanation, not only gaming. Do not add clothing, glasses, badges or props.
Pixel style invariant: crisp hand-placed-looking 16-bit pixel clusters, consistent square pixel grid throughout, chunky clean stair-step silhouette, limited flat colour ramps, no anti-aliased painterly fur, no blurry edge, no smooth vector curves, no photorealism, no 3D. Do not make a contact sheet: ONE character only, large and readable. Preserve identity, not the surrounding cover composition.
```

## 定向清理

```text
Edit this exact transparent pixel cat asset only to clean its cutout. Preserve the character identity, facial expression, pose, proportions, fur colors, golden eyes, white blaze, whiskers, pink ears, pixel style and canvas composition unchanged. Remove the detached dark floating fragment directly above the tail on the viewer's right and all isolated stray background pixels or faint alpha haze outside the character. The tail should have one clean continuous outline and intact rounded tip. Make all empty space truly alpha=0 transparent, not a black or checkerboard background. No floor shadow, no added props or text. Keep the character pixels opaque with crisp stepped pixel-art edges, no feathering or glow. Return the one cleaned full-body RGBA PNG with transparent padding.
```
