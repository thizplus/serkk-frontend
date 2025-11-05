## API Services

This directory contains all API service functions for communicating with the backend.

## Structure

```
lib/services/
├── api/
│   ├── auth.service.ts         # Authentication (login, register, OAuth)
│   ├── user.service.ts         # User profile management
│   ├── post.service.ts         # Post CRUD, feed, crosspost
│   ├── comment.service.ts      # Comment CRUD, nested replies
│   ├── vote.service.ts         # Voting on posts/comments
│   ├── follow.service.ts       # Follow/unfollow users
│   ├── saved.service.ts        # Saved posts management
│   ├── notification.service.ts # Notifications
│   ├── tag.service.ts          # Tag operations
│   ├── search.service.ts       # Search functionality
│   └── media.service.ts        # Media upload
├── http-client.ts              # Base HTTP client (axios)
├── index.ts                    # Export all services
└── README.md                   # This file
```

## Usage

### Import Services

```typescript
import {
  AuthService,
  PostService,
  CommentService,
  // ... other services
} from '@/lib/services';
```

### Authentication Example

```typescript
import { AuthService } from '@/lib/services';

// Register
const registerData = {
  email: 'user@example.com',
  username: 'johndoe',
  password: 'password123',
  displayName: 'John Doe'
};
const response = await AuthService.register(registerData);

// Login
const loginData = {
  email: 'user@example.com',
  password: 'password123'
};
const loginResponse = await AuthService.login(loginData);
// Token is automatically stored

// Logout
AuthService.logout();
```

### Post Example

```typescript
import { PostService } from '@/lib/services';

// Create post
const newPost = await PostService.createPost({
  title: 'My Post Title',
  content: 'Post content here...',
  tags: ['programming', 'tutorial'],
  mediaIds: ['media-uuid-1']
});

// Get posts with pagination
const posts = await PostService.listPosts({
  offset: 0,
  limit: 20,
  sortBy: 'hot'
});

// Get single post
const post = await PostService.getPost('post-uuid');

// Update post
await PostService.updatePost('post-uuid', {
  title: 'Updated Title',
  content: 'Updated content'
});

// Delete post
await PostService.deletePost('post-uuid');
```

### Comment Example

```typescript
import { CommentService } from '@/lib/services';

// Create comment
const comment = await CommentService.createComment({
  postId: 'post-uuid',
  content: 'My comment',
  parentId: null // or parent comment ID for reply
});

// Get comments for post
const comments = await CommentService.getCommentsByPostId('post-uuid', {
  sortBy: 'hot',
  offset: 0,
  limit: 50
});

// Get comment tree (nested replies)
const tree = await CommentService.getTree('comment-uuid', {
  maxDepth: 5
});
```

### Vote Example

```typescript
import { VoteService } from '@/lib/services';

// Vote on post
await VoteService.vote({
  targetId: 'post-uuid',
  targetType: 'post',
  voteType: 'upvote'
});

// Unvote
await VoteService.unvote('post', 'post-uuid');

// Check vote status
const voteStatus = await VoteService.getUserVote('post', 'post-uuid');
```

### Media Upload Example

```typescript
import { MediaService } from '@/lib/services';

// Upload image with progress
const imageFile = event.target.files[0];
const response = await MediaService.uploadImage(
  imageFile,
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
);

// Upload video
const videoFile = event.target.files[0];
const videoResponse = await MediaService.uploadVideo(
  videoFile,
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
);
```

### Search Example

```typescript
import { SearchService } from '@/lib/services';

// Search all
const results = await SearchService.search({
  q: 'golang',
  type: 'all',
  limit: 20
});

// Search posts only
const postResults = await SearchService.search({
  q: 'tutorial',
  type: 'post',
  limit: 10
});
```

## Features

### Automatic Token Management
- Token is automatically injected into all requests
- Token is stored on successful login
- Token is cleared on logout or 401 errors

### Error Handling
- Automatic redirect to login on 401 Unauthorized
- Structured error responses
- Type-safe error handling

### Type Safety
- All functions are fully typed
- Request and response types from `@/lib/types`
- Autocomplete support in IDE

### Upload Progress
- Media uploads support progress callbacks
- Real-time upload progress tracking

## HTTP Client

The base HTTP client (`http-client.ts`) provides:

- **Interceptors**: Auto-inject auth token
- **Error Handling**: Automatic 401 handling
- **Token Storage**: localStorage management
- **Generic Methods**: `get()`, `post()`, `put()`, `del()`, `upload()`

### Direct HTTP Client Usage

```typescript
import { get, post, put, del } from '@/lib/services/http-client';

// GET request
const data = await get<ResponseType>('/api/endpoint');

// POST request
const response = await post<ResponseType>('/api/endpoint', { data });

// PUT request
const updated = await put<ResponseType>('/api/endpoint', { data });

// DELETE request
const deleted = await del<ResponseType>('/api/endpoint');
```

## Error Handling

All services return promises that can be caught:

```typescript
try {
  const post = await PostService.createPost(data);
  console.log('Success:', post);
} catch (error) {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data;
    console.error('API Error:', apiError?.message);
    console.error('Error code:', apiError?.error);
  }
}
```

## Best Practices

1. **Always use try-catch** for error handling
2. **Use TypeScript types** from `@/lib/types`
3. **Import from index** (`@/lib/services`) for consistency
4. **Handle loading states** in components
5. **Display user-friendly error messages** from API responses

## Contributing

When adding new services:

1. Create service file in `api/` directory
2. Follow existing naming conventions
3. Import types from `@/lib/types`
4. Export all functions
5. Add to `index.ts`
6. Update this README with examples
