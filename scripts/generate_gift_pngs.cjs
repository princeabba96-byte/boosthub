const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    rawRows.push(0); // filter: None
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      rawRows.push(rgbaBuffer[idx], rgbaBuffer[idx+1], rgbaBuffer[idx+2], rgbaBuffer[idx+3]);
    }
  }
  const idatData = zlib.deflateSync(Buffer.from(rawRows));
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Procedural 128x128 Transparent Canvas Generator
class Canvas128 {
  constructor() {
    this.width = 128;
    this.height = 128;
    this.buf = Buffer.alloc(128 * 128 * 4, 0); // all transparent
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= 128 || y < 0 || y >= 128) return;
    const idx = (Math.floor(y) * 128 + Math.floor(x)) * 4;
    // Blend with existing
    const srcA = a / 255;
    const dstA = this.buf[idx + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA <= 0) return;
    this.buf[idx] = Math.round((r * srcA + this.buf[idx] * dstA * (1 - srcA)) / outA);
    this.buf[idx + 1] = Math.round((g * srcA + this.buf[idx + 1] * dstA * (1 - srcA)) / outA);
    this.buf[idx + 2] = Math.round((b * srcA + this.buf[idx + 2] * dstA * (1 - srcA)) / outA);
    this.buf[idx + 3] = Math.round(outA * 255);
  }

  fillCircle(cx, cy, r, color, glowColor = null) {
    const minX = Math.max(0, Math.floor(cx - r - (glowColor ? 12 : 1)));
    const maxX = Math.min(127, Math.ceil(cx + r + (glowColor ? 12 : 1)));
    const minY = Math.max(0, Math.floor(cy - r - (glowColor ? 12 : 1)));
    const maxY = Math.min(127, Math.ceil(cy + r + (glowColor ? 12 : 1)));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= r) {
          const edge = Math.min(1, Math.max(0, r - d + 0.5));
          this.setPixel(x, y, color[0], color[1], color[2], Math.round((color[3] || 255) * edge));
        } else if (glowColor && d <= r + 10) {
          const glowAlpha = (1 - (d - r) / 10) * (glowColor[3] || 150) * 0.5;
          this.setPixel(x, y, glowColor[0], glowColor[1], glowColor[2], Math.round(glowAlpha));
        }
      }
    }
  }

  fillRect(rx, ry, rw, rh, color, radius = 0) {
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        if (radius > 0) {
          // rounded corners check
          const inCorner =
            (x < rx + radius && y < ry + radius && Math.hypot(x - (rx + radius), y - (ry + radius)) > radius) ||
            (x > rx + rw - radius && y < ry + radius && Math.hypot(x - (rx + rw - radius), y - (ry + radius)) > radius) ||
            (x < rx + radius && y > ry + rh - radius && Math.hypot(x - (rx + radius), y - (ry + rh - radius)) > radius) ||
            (x > rx + rw - radius && y > ry + rh - radius && Math.hypot(x - (rx + rw - radius), y - (ry + rh - radius)) > radius);
          if (inCorner) continue;
        }
        this.setPixel(x, y, color[0], color[1], color[2], color[3] || 255);
      }
    }
  }

  drawStar(cx, cy, spikes, outerR, innerR, color, glow = null) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    // Glow pass
    if (glow) {
      this.fillCircle(cx, cy, outerR + 4, glow, glow);
    }
    for (let y = cy - outerR; y <= cy + outerR; y++) {
      for (let x = cx - outerR; x <= cx + outerR; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= outerR) {
          const angle = Math.atan2(y - cy, x - cx) + Math.PI / 2;
          const pos = (angle % (2 * step) + 2 * step) % (2 * step);
          const ratio = Math.abs(pos - step) / step;
          const maxR = innerR + (outerR - innerR) * (1 - ratio);
          if (d <= maxR) {
            this.setPixel(x, y, color[0], color[1], color[2], color[3] || 255);
          }
        }
      }
    }
  }

  getPng() {
    return createPng(128, 128, this.buf);
  }
}

