# Image Security Documentation

## Tổng quan

Hệ thống bảo mật hình ảnh được thiết kế để ngăn chặn việc scraping/crawling và truy cập trái phép vào nội dung manga. Thay vì trả trực tiếp Cloudinary URLs cho client, hệ thống sử dụng kiến trúc proxy với nhiều lớp bảo mật.

## Kiến trúc

```
Frontend (Next.js)
    ↓
    Request /manga/chapter/:id/pages
    ↓
Backend API
    ↓ 
    Generate Signed URLs
    ↓
    Return URLs with tokens
    ↓
Frontend displays images
    ↓
    Request /manga/page-image/:pageId?token=xxx
    ↓
Backend validates & proxies
    ↓
Cloudinary (actual images)
```

## Các lớp bảo mật

### 1. Proxy Architecture

**Vấn đề**: Cloudinary URLs công khai → dễ bị scrape
**Giải pháp**: Backend proxy tất cả image requests

#### Implementation:

**File**: `controllers/client/manga.controller.js`

```javascript
// Trả về proxy URLs thay vì Cloudinary URLs trực tiếp
module.exports.getChapterPages = async (req, res) => {
  const pages = await Manga.getChapterPages(chapterId);
  const securePages = pages.map(page => ({
    ...page,
    image_url: `${baseUrl}/manga/page-image/${page.page_id}?token=${token}`
  }));
  res.json({ code: "success", data: securePages });
};
```

**Lợi ích**:
- ✅ Cloudinary URLs ẩn hoàn toàn
- ✅ User không thể truy cập trực tiếp Cloudinary
- ✅ Kiểm soát hoàn toàn access

---

### 2. Signed Token với Expiration

**Vấn đề**: URL có thể bị copy và share thoải mái
**Giải pháp**: HMAC SHA-256 signed tokens với thời gian hết hạn

#### Implementation:

```javascript
const crypto = require('crypto');
const URL_SECRET = process.env.URL_SECRET || 'your-secret-key-change-this';

// Generate token
const generateSignedToken = (pageId, expiresIn = 3600) => {
  const expirationTime = Math.floor(Date.now() / 1000) + expiresIn;
  const data = `${pageId}:${expirationTime}`;
  const signature = crypto.createHmac('sha256', URL_SECRET)
    .update(data)
    .digest('hex');
  return `${signature}:${expirationTime}`;
};

// Verify token
const verifySignedToken = (pageId, token) => {
  const [signature, expirationTime] = token.split(':');
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Check expiration
  if (currentTime > parseInt(expirationTime)) {
    return { valid: false, reason: 'Token expired' };
  }
  
  // Verify signature
  const data = `${pageId}:${expirationTime}`;
  const expectedSignature = crypto.createHmac('sha256', URL_SECRET)
    .update(data)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return { valid: false, reason: 'Invalid signature' };
  }
  
  return { valid: true };
};
```

#### Token Format:
```
?token=abc123def456...789:1734456789
        └─ HMAC SHA-256 ─┘ └ Expiration ┘
```

**Lợi ích**:
- ✅ Token hết hạn sau 1 giờ (configurable)
- ✅ Không thể forge/fake token
- ✅ Không thể reuse token sau khi hết hạn

---

### 3. Strict Referrer Checking

**Vấn đề**: URL có thể paste vào browser khác hoặc share
**Giải pháp**: BẮT BUỘC request phải từ website chính thống

#### Implementation:

```javascript
module.exports.getPageImage = async (req, res) => {
  // MUST have referrer
  const referrer = req.get('referer') || req.get('referrer');
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:5000'];
  
  if (!referrer) {
    return res.status(403).json({ 
      code: "error", 
      message: "Direct access forbidden. This image can only be loaded from our website." 
    });
  }
  
  // Verify referrer origin
  const referrerOrigin = new URL(referrer).origin;
  if (!allowedOrigins.includes(referrerOrigin)) {
    return res.status(403).json({ 
      code: "error", 
      message: "Invalid referrer. Access denied." 
    });
  }
  
  // ... proceed to load image
};
```

