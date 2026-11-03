# Caching Strategy

GeoAttend now implements a two-layer caching strategy optimized for free tier deployment.

## Client-Side Caching (TanStack Query)

### Benefits
- **Reduced API calls**: Data is cached in memory and reused
- **Background refetching**: Stale data is updated automatically
- **Optimistic updates**: UI updates immediately before server confirms
- **Better UX**: Instant navigation with cached data

### Cache Durations

| Data Type | Stale Time | Cache Time | Reason |
|-----------|------------|------------|--------|
| User profile (`/me`) | 5 minutes | 10 minutes | Rarely changes |
| User history | 2 minutes | 10 minutes | Updates only on new check-ins |
| Nearby sessions | 30 seconds | 10 minutes | Changes moderately |
| Session details | 1 minute | 10 minutes | Static once opened |
| Creator's sessions | 1 minute | 10 minutes | Changes occasionally |
| Session records | 10 seconds | 10 minutes | Updates frequently during active sessions |

### Usage

The app now provides cached hooks alongside the existing `useAsync`:

```typescript
// Old way (still works)
const me = useAsync(() => meApi.get(), []);

// New way (with caching)
import { useMe } from '../hooks/useCachedApi';
const { data, isLoading, error } = useMe();
```

Available cached hooks:
- `useMe()` - Current user
- `useMeHistory()` - Check-in history
- `useNearbySessions(fix)` - Nearby sessions
- `useSession(id, fix, token)` - Session details
- `useSessionRecords(id)` - Session records
- `useMySessions(status)` - Creator's sessions
- `useMySession(id)` - Creator's single session
- `useUpdateMe()` - Mutation for updating profile
- `useCheckIn()` - Mutation for check-in
- `useInvalidateSessions()` - Manual cache invalidation

## Server-Side Caching (HTTP Headers)

### Benefits
- **Reduced database queries**: Responses cached by browser/CDN
- **Faster cold starts**: Less work for free tier server
- **304 Not Modified**: ETags save bandwidth
- **Better scalability**: CDN can serve cached responses

### Cache Strategies

| Route | Strategy | Duration | ETag | Description |
|-------|----------|----------|------|-------------|
| `GET /me` | `userPrivate` | 2 minutes | ✅ | Private user data |
| `GET /me/history` | `userPrivate` | 2 minutes | ✅ | Check-in history |
| `POST /sessions/nearby` | `short` | 30 seconds | ✅ | Session list |
| `GET /sessions/:id` | `short` | 30 seconds | ✅ | Session details |
| `GET /sessions/mine` | `userPrivate` | 2 minutes | ✅ | Creator's sessions |
| `GET /sessions/mine/:id` | `userPrivate` | 2 minutes | ✅ | Creator's session detail |
| `GET /sessions/:id/records` | `realtime` | 10 seconds | ✅ | Active session records |
| `GET /sessions/:id/export.csv` | `none` | - | ❌ | Always fresh CSV |
| `GET /sessions/:id/live` | `none` | - | ❌ | Server-sent events |

### Cache-Control Headers

```
Cache-Control: private, max-age=120, stale-while-revalidate=60
ETag: "abc123"
```

- **private**: Only browser caches, not CDNs
- **max-age**: How long the response is "fresh"
- **stale-while-revalidate**: Serve stale content while fetching fresh
- **ETag**: Hash of response body for conditional requests

### ETags

When the browser has a cached response with an ETag:
1. Browser sends `If-None-Match: "abc123"`
2. Server compares with current ETag
3. If match → `304 Not Modified` (no body)
4. If different → `200 OK` with new body and ETag

## Performance Impact

### Before Caching
- Every page load = Fresh API calls
- Every navigation = Full refetch
- Cold start = 15-30 seconds
- Average response time = 500ms - 2s

### After Caching
- Most navigations = Instant (from cache)
- Background updates = Transparent
- Cold start still slow, but cached data available
- Average response time = 50ms (cache hit) or 200-500ms (revalidate)

## Free Tier Considerations

### Render.com Free Tier
- **Cold starts**: 15-30 seconds after 15 min idle
- **Caching helps**: Reduces database queries during cold period
- **Stale-while-revalidate**: Serves cached data during cold start

### MongoDB Atlas Free
- **512MB storage limit**: Not affected by caching
- **Fewer queries**: HTTP caching reduces database load
- **Better for M0**: Less stress on free cluster

## Cache Invalidation

### Automatic
- TanStack Query invalidates on mutations
- ETags prevent stale data automatically

### Manual
```typescript
const { invalidateAll, invalidateNearby, invalidateMine } = useInvalidateSessions();

// After creating a session
invalidateMine();

// After updating location
invalidateNearby();
```

## Testing Cache

### Check HTTP Headers
```bash
curl -I https://your-api.onrender.com/api/me
```

Look for:
```
Cache-Control: private, max-age=120
ETag: "abc123def456"
```

### Check TanStack Query
Open React DevTools → TanStack Query tab → See cached queries

### Test ETag
```bash
# First request
curl -i https://your-api.onrender.com/api/me

# Second request with ETag
curl -i https://your-api.onrender.com/api/me \
  -H "If-None-Match: \"abc123def456\""
  
# Should return 304 Not Modified
```

## Migration Path

The caching layer is **additive** - existing code still works:
- `useAsync` hook unchanged
- API endpoints unchanged
- Gradually migrate to cached hooks as needed

## Future Enhancements

- [ ] Add Redis for server-side caching (when scaling)
- [ ] Implement service worker for offline support
- [ ] Add CDN caching for public routes
- [ ] Implement background sync for mutations
