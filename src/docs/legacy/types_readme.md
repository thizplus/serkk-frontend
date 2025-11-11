# Type Definitions

This directory contains all TypeScript type definitions for the application, organized by purpose.

## File Structure

```
lib/types/
├── common.ts      # Common types (API responses, pagination, enums)
├── models.ts      # Data models (User, Post, Comment, etc.)
├── request.ts     # Request payloads for API calls
├── response.ts    # Response structures from API
├── index.ts       # Central export file
└── README.md      # This file
```

## Usage

### Import from index file (recommended)

```typescript
import type {
  User,
  Post,
  CreatePostRequest,
  ListPostsResponse
} from '@/lib/types';
```

### Import from specific files

```typescript
import type { User } from '@/lib/types/models';
import type { CreatePostRequest } from '@/lib/types/request';
```

## File Descriptions

### `common.ts`
Shared types used across the application:
- `ApiResponse<T>` - Generic API response wrapper
- `ApiErrorResponse` - Error response structure
- `PaginationMeta` - Pagination metadata
- `PaginatedResponse<T>` - Paginated data wrapper
- Enums: `SortBy`, `VoteType`, `MediaType`, `NotificationType`, etc.

### `models.ts`
Entity models returned from the API:
- `User` - User account information
- `Post` - Social media post
- `Comment` - Post comment/reply
- `Media` - Uploaded media (image/video)
- `Tag` - Content tag
- `Notification` - User notification
- `Vote` - Vote record
- And more...

### `request.ts`
Request payload types for API calls:
- `RegisterRequest` - User registration
- `LoginRequest` - User login
- `CreatePostRequest` - Create new post
- `UpdateProfileRequest` - Update user profile
- Parameter types for queries (pagination, sorting, filtering)
- And more...

### `response.ts`
API response structures:
- `LoginResponse` - Login response with token
- `ListPostsResponse` - Paginated posts
- `GetProfileResponse` - User profile data
- All responses extend `ApiResponse<T>`
- And more...

## Type Naming Conventions

### Models
- PascalCase
- Singular nouns
- Example: `User`, `Post`, `Comment`

### Requests
- PascalCase ending with `Request`
- Verb + Noun pattern
- Example: `CreatePostRequest`, `UpdateProfileRequest`

### Responses
- PascalCase ending with `Response`
- Verb + Noun pattern
- Example: `GetPostResponse`, `ListPostsResponse`

### Common Types
- PascalCase for interfaces
- UPPER_SNAKE_CASE for constants
- Example: `ApiResponse`, `PaginationMeta`

## Adding New Types

When adding new types:

1. **Determine the category:**
   - Is it a data model? → `models.ts`
   - Is it a request payload? → `request.ts`
   - Is it a response structure? → `response.ts`
   - Is it shared/common? → `common.ts`

2. **Follow naming conventions:**
   - Models: `ModelName`
   - Requests: `VerbNounRequest`
   - Responses: `VerbNounResponse`

3. **Add JSDoc comments:**
   ```typescript
   /**
    * User account information
    */
   export interface User {
     // ...
   }
   ```

4. **Export from index.ts:**
   Types are automatically exported via `export * from './filename'`

## Examples

### Using Models
```typescript
import type { User, Post } from '@/lib/types';

const user: User = {
  id: '123',
  username: 'johndoe',
  // ... other fields
};

const post: Post = {
  id: '456',
  title: 'My Post',
  author: user,
  // ... other fields
};
```

### Using Request/Response Types
```typescript
import type { CreatePostRequest, CreatePostResponse } from '@/lib/types';

const createPost = async (data: CreatePostRequest): Promise<CreatePostResponse> => {
  const response = await fetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};
```

### Using Generic API Response
```typescript
import type { ApiResponse, Post } from '@/lib/types';

const handleResponse = (response: ApiResponse<Post>) => {
  if (response.success) {
    console.log('Post:', response.data);
  } else {
    console.error('Error:', response.error);
  }
};
```

## Type Safety Benefits

✅ **Autocomplete** - IDE suggestions for all properties
✅ **Type Checking** - Catch errors at compile time
✅ **Refactoring** - Safely rename and restructure
✅ **Documentation** - Self-documenting code
✅ **Consistency** - Ensures API contract compliance