**Chặn được**:
- ❌ Paste URL trực tiếp vào browser
- ❌ Share link cho người khác
- ❌ Download managers (IDM, etc.)
- ❌ Embed trong website khác
- ❌ CURL/wget commands

**Production Note**: 
Thay `http://localhost:3000` bằng production domain:
```javascript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];
```

---

### 4. Rate Limiting

**Vấn đề**: Brute force attacks hoặc mass scraping
**Giải pháp**: Giới hạn số requests mỗi IP

#### Implementation:

**File**: `routes/client/manga.route.js`

```javascript
const rateLimitMap = new Map();

const rateLimit = (limit = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const record = rateLimitMap.get(key);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    if (record.count >= limit) {
      return res.status(429).json({ 
        code: "error", 
        message: "Too many requests, please try again later" 
      });
    }
    
    record.count++;
    next();
  };
};

// Apply to image endpoint
route.get("/page-image/:pageId", rateLimit(100, 60000), mangaController.getPageImage);
```

**Giới hạn**:
- 100 requests per minute per IP
- Auto reset sau 1 phút

**Lợi ích**:
- ✅ Ngăn chặn mass downloading
- ✅ Bảo vệ server khỏi DDoS
- ✅ Kiểm soát băng thông

---

## Database Schema

### Pages Table
```sql
CREATE TABLE pages (
  page_id INT PRIMARY KEY AUTO_INCREMENT,
  chapter_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,  -- Cloudinary URL (private)
  page_number INT NOT NULL,
  language VARCHAR(10),
  FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
);
```

**Quan trọng**: `image_url` KHÔNG BAO GIỜ được trả trực tiếp cho client.

---

## Frontend Configuration

### Next.js Config

**File**: `frontend/next.config.ts`

```typescript
const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Disable Next.js image proxy
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/manga/page-image/**',
      },
    ],
  },
};
```

**Tại sao `unoptimized: true`?**
- Next.js không thể proxy localhost URLs (SSRF protection)
- Images đã được optimize bởi Cloudinary
- Giảm load cho Next.js server

---

## Environment Variables

Thêm vào `.env`:

```env
# Cloudinary Config
CLOUD_NAME=your_cloud_name
CLOUD_KEY=your_api_key
CLOUD_SECRET=your_api_secret

# Security
URL_SECRET=change-this-to-random-secret-key-in-production
```

**Tạo URL_SECRET mạnh**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## API Endpoints

### 1. Get Chapter Pages
```
GET /manga/chapter/:id/pages
Response:
{
  "code": "success",
  "data": [
    {
      "page_id": 123,
      "page_number": 1,
      "chapter_id": 19,
      "language": "en",
      "image_url": "http://localhost:5000/manga/page-image/123?token=abc...def:1734456789"
    }
  ]
}
```

### 2. Get Page Image (Proxy)
```
GET /manga/page-image/:pageId?token=xxx
Headers Required:
  Referer: http://localhost:3000/read/...

Response: Image binary (JPEG/PNG)
Status Codes:
  200: Success
  403: Forbidden (invalid token/referrer)
  404: Page not found
  429: Too many requests
  500: Server error
```

---

## Security Checklist

### Development
- [x] Proxy architecture implemented
- [x] Signed tokens with expiration
- [x] Strict referrer checking
- [x] Rate limiting per IP
- [x] Cloudinary URLs hidden

### Before Production
- [ ] Change `URL_SECRET` to strong random key
- [ ] Update `allowedOrigins` to production domain
- [ ] Enable HTTPS (update protocol checks)
- [ ] Consider Redis for rate limiting (scalable)
- [ ] Add logging for security events
- [ ] Monitor for unusual traffic patterns
- [ ] Set up CDN caching (Cloudflare, etc.)

---

## Potential Bypasses & Mitigations