// Generate the 20 gifts
const GIFTS = [
  // 1. Neon Star (Random)
  {
    code: 'neon_star',
    draw(c) {
      c.fillCircle(64, 64, 40, [30, 20, 60, 100], [0, 255, 255, 180]);
      c.drawStar(64, 64, 5, 42, 18, [0, 240, 255, 255], [0, 180, 255, 120]);
      c.drawStar(64, 64, 5, 32, 14, [255, 255, 255, 255]);
      c.fillCircle(64, 64, 8, [0, 255, 255, 255]);
    }
  },
  // 2. Wobbly Duck (Random)
  {
    code: 'wobbly_duck',
    draw(c) {
      c.fillCircle(64, 76, 32, [255, 215, 0, 255], [255, 240, 100, 120]); // body
      c.fillCircle(76, 50, 22, [255, 225, 20, 255]); // head
      c.fillCircle(96, 52, 10, [255, 120, 0, 255]); // beak
      c.fillCircle(80, 46, 4, [20, 20, 20, 255]); // eye
      c.fillCircle(81, 44, 1.5, [255, 255, 255, 255]); // pupil shine
      c.fillCircle(50, 78, 14, [255, 180, 0, 255]); // wing
    }
  },
  // 3. Pizza Slice (Random)
  {
    code: 'pizza_slice',
    draw(c) {
      c.fillCircle(64, 64, 38, [200, 50, 30, 40]);
      // crust arc
      c.fillRect(34, 28, 60, 14, [205, 133, 63, 255], 6);
      // cheese wedge
      for (let y = 38; y <= 104; y++) {
        const spread = (104 - y) * 0.45;
        c.fillRect(64 - spread, y, spread * 2, 1, [255, 205, 0, 255]);
      }
      // pepperonis
      c.fillCircle(58, 54, 7, [180, 30, 30, 255]);
      c.fillCircle(70, 70, 6, [180, 30, 30, 255]);
      c.fillCircle(60, 85, 5, [180, 30, 30, 255]);
    }
  },
  // 4. Lucky Dice (Random)
  {
    code: 'lucky_dice',
    draw(c) {
      c.fillRect(32, 32, 64, 64, [245, 245, 250, 255], 14);
      c.fillRect(30, 30, 68, 68, [200, 50, 80, 60], 16);
      // Dots (5 side)
      const dot = [220, 20, 60, 255];
      c.fillCircle(48, 48, 6, dot);
      c.fillCircle(80, 48, 6, dot);
      c.fillCircle(64, 64, 7, dot);
      c.fillCircle(48, 80, 6, dot);
      c.fillCircle(80, 80, 6, dot);
    }
  },
  // 5. Lightning Bolt (Uncommon)
  {
    code: 'lightning_bolt',
    draw(c) {
      c.fillCircle(64, 64, 42, [50, 150, 255, 60], [0, 220, 255, 140]);
      for (let i = 0; i < 40; i++) {
        const y = 20 + i;
        c.fillRect(68 - i * 0.5, y, 14, 2, [255, 255, 80, 255]);
      }
      for (let i = 0; i < 45; i++) {
        const y = 60 + i;
        c.fillRect(48 + i * 0.6, y, 12 - i * 0.2, 2, [255, 255, 120, 255]);
      }
      c.fillCircle(64, 60, 10, [255, 255, 255, 255]);
    }
  },
  // 6. Golden Rose (Uncommon)
  {
    code: 'golden_rose',
    draw(c) {
      c.fillCircle(64, 52, 30, [218, 165, 32, 100], [255, 215, 0, 180]);
      // rose petals layered
      c.fillCircle(64, 48, 22, [255, 215, 0, 255]);
      c.fillCircle(56, 52, 18, [230, 180, 20, 255]);
      c.fillCircle(72, 52, 18, [240, 190, 30, 255]);
      c.fillCircle(64, 44, 12, [255, 235, 100, 255]);
      // stem & leaves
      c.fillRect(62, 70, 4, 38, [46, 139, 87, 255]);
      c.fillCircle(54, 86, 9, [50, 180, 90, 255]);
      c.fillCircle(74, 94, 9, [50, 180, 90, 255]);
    }
  },
  // 7. Crystal Crown Mini (Uncommon)
  {
    code: 'crystal_crown_mini',
    draw(c) {
      c.fillCircle(64, 64, 40, [100, 200, 255, 80], [180, 230, 255, 150]);
      c.fillRect(36, 74, 56, 14, [0, 210, 255, 255], 4);
      // crown points
      c.fillRect(36, 44, 12, 34, [100, 220, 255, 255]);
      c.fillRect(58, 36, 12, 42, [180, 240, 255, 255]);
      c.fillRect(80, 44, 12, 34, [100, 220, 255, 255]);
      c.fillCircle(42, 42, 6, [255, 255, 255, 255]);
      c.fillCircle(64, 34, 7, [255, 255, 255, 255]);
      c.fillCircle(86, 42, 6, [255, 255, 255, 255]);
    }
  },
  // 8. Serpent Ring (Rare)
  {
    code: 'serpent_ring',
    draw(c) {
      c.fillCircle(64, 64, 38, [34, 139, 34, 80], [50, 205, 50, 160]);
      // ring band
      c.fillCircle(64, 64, 30, [218, 165, 32, 255]);
      c.fillCircle(64, 64, 20, [0, 0, 0, 0]); // hollow center
      // serpent head on top
      c.fillCircle(64, 34, 14, [46, 204, 113, 255]);
      c.fillCircle(59, 32, 3, [255, 0, 0, 255]); // red eye
      c.fillCircle(69, 32, 3, [255, 0, 0, 255]);
      c.fillCircle(64, 24, 4, [255, 215, 0, 255]); // gem
    }
  },
  // 9. Dragon Egg (Rare)
  {
    code: 'dragon_egg',
    draw(c) {
      c.fillCircle(64, 64, 40, [150, 50, 200, 80], [255, 100, 50, 160]);
      // oval egg
      for (let y = 28; y <= 100; y++) {
        const p = (y - 28) / 72;
        const width = Math.sin(p * Math.PI) * 28 * (1 - p * 0.25);
        c.fillRect(64 - width, y, width * 2, 1, [230, 80, 40, 255]);
      }
      // scales
      for (let i = 0; i < 5; i++) {
        c.fillCircle(56 + (i % 2) * 16, 46 + i * 10, 6, [255, 165, 0, 255]);
      }
    }
  },
  // 10. Angel Wings (Rare)
  {
    code: 'angel_wings',
    draw(c) {
      c.fillCircle(64, 64, 44, [200, 220, 255, 80], [255, 255, 255, 180]);
      // Left wing
      for (let i = 0; i < 6; i++) {
        c.fillCircle(40 - i * 3, 50 + i * 7, 12, [245, 248, 255, 255]);
      }
      // Right wing
      for (let i = 0; i < 6; i++) {
        c.fillCircle(88 + i * 3, 50 + i * 7, 12, [245, 248, 255, 255]);
      }
      // Halo
      c.fillCircle(64, 32, 14, [255, 215, 0, 255]);
      c.fillCircle(64, 32, 9, [0, 0, 0, 0]);
    }
  },
  // 11. Demon Horns (Rare)
  {
    code: 'demon_horns',
    draw(c) {
      c.fillCircle(64, 64, 42, [180, 20, 40, 80], [255, 0, 60, 160]);
      // Left horn curved
      for (let y = 24; y < 80; y++) {
        const x = 44 - Math.sin((y - 24) / 56 * Math.PI) * 16;
        c.fillCircle(x, y, (80 - y) * 0.2 + 3, [220, 20, 60, 255]);
      }
      // Right horn curved
      for (let y = 24; y < 80; y++) {
        const x = 84 + Math.sin((y - 24) / 56 * Math.PI) * 16;
        c.fillCircle(x, y, (80 - y) * 0.2 + 3, [220, 20, 60, 255]);
      }
      c.fillCircle(64, 76, 12, [60, 10, 20, 255]);
    }
  },
  // 12. Galaxy Sword (Epic)
  {
    code: 'galaxy_sword',
    draw(c) {
      c.fillCircle(64, 64, 46, [80, 0, 160, 100], [180, 50, 255, 200]);
      // diagonal blade
      for (let i = 0; i < 55; i++) {
        const x = 32 + i;
        const y = 96 - i;
        c.fillCircle(x, y, 4, [160, 210, 255, 255]);
        c.fillCircle(x, y, 2, [255, 255, 255, 255]);
      }
      // crossguard & pommel
      c.fillCircle(38, 90, 8, [255, 215, 0, 255]);
      c.fillCircle(28, 100, 6, [147, 112, 219, 255]);
      c.drawStar(86, 42, 4, 10, 3, [255, 255, 255, 255]);
    }
  },
  // 13. Star Serpent Crown (Epic)
  {
    code: 'star_serpent_crown',
    draw(c) {
      c.fillCircle(64, 64, 46, [120, 0, 220, 90], [0, 230, 255, 180]);
      c.fillRect(32, 70, 64, 16, [106, 90, 205, 255], 6);
      // serpent coils rising as crown spikes
      c.fillCircle(42, 46, 10, [0, 255, 200, 255]);
      c.fillCircle(64, 34, 14, [180, 100, 255, 255]);
      c.fillCircle(86, 46, 10, [0, 255, 200, 255]);
      c.drawStar(64, 34, 5, 10, 4, [255, 255, 255, 255]);
    }
  },
  // 14. Frost Phoenix Pet (Epic)
  {
    code: 'frost_phoenix_pet',
    draw(c) {
      c.fillCircle(64, 64, 46, [0, 150, 255, 90], [180, 240, 255, 200]);
      // phoenix body
      c.fillCircle(64, 60, 20, [0, 200, 255, 255]);
      c.fillCircle(64, 42, 14, [200, 245, 255, 255]); // head
      c.fillCircle(74, 42, 6, [255, 215, 0, 255]); // golden beak
      // ice crest
      c.fillRect(58, 22, 6, 16, [180, 255, 255, 255], 3);
      // wings
      c.fillCircle(38, 58, 16, [100, 220, 255, 255]);
      c.fillCircle(90, 58, 16, [100, 220, 255, 255]);
      // tail feathers
      c.fillRect(62, 78, 4, 30, [0, 220, 255, 255]);
      c.fillRect(54, 82, 4, 24, [140, 240, 255, 255]);
      c.fillRect(70, 82, 4, 24, [140, 240, 255, 255]);
    }
  },
  // 15. Void Eye (Epic)
  {
    code: 'void_eye',
    draw(c) {
      c.fillCircle(64, 64, 46, [30, 0, 50, 120], [180, 0, 255, 210]);
      // eye shape
      for (let y = 38; y <= 90; y++) {
        const p = (y - 38) / 52;
        const width = Math.sin(p * Math.PI) * 44;
        c.fillRect(64 - width, y, width * 2, 1, [75, 0, 130, 255]);
      }
      // iris
      c.fillCircle(64, 64, 22, [148, 0, 211, 255], [255, 0, 255, 180]);
      // void slit pupil
      c.fillRect(61, 46, 6, 36, [10, 0, 20, 255], 3);
      c.fillCircle(67, 58, 3, [255, 255, 255, 255]);
    }
  },
  // 16. Titan Gauntlet (Mythic)
  {
    code: 'titan_gauntlet',
    draw(c) {
      c.fillCircle(64, 64, 48, [180, 100, 0, 100], [255, 180, 0, 220]);
      // gold armored gauntlet
      c.fillRect(40, 48, 48, 54, [218, 165, 32, 255], 8);
      // fingers
      for (let i = 0; i < 4; i++) {
        c.fillRect(42 + i * 11, 28, 9, 22, [255, 215, 0, 255], 4);
      }
      // Infinity gems
      const gemColors = [
        [255, 50, 50], [50, 255, 100], [50, 100, 255], [255, 255, 50]
      ];
      gemColors.forEach((gc, idx) => {
        c.fillCircle(46 + idx * 11, 56, 4, [gc[0], gc[1], gc[2], 255]);
      });
      c.fillCircle(64, 76, 8, [255, 140, 0, 255]); // center soul gem
    }
  },
  // 17. Celestial Throne (Mythic)
  {
    code: 'celestial_throne',
    draw(c) {
      c.fillCircle(64, 64, 48, [100, 50, 200, 100], [255, 215, 0, 220]);
      // High golden seat back
      c.fillRect(42, 24, 44, 50, [255, 215, 0, 255], 8);
      c.fillRect(46, 30, 36, 40, [138, 43, 226, 255], 4); // velvet cushion
      // Base seat
      c.fillRect(36, 70, 56, 18, [218, 165, 32, 255], 6);
      c.fillRect(38, 72, 52, 12, [148, 0, 211, 255]);
      // Legs
      c.fillRect(38, 88, 8, 18, [255, 215, 0, 255]);
      c.fillRect(82, 88, 8, 18, [255, 215, 0, 255]);
      // Halo stars
      c.drawStar(64, 20, 5, 9, 3, [255, 255, 255, 255]);
    }
  },
  // 18. Star Serpent Pet (Mythic)
  {
    code: 'star_serpent_pet',
    draw(c) {
      c.fillCircle(64, 64, 48, [50, 0, 120, 110], [0, 240, 255, 220]);
      // Coiled celestial dragon serpent
      for (let a = 0; a < Math.PI * 3.5; a += 0.08) {
        const r = 14 + a * 6;
        const x = 64 + Math.cos(a) * r;
        const y = 64 + Math.sin(a) * r;
        c.fillCircle(x, y, 7 - a * 0.7, [0, 210, 255, 255]);
        c.fillCircle(x, y, 3, [255, 255, 255, 255]);
      }
      // Dragon head
      c.fillCircle(84, 52, 12, [147, 112, 219, 255]);
      c.fillCircle(88, 50, 3, [255, 215, 0, 255]); // eye
      c.fillCircle(94, 52, 4, [0, 255, 255, 255]); // breath glow
    }
  },
  // 19. Crown of Infinite Stars (Grand)
  {
    code: 'crown_of_infinite_stars',
    draw(c) {
      c.fillCircle(64, 64, 50, [150, 100, 0, 120], [255, 230, 80, 250]);
      // Regal 24K Grand base
      c.fillRect(28, 68, 72, 18, [255, 215, 0, 255], 6);
      c.fillRect(32, 72, 64, 8, [255, 255, 255, 255], 4);
      // High star points
      c.fillRect(32, 42, 12, 28, [255, 215, 0, 255]);
      c.fillRect(50, 32, 12, 38, [255, 235, 50, 255]);
      c.fillRect(66, 32, 12, 38, [255, 235, 50, 255]);
      c.fillRect(84, 42, 12, 28, [255, 215, 0, 255]);
      // Diamond Stars atop points
      c.drawStar(38, 38, 5, 8, 3, [255, 255, 255, 255]);
      c.drawStar(56, 26, 6, 12, 4, [255, 255, 255, 255]);
      c.drawStar(72, 26, 6, 12, 4, [255, 255, 255, 255]);
      c.drawStar(90, 38, 5, 8, 3, [255, 255, 255, 255]);
    }
  },
  // 20. Star Serpent Emperor (Grand)
  {
    code: 'star_serpent_emperor',
    draw(c) {
      c.fillCircle(64, 64, 52, [255, 120, 0, 130], [255, 220, 0, 255]);
      // Emperor Dragon Aureole
      c.fillCircle(64, 64, 42, [30, 15, 60, 200]);
      // Golden dragon coils
      for (let a = 0; a < Math.PI * 4; a += 0.08) {
        const r = 16 + a * 5.5;
        const x = 64 + Math.cos(a) * r;
        const y = 64 + Math.sin(a) * r;
        c.fillCircle(x, y, 8 - a * 0.6, [255, 180, 0, 255]);
        c.fillCircle(x, y, 4, [255, 255, 200, 255]);
      }
      // Emperor Dragon Mask
      c.fillCircle(64, 40, 18, [255, 215, 0, 255]);
      c.fillCircle(58, 36, 4, [255, 0, 0, 255]); // red dragon eyes
      c.fillCircle(70, 36, 4, [255, 0, 0, 255]);
      c.drawStar(64, 20, 5, 12, 5, [255, 255, 255, 255]); // emperor star
    }
  }
];

// Generate the 6 Gift Boxes
const BOXES = [
  // 1. Pink Ribbon Box (Random)
  {
    code: 'pink_ribbon_box',
    draw(c) {
      c.fillCircle(64, 64, 48, [255, 105, 180, 80], [255, 192, 203, 160]);
      // Box body
      c.fillRect(36, 52, 56, 48, [255, 182, 193, 255], 8);
      // Box lid
      c.fillRect(32, 44, 64, 14, [255, 105, 180, 255], 6);
      // Vertical ribbon
      c.fillRect(60, 44, 8, 56, [255, 20, 147, 255]);
      // Big bow on top
      c.fillCircle(54, 38, 8, [255, 20, 147, 255]);
      c.fillCircle(74, 38, 8, [255, 20, 147, 255]);
      c.fillCircle(64, 40, 5, [255, 255, 255, 255]);
    }
  },
  // 2. Red Heart Box (Uncommon)
  {
    code: 'red_heart_box',
    draw(c) {
      c.fillCircle(64, 64, 48, [220, 20, 60, 90], [255, 50, 100, 180]);
      // Heart-shaped gift box
      c.fillCircle(50, 48, 20, [220, 20, 60, 255]);
      c.fillCircle(78, 48, 20, [220, 20, 60, 255]);
      for (let y = 52; y <= 98; y++) {
        const spread = (98 - y) * 0.7;
        c.fillRect(64 - spread, y, spread * 2, 1, [200, 10, 50, 255]);
      }
      // Gold ribbon crossing
      c.fillRect(61, 38, 6, 56, [255, 215, 0, 255]);
      c.fillCircle(64, 52, 7, [255, 255, 255, 255]);
    }
  },
  // 3. Black Gold Luxury Box (Rare)
  {
    code: 'black_gold_luxury_box',
    draw(c) {
      c.fillCircle(64, 64, 48, [218, 165, 32, 100], [255, 215, 0, 200]);
      // Black velvet box body
      c.fillRect(36, 52, 56, 48, [18, 18, 24, 255], 8);
      // Gold trim around edges
      c.fillRect(36, 52, 56, 3, [255, 215, 0, 255]);
      c.fillRect(36, 97, 56, 3, [255, 215, 0, 255]);
      // Box lid
      c.fillRect(32, 42, 64, 15, [28, 28, 36, 255], 6);
      c.fillRect(32, 42, 64, 2, [255, 215, 0, 255]);
      // 24K Gold ribbon & seal
      c.fillRect(60, 42, 8, 58, [255, 215, 0, 255]);
      c.fillCircle(64, 40, 10, [255, 215, 0, 255]);
      c.fillCircle(64, 40, 6, [218, 165, 32, 255]);
    }
  },
  // 4. Galaxy Box with particles (Epic)
  {
    code: 'galaxy_box',
    draw(c) {
      c.fillCircle(64, 64, 50, [75, 0, 130, 120], [138, 43, 226, 220]);
      // Cosmic nebula gradient box
      c.fillRect(36, 52, 56, 48, [36, 12, 68, 255], 8);
      c.fillRect(32, 42, 64, 15, [54, 18, 98, 255], 6);
      // Stellar neon cyan cross ribbon
      c.fillRect(60, 42, 8, 58, [0, 255, 255, 255]);
      c.fillRect(36, 72, 56, 8, [0, 255, 255, 255]);
      // Stars & particles orbiting
      c.drawStar(64, 40, 6, 10, 4, [255, 255, 255, 255]);
      c.drawStar(24, 34, 4, 6, 2, [0, 255, 255, 255]);
      c.drawStar(104, 38, 4, 6, 2, [255, 100, 255, 255]);
      c.drawStar(100, 90, 4, 5, 2, [0, 255, 255, 255]);
    }
  },
  // 5. Void Box (Mythic)
  {
    code: 'void_box',
    draw(c) {
      c.fillCircle(64, 64, 50, [20, 0, 40, 150], [148, 0, 211, 230]);
      // Obsidian void box
      c.fillRect(36, 52, 56, 48, [8, 4, 16, 255], 8);
      c.fillRect(32, 42, 64, 15, [14, 8, 26, 255], 6);
      // Cracks of glowing void energy
      for (let i = 0; i < 30; i++) {
        c.setPixel(50 + (i % 8) * 3, 55 + i, 200, 0, 255, 255);
        c.setPixel(78 - (i % 6) * 3, 58 + i, 180, 0, 255, 255);
      }
      // Floating Void Crystal Core
      c.fillCircle(64, 40, 11, [148, 0, 211, 255], [255, 0, 255, 220]);
      c.fillCircle(64, 40, 5, [255, 255, 255, 255]);
    }
  },
  // 6. Cosmic God Box (Grand)
  {
    code: 'cosmic_god_box',
    draw(c) {
      c.fillCircle(64, 64, 52, [255, 140, 0, 140], [255, 220, 0, 255]);
      // God rays background simulation
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        for (let r = 38; r < 58; r++) {
          c.setPixel(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 255, 220, 50, 180);
        }
      }
      // Pure Celestial 24K God Box
      c.fillRect(36, 52, 56, 48, [255, 200, 0, 255], 8);
      c.fillRect(40, 56, 48, 40, [255, 235, 100, 255], 4);
      c.fillRect(32, 42, 64, 15, [255, 220, 0, 255], 6);
      // Emperor Solar Emblem
      c.fillCircle(64, 40, 14, [255, 255, 255, 255], [255, 215, 0, 240]);
      c.drawStar(64, 40, 8, 12, 5, [255, 140, 0, 255]);
      c.fillCircle(64, 40, 4, [255, 255, 255, 255]);
    }
  }
];

const outDir = path.join(__dirname, '../public/assets/gifts');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

let generatedCount = 0;

for (const gift of GIFTS) {
  const canvas = new Canvas128();
  gift.draw(canvas);
  const pngBuf = canvas.getPng();
  fs.writeFileSync(path.join(outDir, `${gift.code}.png`), pngBuf);
  generatedCount++;
}

for (const box of BOXES) {
  const canvas = new Canvas128();
  box.draw(canvas);
  const pngBuf = canvas.getPng();
  fs.writeFileSync(path.join(outDir, `${box.code}.png`), pngBuf);
  generatedCount++;
}

console.log(`Successfully generated ${generatedCount} transparent PNG files in ${outDir}!`);