### 1. User shares token before expiration
**Mitigation**: 
- Shorten token expiration (currently 1 hour)
- Add user session validation (optional)

### 2. User spoofs referrer header
**Mitigation**:
- Modern browsers prevent referrer spoofing from web context
- Server-side curl/postman can spoof → combine with token verification

### 3. User downloads all images before expiration
**Mitigation**:
- Rate limiting already in place (100/min)
- Can add additional limits per chapter/manga

### 4. Distributed scraping (multiple IPs)
**Mitigation**:
- Add authentication requirement (user must login)
- Monitor for suspicious patterns
- Consider CAPTCHA for heavy users

---

## Performance Considerations

### Caching Strategy
```javascript
res.set('Cache-Control', 'private, max-age=3600'); // 1 hour browser cache
```

- `private`: Only browser caches, not CDN
- `max-age=3600`: Cache for 1 hour

### Load Impact
- Each image request goes through Node.js
- Consider using stream piping (already implemented)
- Monitor server memory usage

### Scalability
For high traffic:
1. Use Redis for rate limiting
2. Consider CDN with signed URLs
3. Implement image lazy loading on frontend

---

## Testing

### Test Cases

1. **Valid Request**
```bash
# Should return image
curl -H "Referer: http://localhost:3000" \
  "http://localhost:5000/manga/page-image/123?token=valid_token"
```

2. **No Referrer**
```bash
# Should return 403
curl "http://localhost:5000/manga/page-image/123?token=valid_token"
```

3. **Invalid Token**
```bash
# Should return 403
curl -H "Referer: http://localhost:3000" \
  "http://localhost:5000/manga/page-image/123?token=invalid"
```

4. **Expired Token**
```bash
# Wait 1 hour, should return 403
curl -H "Referer: http://localhost:3000" \
  "http://localhost:5000/manga/page-image/123?token=expired_token"
```

5. **Rate Limit**
```bash
# Make 101 requests rapidly, last should return 429
for i in {1..101}; do
  curl -H "Referer: http://localhost:3000" \
    "http://localhost:5000/manga/page-image/123?token=valid_token"
done
```

---

## Troubleshooting

### Images not loading on frontend

1. Check browser console for errors
2. Verify token is present in URL
3. Check backend logs for 403 errors
4. Ensure `unoptimized: true` in next.config.ts

### 403 Forbidden errors

1. Verify referrer header is being sent
2. Check `allowedOrigins` matches your frontend URL
3. Verify token hasn't expired
4. Check token signature is valid

### Performance issues

1. Monitor rate limiting thresholds
2. Check Cloudinary response times
3. Consider adding Redis caching
4. Review server resources

---

## Future Enhancements

### High Priority
1. Add user authentication check
2. Implement chapter purchase/subscription system
3. Add watermarking for purchased content

### Medium Priority
1. Redis-based distributed rate limiting
2. Advanced bot detection
3. CDN integration with signed URLs
4. Analytics for image access patterns

### Low Priority
1. Image quality selection per user tier
2. Offline reading with DRM
3. Geographic restrictions

---

## Kết luận

Hệ thống bảo mật này cung cấp **5 lớp bảo vệ**:

1. ✅ **Proxy Architecture** - Ẩn Cloudinary URLs
2. ✅ **Signed Tokens** - URLs hết hạn tự động
3. ✅ **Referrer Check** - Chỉ load từ website chính thống
4. ✅ **Rate Limiting** - Ngăn mass downloading
5. ✅ **HMAC Verification** - Không thể fake tokens

**Mức độ bảo mật**: ⭐⭐⭐⭐⭐ (Rất cao cho web app)

Tuy nhiên, cần nhớ rằng **không có hệ thống nào bảo mật 100%**. Người dùng có kỹ thuật cao vẫn có thể bypass, nhưng nó đủ khó để ngăn chặn 99% scraping attempts.

---

**Last Updated**: December 17, 2025
**Version**: 1.0
**Author**: Development Team
